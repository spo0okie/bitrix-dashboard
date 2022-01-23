let $globalTaskApiUri=$globalApiUri+'task';


function taskRenderMouseOver($elem) {
    $globalHoveredTask=$elem;
    let $taskId=$elem.attr('data-task-id');
    let $parentId=$elem.attr('data-parent-id');
    $('li[data-task-id='+$taskId+']').addClass('hovered');
    $('li[data-task-id='+$parentId+']').addClass('parentTask');
    $('li[data-parent-id='+$taskId+']').addClass('childTask');
}

function taskRenderMouseOut($elem) {
    let $taskId=$elem.attr('data-task-id');
    let $parentId=$elem.attr('data-parent-id');
    $('li[data-task-id='+$taskId+']').removeClass('hovered');
    $('li[data-task-id='+$parentId+']').removeClass('parentTask');
    $('li[data-parent-id='+$taskId+']').removeClass('childTask');
}

function taskUpdateStatus($taskId,$newStatus,$confirm) {
    taskRenderMouseOut($globalHoveredTask);
    if (!confirm($confirm)) return false;

    //сохраняем новые значения
    $.ajax({
        url:'/reviakin/dev2.php?task='+$taskId+'&status='+$newStatus,
        error: function () {
            $('.task-'+$taskId+':visible').effect(
                "highlight",
                {color:'red'},
                400,
            )
        },
        success: function () {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            loadTaskById($taskId);
        },
    });
    return false;

}

function taskOnStopDrag($item,$oldContainer,$newContainer) {
    //задача
    let $taskId=$item.attr('data-task-id');
    //юзер ячейки
    let $itemUser=$item.attr('data-user-id');

    let $oldTd=$oldContainer.parent('td.userColumn');
    let $oldPeriod=$oldTd.parents('div.row');
    let $newTd=$newContainer.parent('td.userColumn');
    let $newPeriod=$newTd.parents('div.row');


    let $oldUserId=     $oldTd.attr('data-user-id');
    let $oldDate=       $oldPeriod.attr('data-unix-end-date')>0?  //если в этом периоде есть крайний срок,
        Number($oldPeriod.attr('data-unix-end-date'))-7*3600*1000: //то ориентируемся на него
        'null';

    //let $newUserName=   $newContainer.attr('username');
    let $newUserName=   $newTd.attr('data-user-name');
    let $newUserId=     $newTd.attr('data-user-id');
    let $newDate=       $newPeriod.attr('data-unix-end-date')>0?  //если в этом периоде есть крайний срок,
        Number($newPeriod.attr('data-unix-end-date'))-7*3600*1000: //то ориентируемся на него
        'null';

    let newSorting=getNewItemSortIndex($item);
    console.log('placing at date='+$newDate+', sort='+newSorting);

    let $confirm="Задача №"+$taskId+"\n";
    let $needConfirm=false;
    let $changes=[];

    if ($oldUserId!==$newUserId) {
        $confirm+="Выставляем ответственным "+$newUserName+"\n"
        $changes.push('responsible='+$newUserId)
        $needConfirm=true;
    }

    if ($oldDate!==$newDate) {
        if ($newDate=='null') {
            $confirm+="Срок выполнения убираем (в долгий ящик)\n"
        } else {
            $confirm+="Срок выполнения на "+unixTimeToMyDateTime($newDate)+"\n"
        }
        $needConfirm=true;
        $changes.push('deadline='+$newDate/1000);
    }

    if ($item.attr('data-sorting')!==newSorting) {
        $changes.push('sorting='+newSorting);
        $item.attr('data-sorting',newSorting);
    }


    $confirm+="Сохранить изменения?"

    if (!$changes.length || ($needConfirm && !confirm($confirm)))
    {
        console.log('nothing to save')
        return false;
    }

    //сохраняем новые значения
    $.ajax({
        url:$globalTaskApiUri+'/update/'+$taskId+'/?'+$changes.join('&'),
        context: $item,
        error: function () {
            $('.task-'+$taskId+':visible').effect(
                "highlight",
                {color:'red'},
                400,
            )
        },
        success: function () {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            loadTaskById($taskId);
            return true;
        },
    });
}



function userTaskCreate($periodId,$userId,$date) {
    let $parent=$('td[periodId='+$periodId+'][userId='+$userId+'].userColumn > ul.openItems');
    let $newItem=$('<li class="userItem userTask"><form class="edit" style="display: none"></form></li>');

    $newItem.data('taskDeadline',$date);
    $newItem.data('userId',$userId);

    userJobInsertInList($newItem,$parent);
    let $form=$job.children('form.edit');
    let $preview=$job.children('span.preview');
    let $oldText=$preview.html().replace(/<br\s*[\/]?>/gi,"\n");
    let $jobId=$job.data('jobid');
    let $jobClosed=false;
    console.log('editing job '+$jobId);

    $input=$('<textarea name="description" rows='+Math.max(1,$oldText.split("\n").length)+' class="jobDescription visible" />');

    /*
    //вариант с Ctrl+Enter
    $input.on('keydown',function(e){
        console.log('wow! such a key...');
        if (e.key === "Escape") {userJobCancelEdit($job)}
        if (e.key === "Enter" && e.ctrlKey) {userJobStopEdit($job)}
    })*/

    $input.on('keydown',{input:$input},function(event){
        let $input=event.data.input;
        if (event.key === "Escape") {userJobCancelEdit($job); event.preventDefault(); return false;}
        if (event.key === "Enter" && event.altKey) {
            if ($input.prop('selectionStart') || $input.prop('selectionStart') == '0') {
                console.log('inserting CRLF');
                let startPos = $input.prop('selectionStart') ;
                let endPos = $input.prop('selectionEnd') ;
                let curValue=$input.val();
                $input.val(
                    curValue.substring(0, startPos)
                    + "\r\n"
                    + curValue.substring(endPos, curValue.length)
                );
                startPos++;
                $input.prop('selectionStart',startPos);
                $input.prop('selectionEnd',startPos);
            } else {
                console.log('adding CRLF');
                $input.val($input.val() + "\r\n");
            }
            event.preventDefault();
            return false;
        }
        if (event.key === "Enter") {userJobStopEdit($job); event.preventDefault(); return false;}
    });

    $form.append($input);

    $job.data('oldText',$oldText);
    $input.val($oldText);

    $form.click(function () {return false;})

    $preview.hide();
    $form.show();

    $form.focusout(function () {userJobStopEdit($job)})
    $input.focus();
    $input.autoResize({extraSpace:0,minLines:1}).trigger('change.dynSiz');

    //console.log($job);
    return false;    //$form.modal();
}


function userTaskCreateEmptyItem() {
    let $li=$('<li class="userItem userTask"></li>');
    let $title=$('<a class="task-title-link modal-link"></a>').modalLink({
        width: 1080,
        height: $(window).height()*0.9,
    }).on("modallink.close",function() {
        //console.log("need update task "+$li.attr('data-task-id'));
        loadTaskById($li.attr('data-task-id'));
    });
    let $footer=$('<span class="userTaskFooter"><span class="deadline"></span><span class="priority"></span><span class="msgStatus"><span class="task-item-updates-inner"></span></span></span>');
    $li.mouseenter(function (){taskRenderMouseOver($li)});
    $li.mouseleave(function (){taskRenderMouseOut($li)});

    return $li.append($title).append($footer);
}

function userTaskUpdateFromJson($li,json) {
    let id=json['ID'];
    let parentId=json['PARENT_ID'];
    let responsibleId=json['RESPONSIBLE_ID'];
    let accomplicesIds=json['ACCOMPLICES']
    let status=Number(json['REAL_STATUS']);
    let deadline=json['DEADLINE']?bitrixDateTimeToUnix(json['DEADLINE']):0;
    let closedDate=bitrixDateTimeToUnix(json['CLOSED_DATE']);
    let sorting=json["XML_ID"]?json["XML_ID"]:null;
    let priority=json['PRIORITY'];

    let stopConfirm="Приостановить выполнение задачи "+id+"?"
    let startConfirm="Начать выполнение задачи "+id+"?"
    let needReplacing=false;

    let $taskTitle=$li.children('a.task-title-link');
    let $footer=$li.children('span.userTaskFooter');
    let viewUrl = '/company/personal/user/'+responsibleId+'/tasks/task/view/'+id+'/';

    if ($li.attr('data-task-id')!==id) {
        $li.attr('data-task-id',id);
        //тут с большой вероятностью у нас просто
        needReplacing=true;
    }

    $li.attr('data-parent-id',parentId);

    if (priority!==$li.attr('data-priority')) {
        $li.attr('data-priority',priority);
        let $priority=$footer.children('span.priority');
        switch (Number(priority)) {
            case 0: $priority.html('<span class="lowPriority">Низкий</span>'); break;
            case 1: $priority.html('<span class="midPriority">Средний</span>'); break;
            case 2: $priority.html('<span class="hiPriority">Высокий</span>'); break;
        }
    }

    if ($li.attr('data-responsible-id')!==responsibleId) {
        $li.attr('data-responsible-id',responsibleId);
        if ($li.attr('data-responsible-id')!==$li.attr('data-user-id')) {
            $li.addClass('dimmedOut');
            if (!$globShowParticipants) $li.hide();
        } else {
            $li.removeClass('dimmedOut');
            $li.show();
        }
        //тут у нас может быть перераспределение по пользователям
        needReplacing=true;
    }

    if ($li.attr('data-accomplices-ids')!==accomplicesIds) {
        $li.attr('data-accomplices-ids',accomplicesIds);
        //тут у нас может быть перераспределение по пользователям
        needReplacing=true;
    }

    if ($li.attr('data-deadline')!==deadline) {
        needReplacing=true;
        //тут перемещение по вертикали в другую ячейку
        $li.attr('data-deadline',deadline)
    }

    if ($li.attr('data-closed-date')!==closedDate) {
        $li.attr('data-closed-date',closedDate);
        //тут перемещение по вертикали в другую ячейку или смена статуса (открыто|закрыто)
        needReplacing=true;
    }

    if ($li.attr('data-sorting')!==sorting) {
        $li.attr('data-sorting',sorting);
        //тут перемещение внутри текущего списка точно будет нужно
        needReplacing=true;
    }


    if ($li.attr('data-status')!==status) {
        $li.attr('data-status',status);
        let $status=$footer.children('span.msgStatus');
        let strStatus="не известно";
        switch (status) {
            case 4:     strStatus="Ож. подтв.";  break;
            case 5:     strStatus="Завершена";  break;
            case 6:     strStatus="Отложена";  break;
            case 7:     strStatus="Отменена";  break;

            case -1:    strStatus="<span class='red'>Просрочено</span>";  break;
            case 1:     strStatus="<span class='clickable' onclick='taskUpdateStatus("+id+",3,\""+startConfirm+"\");'>Новая</span>";  break;
            case 2:     strStatus="<span class='clickable' onclick='taskUpdateStatus("+id+",3,\""+startConfirm+"\");'>Ож. запуска</span>";  break;
            case 3:     strStatus="<span class='clickable' onclick='taskUpdateStatus("+id+",2,\""+stopConfirm+"\");'>В работе</span>";  break;
        }
        if (status===4) //обводим рамочкой задачи которые надо закрыть
            $li.addClass('closeMe');
        else
            $li.removeClass('closeMe');

        if (json['UPDATES_COUNT']) {
            strStatus+='<a href="'+viewUrl+'#updates" class="task-item-updates" title="Изменения ('+json['UPDATES_COUNT']+')">'+
                '<span class="task-item-updates-inner">'+json['UPDATES_COUNT']+'</span>'+
            '</a>';
        }

        $status.html(strStatus);

        if (status===3) {
            $li.addClass('activeNow');
        } else {
            $li.removeClass('activeNow');
        }
    }

    let $deadline=$footer.children('span.deadline');
    if (closedDate && (status===5 || status===6)) {
        $li.addClass('closed').removeClass('open');
        $li.attr('data-timestamp',closedDate);
        $deadline.html($.datepicker.formatDate( "dd.mm.y", new Date(closedDate)));
    } else {
        $li.addClass('open').removeClass('closed')
        $li.attr('data-timestamp',deadline?Math.max(deadline,$globToday):0);
        $deadline.html(deadline?$.datepicker.formatDate( "dd.mm.y", new Date(deadline)):'нет срока');
    }


    $taskTitle.html(id+": "+json['TITLE']);
    $taskTitle.attr('href',viewUrl+'?IFRAME=Y');

}

/**
 * Либо создает новый элемент
 * либо обновляет существующий переданными данными
 * @param data
 */
function userTaskInitItemsData(data) {
    let id=data['ID'];
    let users=[data['RESPONSIBLE_ID']];
    let accomplices=data['ACCOMPLICES'];
    if (Array.isArray(accomplices) && accomplices.length) {
        accomplices.forEach(function(item,index){
            if (users.indexOf(item)===-1) {
                users.push(item)
            }
        })
    }
    $('li.userTask[data-task-id='+id+']').each(function(){
        console.log(this);
        if (users.indexOf($(this).attr('data-user-id'))===-1) {
            $(this).remove();
        }
    });
    users.forEach(function(user,index){
        if (!($globUserList.has(Number(user)))) {
            //пропускаем пользователей, которые не входят в наш список (в задаче может быть целая толпа ведь)
            //console.log("user "+user+" not in list",$globUserList);
            return;
        }
        let $item=$('li.userTask[data-task-id='+id+'][data-user-id='+user+']');
        if (!$item.length) {
            $item=userTaskCreateEmptyItem();
            $item.attr('data-task-id',id);
            $item.attr('data-item-id',id);
            $item.attr('data-user-id',user);
        }
        userTaskUpdateFromJson($item,data);
        placeCanbanItemCorrect($item);
    })
}


function renderNewTaskLink($td)
{
    //let $td=$ul.parents('td.userColumn');

    return $("<li class='createTask'><span class='newTask' >Создать задачу</span></li>").click(function(e){
        e.stopPropagation();
        let $period=$td.parents('div.row');
        let userId=$td.attr('data-user-id');
        let deadline=$period.attr('data-bx-start-date')+' 17:00:00';

        let newTaskUrl="/company/personal/user/"+userId+"/tasks/task/edit/0/"+
            "?DEADLINE="+deadline+
            "&ALLOW_CHANGE_DEADLINE=N"+
            "&AUDITORS_IDS="+$globAuditorsIds+
            "&GROUP_ID="+$globGroupId;
        window.open(newTaskUrl,"_blank");
    });
    //return $li;
}


function loadTasks(from,to,users,onComplete=null) {
    //загружаем элементы
    //console.log(users);
    //console.log('loading tasks for users '+users.join(',')+' from '+unixTimeToMyDate(from*1000)+' to '+unixTimeToMyDate((to-1)*1000));
    $.ajax({
        url: $globalTaskApiUri+'/load/'+from+'/'+to+'/'+users.join(','),
        error: function () {
            console.log('error loading tasks')
            if (onComplete) onComplete();
        },
        success: function (data) {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            console.log('got task items')
            let json = $.parseJSON(data);
            json.forEach(function(item){userTaskInitItemsData(item)});
            if (onComplete) onComplete();
            return true;
        },
    });

}

function loadTaskById(id) {
    //загружаем элементы
    //console.log(users);
    console.log('loading task ID '+id);
    $.ajax({
        url: $globalTaskApiUri+'/get/'+id,
        error: function () {
            console.log('error loading tasks')
        },
        success: function (data) {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            //console.log('got task item')
            let json = $.parseJSON(data);
            json.forEach(function(item){userTaskInitItemsData(item)});
            //scrollToAnchor($globScrollPos);
            return true;
        },
    });

}