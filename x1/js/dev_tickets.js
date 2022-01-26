let $globalTicketApiUri=$globalApiUri+'ticket';


function ticketRenderMouseOver($elem) {
    let ticketId=$elem.attr('data-ticket-id');
    let $children=$('li[data-parent-ticket-id=' + ticketId + ']');
    if ($children.length) {
        $('li[data-ticket-id='+ticketId+']').addClass('hovered');
        $($children).addClass('childTask');
    }
}

function ticketRenderMouseOut($elem) {
    let ticketId=$elem.attr('data-ticket-id');
    let $children=$('li[data-parent-ticket-id=' + ticketId + ']');
    if ($children.length) {
        $('li[data-ticket-id=' + ticketId + ']').removeClass('hovered');
        $($children).removeClass('childTask');
    }
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
    $li.mouseenter(function (){ticketRenderMouseOver($li)});
    $li.mouseleave(function (){ticketRenderMouseOut($li)});

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
        $item.attr('data-item-id',id);
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
            console.log('error loading tickets')
        },
        success: function (data) {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            //console.log('got ticket item')
            let json = $.parseJSON(data);
            json.forEach(function(item){userTicketInitItemData(item)});
            //scrollToAnchor($globScrollPos);
            return true;
        },
    });
}