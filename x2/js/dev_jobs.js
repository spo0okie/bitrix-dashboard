let $globalJobApiUri=$globalApiUri+'job';

function userJobRenderMouseOver($elem) {
    //$globalHoveredTask=$elem;
    //let $taskId=$elem.attr('data-task-id');
    let taskId=$elem.attr('data-parent-id');
    let ticketId=$elem.attr('data-parent-ticket-id');
    if (taskId) {
        $('li.userTask[data-task-id='+taskId+']').addClass('hovered');
        $('li.userJob[data-parent-id='+taskId+']').addClass('childTask');
    }
    if (ticketId) {
        $('li.userTicket[data-ticket-id='+ticketId+']').addClass('hovered');
        $('li.userJob[data-parent-ticket-id='+ticketId+']').addClass('childTask');
    }
}

function userJobRenderMouseOut($elem) {
    let taskId=$elem.attr('data-parent-id');
    let ticketId=$elem.attr('data-parent-ticket-id');
    if (taskId) {
        $('li.userTask[data-task-id='+taskId+']').removeClass('hovered');
        $('li.userJob[data-parent-id='+taskId+']').removeClass('childTask');
    }
    if (ticketId) {
        $('li.userTicket[data-ticket-id='+ticketId+']').removeClass('hovered');
        $('li.userJob[data-parent-ticket-id='+ticketId+']').removeClass('childTask');
    }
}

/**
 * Создание LI пустого элемента "работа"
 * @returns {*|jQuery.fn.init|jQuery|HTMLElement}
 */
function userJobCreateEmptyItem()
{
    let $li=$('<li class="userJob userItem">');
    $li.click(function(){userJobEdit($li)});
    let $toggle=$('<span class="jobToggle"></span>');
    $toggle.click(function(event){
        userJobCloseToggle($li);
        event.stopPropagation();
    });
    let $preview=$('<span class="preview"></span>');
    let $form=$('<form class="edit" style="display: none"></form>');

    $li.append($toggle);
    $li.append($preview);
    $li.append($form);
    $li.mouseenter(function (){userJobRenderMouseOver($li)});
    $li.mouseleave(function (){userJobRenderMouseOut($li)});

    return $li;
}

/**
 * Кнопочка создания новой работы (открытой или закрытой в зависимости от родительского списка)
 * @param $ul
 * @returns {boolean}
 */
function userJobCreateNew($ul) {
    let $td=$ul.parents('td.userColumn');
    let $period=$td.parents('div.row');
    //console.log($td);
    //console.log($period);
    let userId=$td.attr('data-user-id')
    let date=$period.attr('data-unix-start-date');
    //let endDate=$period.attr('data-unix-end-date');
    let closed=$ul.hasClass('closedItems');
    console.log('using date '+date);

    let $newItem=userJobCreateEmptyItem();
    $newItem.addClass(closed?'closed':'open')

    $newItem.attr('data-job-start',date);
    if (closed) $newItem.attr('data-job-end',date);
    $newItem.attr('data-user-id',userId);
    $newItem.attr('data-timestamp',date);

    //let $ul=findCanbanUlForItem($newItem);
    $newItem.attr('data-sorting',getUlMaxSortingIndex($ul)+100);
    placeCanbanItemCorrect($newItem);
    userJobEdit($newItem);
    return false;
    //$form.modal();
}

/**
 * Переключение закрыть/открыть работу
 * @param $job
 * @returns {boolean}
 */
function userJobCloseToggle($job) {
    let $jobId=$job.attr('data-job-id');
    if (!$jobId) {
        console.log('cant toggle unsaved item')
        return false;
    }
    const timestamp = Math.floor(Date.now());
    console.log('toggling '+$jobId);
    if ($job.attr('data-job-end')) {
        if (!confirm("Вернуть в работу?")) return false;
        $job.removeClass('closed').addClass('open');
        $job.attr('data-job-end',null)
        if (!$job.attr('data-job-start')) {
            $job.attr('data-job-start', timestamp)
            $job.attr('data-timestamp', timestamp)
        }
    } else {
        $job.removeClass('open').addClass('closed');
        $job.attr('data-job-end', timestamp)
        $job.attr('data-timestamp', timestamp)
    }
    $.ajax({
        url: $globalJobApiUri+'/update/'+$jobId,
        type: "POST",
        data: {
            jobStart:$job.attr('data-job-start')/1000,
            jobEnd:$job.attr('data-job-end')/1000
        },
        error: function () {
            $job.effect("highlight",{color:'red'},400)
            console.log('error toggling job '+$jobId);
        },
        success: function () {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            placeCanbanItemCorrect($job);
            console.log('stopped toggling job '+$jobId);
        },
    });

    return false;
}


/**
 * Начать редактирование текста работы
 * @param $job
 * @returns {boolean}
 */
function userJobEdit($job) {
    let $form=$job.children('form.edit');
    let $preview=$job.children('span.preview');
    let html=$preview.html();
    let oldText=(typeof html === "string")?
        html.replace(/<br\s*[\/]?>/gi,"\n"):
        '';
    let $jobId=$job.attr('data-job-id');
    console.log('editing job '+$jobId);

    let $input=$('<textarea name="description" rows='+Math.max(1,oldText.split("\n").length)+' class="jobDescription visible" />');

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
    $input.click(function (e){e.stopPropagation();})

    $form.append($input);

    $job.attr('data-old-text',oldText);
    $input.val(oldText);

    $preview.hide();
    //$toggle.hide();
    $form.show();

    $input.focus();
    $input.autoResize({extraSpace:0,minLines:1}).trigger('change.dynSiz');
    $input.focusout(function (e) {e.stopPropagation();userJobStopEdit($job)})

    //console.log($job);
    return false;
    //$form.modal();
}

/**
 * Окончание редактирования работы
 * @param $job
 */
function userJobStopEdit($job) {
    //let $job=$('li[jobId='+$jobId+'].userJob');

    let $form=$job.children('form.edit');
    let $preview=$job.children('span.preview');
    let $input=$form.children('textarea.jobDescription.visible');
    let $oldText=$job.attr('data-old-text');
    let $newText=$input.val();
    let $jobId=$job.attr('data-job-id');
    console.log('stopping edit of '+$jobId)

    //текст удалили из ячейки
    //нужно ее удалить
    if (!($newText.trim().length)) {
        //Это реальная запись в БД
        if ($jobId) {
            $.ajax({
                url: $globalJobApiUri+'/delete/'+$jobId,
                error: function () {
                    $job.effect("highlight",{color:'red'},400)
                    console.log('error stop deleting job '+$jobId);
                },
                success: function () {
                    $job.remove();
                    console.log('removed job '+$jobId);
                },
            });
        } else {
            let $td=$job.parents('td.userColumn');
            $job.remove();
            updateUserPeriodColumnTotals($td);
        }
        return ;
    }

    if ($newText !== $oldText) {
        console.log('new text entered');
        //сохраняем новые значения

        //обновление?
        if ($jobId) {
            $.ajax({
                url: $globalJobApiUri+'/update/'+$jobId,
                type: "POST",
                data: {text:$newText},
                error: function () {
                    $job.effect("highlight",{color:'red'},400)
                    console.log('error stop editing job '+$jobId);
                },
                success: function () {
                    //обновляем текст в самой работе (а не в input)
                    $preview.html($newText.replace(/\r?\n/g,'<br>'));
                    $preview.show();
                    $form.hide();
                    $form.html(' ');

                    console.log('stopped editing job '+$jobId);
                },
            });
        } else {
            //создание
            $.ajax({
                url: $globalJobApiUri+'/create',
                type: "POST",
                data: {
                    text:$newText,
                    userId:$job.data('userId'),
                    jobStart:$job.data('jobStart')/1000,
                    jobEnd:$job.data('jobEnd')/1000,
                    sorting:$job.data('sorting'),
                },
                error: function () {
                    $job.effect("highlight",{color:'red'},400)
                    console.log('error saving new job');
                },
                success: function (data) {
                    //после сохранения добавляем ИД работы в элемент
                    let json = $.parseJSON(data); // create an object with the key of the array
                    if (json.id) {
                        $job.attr('data-job-id',json.id);
                        $job.attr('data-item-id',json.id);
                    }
                    $preview.html($newText.replace(/\r?\n/g,'<br>'));
                    userJobFindTasks($job,$newText);
                    $preview.show();
                    $form.hide();
                    $form.html(' ');

                    console.log('stopped editing job '+$jobId);
                },
            });

        }

    } else {
        $preview.show();
        $form.hide();
        $form.html(' ');
    }
}

function userJobCancelEdit($job) {
    let $form = $job.children('form.edit');
    let $preview = $job.children('span.preview');
    let $input = $form.children('textarea.jobDescription.visible');
    let $oldText = $job.attr('data-old-text');
    let $newText = $input.val();
    let $jobId = $job.attr('data-job-id') ? $job.attr('data-job-id') : 0;

    if ($newText.trim().length && $newText !== $oldText) {
        if (!confirm('Отменить изменения?')) return false;
    }
    console.log('canceling edit of ' + $jobId)

    if (!$jobId) {
        $job.remove();
    } else {
        $preview.show();
        $form.hide();
        $form.html(' ');
    }

}

function jobOnStopDrag($item,$oldContainer,$newContainer) {
    //задача
    let $jobId=$item.attr('data-job-id');
    let $oldTd=$oldContainer.parents('td.userColumn');
    let $oldPeriod=$oldTd.parents('div.row');
    let $newTd=$newContainer.parents('td.userColumn');
    let $newPeriod=$newTd.parents('div.row');

    //юзер ячейки
    //let $itemUser=$item.data('userid');


    let $oldUserId=     $oldTd.attr('data-user-id');
    let $oldDate=       $oldPeriod.attr('data-unix-start-date');

    //let $newUserName=   $newContainer.attr('username');
    let $newUserId=     $newTd.attr('data-user-id');
    let $newDate=       $newPeriod.attr('data-unix-end-date')>0?$newPeriod.attr('data-unix-start-date'):'';

    let newSorting=getNewItemSortIndex($item);
    console.log('placing at sort='+newSorting);

    let $changes= {};

    if ($oldUserId!==$newUserId) {
        $changes.userId=$newUserId
        $item.attr('data-user-id',$newUserId);
    }

    if ($oldDate!==$newDate) {
        $item.attr('data-job-start',$newDate)
        $changes.jobStart=Math.floor($newDate/1000);
    }

    if ($item.attr('data-sorting')!==newSorting) {
        $changes.sorting=newSorting;
        $item.attr('data-sorting',newSorting);
    }


    if (Object.keys($changes).length === 0)
    {
        console.log('nothing changed');
        $item.effect(
            "highlight",
            {color:'grey'},
            400,
        );
        canBanSortUl($newContainer);
        return false;
    }

    //сохраняем новые значения
    $.ajax({
        url: $globalJobApiUri+'/update/'+$jobId,
        type: "POST",
        data: $changes,
        context: $item,
        error: function () {
            $item.effect(
                "highlight",
                {color:'red'},
                400,
            )
            canBanSortUl($newContainer);
        },
        success: function () {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            $item.effect(
                "highlight",
                {color:'green'},
                400,
            )
            canBanSortUl($newContainer);
            updateUserPeriodColumnTotals($oldTd);
            updateUserPeriodColumnTotals($newTd);
            return true;
        },
    });
}

function renderNewJobLink($ul,closed)
{
    let $link=$('<li class="createJob '+(closed?'closed':'open')+'">'+
    "<span class='newJob' title='Запись о работах'>"+(closed?'Сделанная работа':'Надо сделать')+"</span>"+
    "</li>");
    $link.click(function(e){
        e.stopPropagation();
        userJobCreateNew($ul);
    });
    return $link;
}

/**
 * если в тексте обнаруживается ссылка на задачу - добавляет аттрибут к элементу
 * @param $li
 * @param $text
 */
function userJobFindTasks($li,text) {
    let taskRe=/задача\s*[#№]?\s*:?\s*(\d+)/i;
    let taskMatch=text.match(taskRe);
    if (Array.isArray(taskMatch) && taskMatch.length) {
        let taskId=taskMatch[1];
        $li.attr('data-parent-id',taskId);
    } else {
        $li.attr('data-parent-id',null);
    }
    let ticketRe=/(тикет|заявка|обращение)\s*[#№]?\s*:?\s*(\d+)/i;
    let ticketMatch=text.match(ticketRe);
    if (Array.isArray(ticketMatch) && ticketMatch.length) {
        let ticketId=ticketMatch[2];
        $li.attr('data-parent-ticket-id',ticketId);
    } else {
        $li.attr('data-parent-ticket-id',null);
    }
}


function userJobUpdateFromJson($li,data)
{
    let timeMark=null;
    if (data['DATE_ACTIVE_TO']) {
        timeMark=bitrixDateTimeToUnix(data['DATE_ACTIVE_TO']);
        $li.addClass('closed').removeClass('open');
    } else if (data['DATE_ACTIVE_FROM']) {
        timeMark=Math.max(bitrixDateTimeToUnix(data['DATE_ACTIVE_FROM']),$globToday);
        $li.addClass('open').removeClass('closed');
    }

    $li.children('span.preview').html(data['~PREVIEW_TEXT']);
    $li.attr('data-user-id',data['PROPERTY_USER_VALUE']);
    $li.attr('data-job-start',bitrixDateTimeToUnix(data['DATE_ACTIVE_FROM']));
    $li.attr('data-job-end',bitrixDateTimeToUnix(data['DATE_ACTIVE_TO']));
    $li.attr('data-timestamp',timeMark);
    $li.attr('data-sorting',data['SORT']);
    //$li.data('bitrix',data);
    userJobFindTasks($li,data['~PREVIEW_TEXT']);
    //console.log(data);
    return $li;
}


/**
 * Либо создает новый элемент
 * либо обновляет существующий переданными данными
 * @param data
 */
function userJobInitItemData(data) {
    let id=data['ID'];
    let $item=$('li.userJob[data-job-id=\''+id+'\']');
    if (!$item.length) {
        $item=userJobCreateEmptyItem();
        $item.attr('data-job-id',id);
        $item.attr('data-item-id',id);
    }
    userJobUpdateFromJson($item,data);
    placeCanbanItemCorrect($item);
}

function loadJobs(from,to,users,onComplete=null) {
    //загружаем элементы
    //console.log(users);
    //console.log('loading jobs for users '+users.join(',')+' from '+unixTimeToMyDate(from*1000)+' to '+unixTimeToMyDate((to-1)*1000));
    $.ajax({
        url: $globalJobApiUri+'/load/'+from+'/'+to+'/'+users.join(','),
        error: function () {
            console.log('error loading jobs')
            if (onComplete) onComplete();
        },
        success: function (data) {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            //console.log('got items')
            let json = $.parseJSON(data);
            json.forEach(function(item){userJobInitItemData(item)});
            if (onComplete) onComplete();
            return true;
        },
    });

}