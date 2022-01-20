let $globalJobApiUri=$globalApiUri+'job';

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
    return $li;
}

function userJobCreateNew($ul) {
    let $td=$ul.parent('td.userColumn');
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


function userJobEdit($job) {
    //$job=$($job);
    let $form=$job.children('form.edit');
    let $preview=$job.children('span.preview');
    let $toggle=$job.children('span.jobToggle');
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

function userJobStopEdit($job) {
    //let $job=$('li[jobId='+$jobId+'].userJob');

    let $form=$job.children('form.edit');
    let $preview=$job.children('span.preview');
    let $toggle=$job.children('span.jobToggle');
    let $input=$form.children('textarea.jobDescription.visible');
    let $oldText=$job.attr('data-old-text');
    let $newText=$input.val();
    let $jobId=$job.attr('data-job-id');//?$job.attr('data-job-id'):0;
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

    if ($newText != $oldText) {
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
                    //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
                    $preview.html($newText.replace(/\r?\n/g,'<br>'));
                    $preview.show();
                    //$toggle.show();
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
                    //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
                    let json = $.parseJSON(data); // create an object with the key of the array
                    if (json.id) $job.attr('data-job-id',json.id);
                    $preview.html($newText.replace(/\r?\n/g,'<br>'));
                    $preview.show();
                    //$toggle.show();
                    $form.hide();
                    $form.html(' ');

                    console.log('stopped editing job '+$jobId);
                },
            });

        }

    } else {
        $preview.show();
        //$toggle.show();
        $form.hide();
        $form.html(' ');
    }
}

function userJobCancelEdit($job) {
    let $form = $job.children('form.edit');
    let $preview = $job.children('span.preview');
    let $input = $form.children('textarea.jobDescription.visible');
    let $oldText = $job.data('oldText');
    let $newText = $input.val();
    let $jobId = $job.data('jobid') ? $job.data('jobid') : 0;
    console.log('canceling edit of ' + $jobId)

    if ($newText.trim().length && $newText !== $oldText) {
        if (!confirm('Отменить изменения?')) return false;
    }

    $preview.show();
    $form.hide();
    $form.html(' ');
}

function jobOnStopDrag($item,$oldContainer,$newContainer) {
    //задача
    let $jobId=$item.attr('data-job-id');
    let $oldTd=$oldContainer.parent('td.userColumn');
    let $oldPeriod=$oldTd.parents('div.row');
    let $newTd=$newContainer.parent('td.userColumn');
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


function userJobUpdateFromJson($li,data)
{
    let timeMark=null;
    if (data['DATE_ACTIVE_TO']) {
        timeMark=bitrixDateTimeToUnix(data['DATE_ACTIVE_TO']);
        $li.addClass('closed').removeClass('open');
    } else if (data['DATE_ACTIVE_FROM']) {
        timeMark=Math.max(bitrixDateTimeToUnix(data['DATE_ACTIVE_FROM']),Date.now()+$globServerTimeShift);
        $li.addClass('open').removeClass('closed');
    }

    $li.children('span.preview').html(data['~PREVIEW_TEXT']);
    $li.attr('data-user-id',data['PROPERTY_USER_VALUE']);
    $li.attr('data-job-start',bitrixDateTimeToUnix(data['DATE_ACTIVE_FROM']));
    $li.attr('data-job-end',bitrixDateTimeToUnix(data['DATE_ACTIVE_TO']));
    $li.attr('data-timestamp',timeMark);
    $li.attr('data-sorting',data['SORT']);
    $li.data('bitrix',data);
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
    let $item=$('li.userJob[data-job-id='+id+']');
    if (!$item.length) {
        $item=userJobCreateEmptyItem();
        $item.attr('data-job-id',id);
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