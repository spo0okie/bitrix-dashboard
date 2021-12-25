let $globalTicketApiUri='/reviakin/x0/api/ticket';


function userTicketOnStopDrag($item,$oldContainer,$newContainer) {
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
    let $newDate=       $newPeriod.attr('data-unix-start-date');

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


function userTicketCreateEmptyItem()
{

    let $li=$('<li class="userTicket userItem"></li>');
    let $a=$('<a class="task-title-link modal-link"></a>').modalLink({
        width: 1080,
        height: $(window).height()*0.9,
    }).on("modallink.close",function() {
        loadTicketById($li.attr('data-ticket-id'));
    });

    let $deadline=$('<span class="deadline"></span>');

    $li.append($a);
    $li.append($deadline);
    return $li;
}


function userTicketUpdateFromJson($li,data)
{
    let ticketId=data["ID"];
    let userId=data["RESPONSIBLE_USER_ID"];
    let status=data['LAMP'];
    let statusName=data['STATUS_NAME'];
    let lastMessageUserId=data['LAST_MESSAGE_USER_ID'];
    let lastMessageDate=data['LAST_MESSAGE_DATE']?bitrixDateTimeToUnix(data['LAST_MESSAGE_DATE']):0;
    let dateClose=data['DATE_CLOSE']?bitrixDateTimeToUnix(data['DATE_CLOSE']):0;
    let deadline=data['DEADLINE_SOURCE_DATE']?bitrixDateTimeToUnix(data['DEADLINE_SOURCE_DATE']):0;
    let viewUrl = '/bitrix/admin/ticket_edit.php?ID='+ticketId;
    let $a=$li.children('a.task-title-link');
    let $deadline=$li.children('span.deadline');

    $li.attr('data-user-id',userId);
    $li.attr('data-ticket-id',ticketId);
    $li.attr('data-message-user-id',lastMessageUserId);

    let names=data['OWNER_NAME'].trim();
    if (
        names.length
        &&
        2 in names.split(' ')
    ) {
        $a.html(ticketId+': '+ names.split(' ')[2]+': ' + data["TITLE"]);
    } else $a.html(ticketId+': '+ data["TITLE"]);
    $a.attr('href',viewUrl);

    if (status!== $li.attr('data-status')) {
        $li.attr('data-status',status);
        let statuses=['red','yellow','green','green_s'];
        $li.removeClass(statuses);
        if (statuses.indexOf(status)!==-1)
            $li.addClass(status);
    }



    if (dateClose) {
        $li.addClass('closed').removeClass('open');
        $deadline.html($.datepicker.formatDate( "dd.mm.y", new Date(lastMessageDate)))
        $li.attr('data-timestamp',lastMessageDate);
    } else if (
            data['HOLD_ON'] === 'N'
            &&
            (status==='green' || status==='green_s')
            &&
            (statusName==='Успешно решено' || statusName === 'Не представляется возможным решить')
    ) {
        $li.addClass('semiClosed').removeClass('open');
        $deadline.html($.datepicker.formatDate( "dd.mm.y", new Date(lastMessageDate)))
        $li.attr('data-timestamp',lastMessageDate);
    } else {
        $li.addClass('open').removeClass('closed');
        $deadline.html(deadline?$.datepicker.formatDate( "dd.mm.y", new Date(deadline)):'отсутствует')
        $li.attr(
            'data-timestamp',
            data['HOLD_ON']==='Y'?0:Math.max(lastMessageDate,Date.now()+$globServerTimeShift)
        );
    }
    $li.attr('data-sorting',500);
    return $li;
}


/**
 * Либо создает новый элемент
 * либо обновляет существующий переданными данными
 * @param data
 */
function userTicketInitItemData(data) {
    let id=data['ID'];
    let $item=$('li.userTicket[data-ticket-id='+id+']');
    if (!$item.length) {
        $item=userTicketCreateEmptyItem();
        $item.attr('data-ticket-id',id);
    }
    userTicketUpdateFromJson($item,data);
    placeCanbanItemCorrect($item);
}

function loadTickets(from,to,users,onComplete=null) {
    //загружаем элементы
    //console.log(users);
    //console.log('loading tickets for users '+users.join(',')+' from '+unixTimeToMyDate(from*1000)+' to '+unixTimeToMyDate((to-1)*1000));
    $.ajax({
        url: $globalTicketApiUri+'/load/'+from+'/'+to+'/'+users.join(','),
        error: function () {
            console.log('error loading')
            if (onComplete) onComplete();
        },
        success: function (data) {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            console.log('got items')
            let json = $.parseJSON(data);
            json.forEach(function(item){userTicketInitItemData(item)});
            scrollToAnchor($globScrollPos);
            if (onComplete) onComplete();
            return true;
        },
    });
}

function loadTicketById(id) {
    //загружаем элементы
    //console.log(users);
    console.log('loading ticket ID '+id);
    $.ajax({
        url: $globalTicketApiUri+'/get/'+id,
        error: function () {
            console.log('error loading ticket')
        },
        success: function (data) {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            console.log('got ticket item')
            let json = $.parseJSON(data);
            json.forEach(function(item){userTicketInitItemData(item)});
            //scrollToAnchor($globScrollPos);
            return true;
        },
    });
}