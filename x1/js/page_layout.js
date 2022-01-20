let $globalUserLayout=0;
let $maxScrollBlock=0;

function renderPageHeader() {

    let $closedToggle=$('<span id="globToggleClosed" class="clickable" title="Отображать закрытые задачи" onclick="pageToggleClosedTasks()">[^]</span>');
    let $ticketToggle=$('<span id="globToggleTickets" class="clickable" title="Отображать тикеты" onclick="pageToggleTickets()">[-]</span>');
    let $jobToggle=$('<span id="globToggleJobs" class="clickable" title="Отображать работы" onclick="pageToggleJobs()">[*]</span>');
    let $participantsToggle=$('<span id="globToggleParticipants" class="clickable" title="Отображать соисполнителей" onclick="pageToggleParticipants()">[&lt;&gt;]</span>');

    let $bgSpan=$('<span></span>');
    for (let i=0; i<3; i++) {
        $bgSpan.append('<span id="switchBg'+i+'" class="clickable"  onclick="pageSwitchBg('+i+')">[bg'+i+']</span>');
    }

    let $toolPanel=$('<span class="toolsPanel2"></span>')
        .append($closedToggle)
        .append($ticketToggle)
        .append($jobToggle)
        .append($participantsToggle)
        .append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
        .append($bgSpan);

    let $toolBarTd=$('<td colspan="'+$globUserList.size+'"></td>')
        .append($toolPanel);

    let $toolBarTr=$('<tr class="pageToolBar"></tr>')
        .append($toolBarTd);



    let $usersTr=$('<tr></tr>');
    $globUserList.forEach(function(name,id) {
        let $td=$('<td data-user-id='+id+' class="userColumn">'+name+'</td>');
        $td.click(function(e){
            e.stopPropagation();
            toggleUserLayout(id);
        });
        $usersTr.append($td);
    });

    let $table=$('<table></table>')
        .append($toolBarTr)
        .append($usersTr);

    return $('<div class="row horizontal headerRow"></div>')
        .append('<div class="rowTitleCell">&nbsp;</div>')
        .append($table);
}


function updateLoadingGauge() {
    let $header=$('div.headerRow');
    if ($maxScrollBlock) {
        let percent=Math.round(100*(1-$globScrollBlock/$maxScrollBlock));
        //console.log(percent+'('+$globScrollBlock+'/'+$maxScrollBlock+')');
        $header.css('background','linear-gradient(to right,deepskyblue 0%,deepskyblue '+percent+'%,transparent '+percent+'%,transparent 100%');
    } else {
        $header.css('background','white');
    }
}

function increaseScrollBlock(n,scrollBack=true) {
    $globScrollBlock+=n;
    if ($globScrollBlock > $maxScrollBlock) $maxScrollBlock = $globScrollBlock;
    updateLoadingGauge();
    if (scrollBack) scrollToAnchor($globScrollPos);

}

function releaseScrollBlock(scrollBack=true) {
    $globScrollBlock--;
    //console.log('current scroll has '+$globScrollBlock+' blocks');
    if (!$globScrollBlock) $maxScrollBlock=0;
    updateLoadingGauge();
    //console.log('current scroll released');
    if (scrollBack)
        scrollToAnchor($globScrollPos);
}


/**
 * Возвращает тикеты из блока пользовательских элементов за период
 * @param $td блок
 * @param open
 */
function userColumnTickets($td,open=true) {
    return $td.find('li.userTicket.'+(open?'open':'closed,li.userTicket.semiClosed'));
}

function userColumnJobs($td,open=true) {
    return $td.find('li.userJob.'+(open?'open':'closed'));
}

function userColumnTasks($td,open=true,accomplices=false) {
    return $td.find('li.userTask.'+(open?'open':'closed')+(!accomplices?':not(.dimmedOut)':''));
}


/**
 * Пересчитывает количество элементов в блоке
 * @param $td
 */
function updateUserPeriodColumnTotals($td) {
    //let $closedUl=$td.children('ul.closedItems.nonDroppableBlock');
    //let $openTicketsUl=$td.children('ul.openItems.nonDroppableBlock');
    //let $openUl=$td.children('ul.openItems.droppableBlock');
    let $closedTickets=userColumnTickets($td,false);// $closedUl.children('li.userTicket.closed');
    let $closedTasks=userColumnTasks($td,false);    //$closedUl.children('li.userTask.closed:not(.dimmedOut)');
    let $closedJobs=userColumnJobs($td,false);      //$closedUl.children('li.userJob.closed');
    let $openTickets=userColumnTickets($td,true);   //$openTicketsUl.children('li.userTicket.open');
    let $openTasks=userColumnTasks($td,true);       //$openUl.children('li.userTask.open');
    let $openJobs=userColumnJobs($td,true);         //$td.find('li.userJob.open');
    let $colHeader=$td.children('div.colHeader');

    $colHeader.children('span.closedTicketsCountLabel').html($closedTickets.length);
    if (!$closedTickets.length)
        $colHeader.children('span.closedTicketsCountLabel').hide();
    else
        $colHeader.children('span.closedTicketsCountLabel').show();

    $colHeader.children('span.openTicketsCountLabel').html($openTickets.length);
    if (!$openTickets.length)
        $colHeader.children('span.openTicketsCountLabel').hide();
    else
        $colHeader.children('span.openTicketsCountLabel').show();

    $colHeader.children('span.closedJobsCountLabel').html($closedJobs.length);
    if (!$closedJobs.length)
        $colHeader.children('span.closedJobsCountLabel').hide();
    else
        $colHeader.children('span.closedJobsCountLabel').show();

    $colHeader.children('span.openJobsCountLabel').html($openJobs.length);
    if (!$openJobs.length)
        $colHeader.children('span.openJobsCountLabel').hide();
    else
        $colHeader.children('span.openJobsCountLabel').show();

    $colHeader.children('span.closedTasksCountLabel').html($closedTasks.length);
    if (!$closedTasks.length)
        $colHeader.children('span.closedTasksCountLabel').hide();
    else
        $colHeader.children('span.closedTasksCountLabel').show();

    $colHeader.children('span.openTasksCountLabel').html($openTasks.length);
    if (!$openTasks.length)
        $colHeader.children('span.openTasksCountLabel').hide();
    else
        $colHeader.children('span.openTasksCountLabel').show();
}


function renderUserPeriodColumnHeader($td){
    let $colHeader=$('<div class="colHeader" title="Элементы за этот период"></div>');
    let $cTickets=$('<span class="closedTicketsCountLabel" title="Закрыто тикетов"></span>').click(function (e) {
        e.stopPropagation();
        $td.children('ul.closedItems.nonDroppableBlock').toggleClass('invertTicketsVisibility');
        userColumnTickets($td,false).toggle();
    });
    let $cJobs=$('<span class="closedJobsCountLabel" title="Выполнено работ"></span>').click(function (e) {
        e.stopPropagation();
        $td.children('ul.closedItems.nonDroppableBlock').toggleClass('invertJobsVisibility');
        $td.children('ul.closedItems.nonDroppableBlock').children('li.createJob').toggle();
        userColumnJobs($td,false).toggle();
    });
    let $cTasks=$('<span class="closedTasksCountLabel" title="Закрыто задач"></span>').click(function (e) {
        e.stopPropagation();
        $td.children('ul.closedItems.nonDroppableBlock').toggleClass('invertTasksVisibility');
        userColumnTasks($td,false).toggle();
    });
    let $oTickets=$('<span class="openTicketsCountLabel" title="Тикетов"></span>').click(function (e) {
        e.stopPropagation();
        $td.children('ul.openItems.nonDroppableBlock').toggleClass('invertTicketsVisibility');
        userColumnTickets($td,true).toggle();
    });
    let $oJobs=$('<span class="openJobsCountLabel" title="Запланировано работ"></span>').click(function (e) {
        e.stopPropagation();
        $td.children('ul.openItems.droppableBlock').toggleClass('invertJobsVisibility');
        $td.children('ul.openItems.droppableBlock').children('li.createJob').toggle();
        userColumnJobs($td,true).toggle();
    });
    let $oTasks=$('<span class="openTasksCountLabel" title="Задач на этот период"></span>').click(function (e) {
        e.stopPropagation();
        $td.children('ul.openItems.droppableBlock').toggleClass('invertTasksVisibility');
        userColumnTasks($td,true).toggle();
    });
    $colHeader.append($cTickets);
    $colHeader.append($cJobs);
    $colHeader.append($cTasks);
    $colHeader.append($oTickets);
    $colHeader.append($oJobs);
    $colHeader.append($oTasks);
    return $colHeader;
}
function renderUserPeriodColumn(
    userId,                 //пользователь
    userName,               //имя (чтобы задавать осмысленные вопросы при перемещении элементов сюда)
    periodStart,            //начало периода
    periodEnd,              //конец периода
    periodLayout            //тип периода (прошл/будущ/текущ)
) {

    let $td=$('<td class="userColumn">');
    $td.attr('data-user-id',userId);
    $td.attr('data-user-name',userName);

    let $colHeader=renderUserPeriodColumnHeader($td);

    let closedUlClass,closedUlStyle=null;
    if (periodLayout==='closed') {
        closedUlClass='';   //в закрытом периоде закрытый блок нет смысла скрывать
    } else {
        closedUlClass='closedPeriod';   //в остальных периодах он должен скрываться при скрытии закрытых элементов
        if (!$globShowClosed) closedUlStyle='display:none';
    }
    let $closedUl=$('<ul class="nonDroppableBlock closedItems '+closedUlClass+'" style="'+closedUlStyle+'"></ul>');
    let $openFixedUl=$('<ul class="nonDroppableBlock openItems"></ul>');
    let $openFlexibleUl=$('<ul class="droppableBlock openItems openTasks"></ul>').sortable({
        connectWith:'ul',
        items: "li:not(.dimmedOut):not(.createJob):not(.createTask)",
        selector:'> li.draggableTask',
        placeholder:'placeholder',
        cancel:'span.status',   //этот спан сам по себе кликабельный
        delay:300,
        handle: function( event, ui ) {
            console.log('draggin..');
            //disableAllTTips()
        },
        stop: function( event, ui ) {
            console.log('stop draggin..');
            //enableAllTTips()
        },
        beforeStop: function( event, ui ) {
            console.log('before stop draggin..');
            //старые значения
            let $item=ui.item;

            if ($item.hasClass('userTask'))
                taskOnStopDrag(ui.item,$(event.target),ui.placeholder.parent());

            if ($item.hasClass('userJob'))
                jobOnStopDrag(ui.item,$(event.target),ui.placeholder.parent());

        }
    });
    let $closedJobCreate=renderNewJobLink($closedUl,true);
    let $openJobCreate=renderNewJobLink($openFlexibleUl,false);
    let $taskCreate=renderNewTaskLink($td);
    if (!$globShowJobs) {
        $closedJobCreate.hide();
        $openJobCreate.hide();
    }
    $closedUl.append($closedJobCreate);
    $openFlexibleUl.append($openJobCreate);
    $openFlexibleUl.append($taskCreate);

    $td.append($colHeader);

    if (periodLayout==='closed' || periodLayout==='now') {
        $td.append($closedUl);
    }
    if (periodLayout==='open' || periodLayout==='now') {
        $td.append($openFixedUl);
        $td.append($openFlexibleUl);
    }
    return $td;
}


/**
 * Корректирует строку под конкретный период
 * @param $row
 * @param periodDay
 * @param periodStart
 * @param periodEnd
 * @returns {jQuery}
 */
function customizeTeamPeriodRow($row,periodDay,periodStart,periodEnd) {
    let strTitle,periodRange,periodLayout;
    let periodRangeDays=periodEnd?Math.floor((periodEnd-periodStart)/86400000):0;
    let periodWeek=Math.floor(periodDay/7);
    let weekDay=periodDay-periodWeek*7;
    //'period'+Math.abs(week)+' dayPeriod'+((week*7+day) < $globWeekDay?' closedPeriod':''),
    //console.log('Setting up period Row with startDay='+periodDay+', week='+periodWeek+', day='+weekDay+', dayRange='+periodRangeDays);
    $row.addClass('period'+Math.abs(periodWeek));

    if (periodRangeDays>1 || !periodEnd) {
        //console.log('as a week');
        $row.removeClass('dayPeriod');
        for (let i=0; i<7; i++) $row.removeClass('day'+i);
        $row.addClass('weekPeriod');
        if (periodWeek<0) {
            $row.addClass('closedPeriod');
            if (!$globShowClosed) {
                console.log('hiding period');
                $row.hide();
            }
        }

        $row.attr('id',generatePeriodAnchorName(periodWeek));

        periodRange='week';
        if (periodEnd) {
            switch (periodWeek) {
                case 0: strTitle='эта неделя'; break;
                case 1: strTitle='след. неделя'; break;
                case -1:strTitle='пред. неделя'; break;
                default:
                    if (periodWeek<0) strTitle=Math.abs(periodWeek)+'нед. назад';
                    else strTitle='через '+(periodWeek-1)+'нед.';
            }
        } else strTitle='далеко'
        if (periodWeek===0)  periodLayout='now';
        else  periodLayout=(periodWeek>0)?'open':'closed';
    } else if (periodRangeDays<=1) {
        //console.log('as a day');
        //пытаемся рисовать день
        $row.removeClass('weekPeriod');
        $row.addClass('dayPeriod');
        $row.addClass('day'+weekDay);
        if (periodDay < $globWeekDay) {
            $row.addClass('closedPeriod');
            if (!$globShowClosed) $row.hide();
        }

        $row.attr('id',generatePeriodAnchorName(periodWeek,weekDay));

        periodRange='day';
        strTitle=unixTimeToMyShortDate(periodStart);
        if (periodDay === $globWeekDay) periodLayout='now';
        else periodLayout=(periodDay > $globWeekDay)?'open':'closed';
    }

    $row.attr('data-bx-start-date',unixTimeToBitrixDate(periodStart));
    $row.attr('data-bx-end-date',unixTimeToBitrixDate(periodEnd));
    $row.attr('data-unix-start-date',periodStart);
    $row.attr('data-unix-end-date',periodEnd);
    $row.attr('data-week-index',periodWeek);
    $row.attr('data-day-index',weekDay);
    $row.attr('data-layout',periodLayout);
    $row.attr('data-range',periodRange);

    //TODO тут опять какаято жопа с часовыми поясами!!
    let strTipStart=unixTimeToMyDate(periodStart);
    let strTipEnd=periodEnd?unixTimeToMyDate(periodEnd-1000):null;

    let strToolTip=strTipEnd?(
        (strTipStart===strTipEnd)?strTipStart:strTipStart+'-'+strTipEnd
    ):'от '+strTipStart+' и без срока.';
    let $title=$row.children('div.rowTitleCell');
    $title.attr('title',strToolTip);

    let $header=$title.children('h3');
    $header.html(strTitle)
    if (periodRange==='week') {
        //для периода - недели разрешаем разбивку
        $header.prop("onclick", null).off("click").click(function(e){
            e.preventDefault();
            e.stopPropagation();
            expandWeek($row)
        });
    }
    if (periodRange==='day') {
        //для периода - недели разрешаем разбивку
        $header.prop("onclick", null).off("click").click(function(e){
            e.preventDefault();
            e.stopPropagation();
            implodeWeek($row)
        });
    }
    //надо обновить задники TD, если они тут уже есть
    $row.find('td.userColumn').each(function () {
        updateUserPeriodColumnAbsents($(this));
    })
    return periodLayout;
}

function renderTeamPeriodRow(periodDay,periodStart,periodEnd) {
    //console.log('Building period for day '+periodDay);
    let $row=$('<div class="row"></div>');
    let $title=$('<div class="rowTitleCell"><h3></h3></div>');
    $title.click(function (e){
        e.preventDefault();
        e.stopPropagation();
        scrollToAnchor($row.attr('id'));
    });
    $row.append($title);

    let periodLayout=customizeTeamPeriodRow($row,periodDay,periodStart,periodEnd);
    let $tr=$('<tr></tr>');
    let $table=$('<table class="canban"></table>').append($tr);
    let $data=$('<div class="rowDataCell weekPeriod"></div>').append($table);
    $row.append($data);
    $globUserList.forEach(function(name,i){
        let $td=renderUserPeriodColumn(i,name,periodStart,periodEnd,periodLayout);
        if ($globalUserLayout && $globalUserLayout!==i) $td.hide(); //если у нас сейчас один пользователь и это не он
        $tr.append($td);
        updateUserPeriodColumnAbsents($td);
    })
    return $row
}

function renderTeamWeek(index,bucket=false) {
    return renderTeamPeriodRow(
        index*7,
        $globMonday0+86400*7000*index,
        bucket?0:$globSunday0+86400*7000*index
        );
}

function renderTeamWeekday(week,day) {
    return renderTeamPeriodRow(
        week*7+day,
        $globMonday0+86400*1000*(week*7+day),
        $globMonday0+86400*1000*(week*7+day+1)
    );
}


function expandTopDayFromWeek($row,day) {
    let periodStart=Number($row.attr('data-unix-start-date'));
    let week=$row.attr('data-week-index');
    let $day=renderTeamWeekday(week,day);
    $row.attr('data-unix-start-date',periodStart+86400000);
    $day.insertBefore($row);
}

function expandBottomDayFromWeek($row,day) {
    let periodEnd=Number($row.attr('data-unix-start-date'));
    let week=$row.data('weekIndex');
    let $day=renderTeamWeekday(week,day);
    $row.attr('data-unix-end-date',periodEnd-86400000);
    $day.insertAfter($row);
}

/**
 * Разбить неделю на дни
 * @param $row
 */
function expandWeek($row) {
    //идем сверху
    let week=Number($row.data('weekIndex'));
    //console.log('expanding week '+week);
    Cookies.set('expandWeek'+week,'true',{expires:365});
    if (week!==0) { //если это не текущая неделя, в которой есть день с открытыми и закрытыми задачами одновременно
        //console.log('in simple way');
        for (let i=0;i<7;i++) expandTopDayFromWeek($row,i);
        rearrangeIncorrectItems($row);
        $row.remove();
        scrollToAnchor(generatePeriodAnchorName(week,0));
        return
    }
    //console.log('Ok. it is current week. Let\'s do it hard way!');
    for (let i=0;i<$globWeekDay;i++) expandTopDayFromWeek($row,i);
    for (let i=6;i>$globWeekDay;i--) expandBottomDayFromWeek($row,i);
    console.log('converting week row to day ...');
    customizeTeamPeriodRow($row,$globWeekDay,$globMonday0+86400000*$globWeekDay,$globMonday0+86400000*($globWeekDay+1))
    console.log($row);
    rearrangeIncorrectItems($row);
    scrollToAnchor(generatePeriodAnchorName(week,0));
}

/**
 * Собрать из дней неделю обратно
 * @param $row
 */
function implodeWeek($row) {
    let week=Number($row.attr('data-week-index'));
    let day=Number($row.attr('data-day-index'));

    Cookies.set('expandWeek'+week,'false',{expires:365});
    if (week===0) {
        //если это текущая неделя, в которой есть день с открытыми и закрытыми задачами одновременно
        day=$globWeekDay
        $row=$('div.row#'+generatePeriodAnchorName(week,day));
    }

    console.log('creating a week from #'+generatePeriodAnchorName(week,day));
    customizeTeamPeriodRow($row,week*7,$globMonday0+86400000*7*week,$globSunday0+86400000*7*week);
    //console.log($row);
    console.log('removing other days');
    for (let i=0;i<7;i++) if(day!==i) {
        let $day=$('div.row#'+generatePeriodAnchorName(week,i));
        console.log('removing day'+i);
        //console.log($day);
        $day.attr('data-unix-start-date',null);
        $day.attr('data-unix-end-date',null);
        rearrangeIncorrectItems($day);
        $day.remove();
    }
    scrollToAnchor(generatePeriodAnchorName(week));
}

/**
 * Ищет подходящий UL в сетке для LI-элемента
 * @param $li
 */
function findCanbanUlForItem($li) {
    let userId=$li.attr('data-user-id');
    let timeStamp=Number($li.attr('data-timestamp'));
    let listClass='';
    //если исходный элемент открыт или закрыт надо класть его в соотв коробочку
    if ($li.hasClass('open'))     {

        //для работ и задач кладем в передвигаемый список (остальное - тикеты, в не передвигаемый)
        if ($li.hasClass('userJob') || $li.hasClass('userTask'))
            listClass+='.droppableBlock';
        else
            listClass+='.nonDroppableBlock';

        listClass+='.openItems';
    }
    if ($li.hasClass('closed') || $li.hasClass('semiClosed'))
        listClass+='.closedItems.nonDroppableBlock';

    let $row=$('div.row[data-unix-start-date]')
        .filter(function (){
            //console.log($(this).data('unixStartDate')/1000+' - '+timeStamp/1000+' - '+$(this).data('unixEndDate')/1000)
            return (
                Number($(this).attr('data-unix-end-date')) > timeStamp
                &&
                Number($(this).attr('data-unix-start-date')) <= timeStamp
            ) || (
                Number($(this).attr('data-unix-end-date')) === 0
                &&
                timeStamp === 0
            );
        });

    if (!$row.length) $row=$('div.row[data-unix-start-date][data-unix-end-date=0]')
        .filter(function (){return Number($(this).attr('data-unix-start-date')) <= timeStamp});

    if (!$row.length) {
        console.log("Uh Oh! Cant find "+'row[data-unix-start-date<='+timeStamp+'(' + unixTimeToMyDate(timeStamp) + ')<data-unix-end-date]');
        console.log($li)
        return null;
    }

    let $td=$row.find('td[data-user-id='+userId+']');
    if (!$td.length) {
        console.log("Uh Oh! Cant find "+'row[data-unix-start-date<='+timeStamp+'(' + unixTimeToMyDate(timeStamp) + ')<data-unix-end-date]>td[data-user-id='+userId+']');
        console.log($row)
        console.log($li)
        return null;
    }
    let $ul=$td.children('ul'+listClass);
    if (!$ul.length) {
        console.log("Uh Oh! Cant find "+'td[data-user-id='+userId+'][data-unix-start-date<='+timeStamp+'(' + unixTimeToMyDate(timeStamp) + ')<data-unix-end-date]>ul'+listClass)
        console.log($row)
        console.log($td)
        console.log($li)
        return null
    }
    return $ul;
}




/**
 * положить LI элемент туда в сетку где он должен быть
 * @param $li
 */
function placeCanbanItemCorrect($li) {
    let $ul=findCanbanUlForItem($li);
    let $oldTd=$li.parents('td.userColumn');
    if ($ul && $ul.length) {
        $ul.append($li);
        if ($li.hasClass('userTicket')) {
            if (!$globShowTickets ^ $ul.hasClass('invertTicketsVisibility'))
                $li.hide();
            else
                $li.show();
        }
        if ($li.hasClass('userJob')) {
            if (!$globShowJobs ^ $ul.hasClass('invertJobsVisibility'))
                $li.hide();
            else
                $li.show();
        }
        if ($li.hasClass('userTask')) {
            if (
                (!$globShowTasks ^ $ul.hasClass('invertTasksVisibility'))
                ||
                (!$globShowParticipants && $li.hasClass('dimmedOut'))
            )
                $li.hide();
            else
                $li.show();
        }
        canBanSortUl($ul);
        updateUserPeriodColumnTotals($ul.parent('td.userColumn'));
        if ($oldTd.length) updateUserPeriodColumnTotals($oldTd);
    }
}


function rearrangeIncorrectItems($row) {
    //console.log($row.data('unixStartDate'));
    let periodStart=Number($row.attr('data-unix-start-date'))
    let periodEnd  =Number($row.attr('data-unix-start-date'))
    if (isNaN(periodStart)) periodStart=0;
    if (isNaN(periodEnd))   periodEnd=0;
    $row.find('li.userItem[data-timestamp]').filter(function(){
        let timestamp=$(this).data('timestamp');
        //console.log(periodStart+' - '+timestamp+' - '+periodEnd);
        return !periodStart || (timestamp > periodEnd) || (timestamp < periodStart);
    }).each(function (){
        placeCanbanItemCorrect($(this).detach());
    })
}

/**
 * Добавить в документ период-неделю
 * @param week какую неделю загрузить
 * @param bucket флаг, что это период-ведро, без дальней границы
 */
function loadTeamWeek(week,bucket=false) {
    increaseScrollBlock(4);
    let $calRow=$('<div class="calendarRow horizontal"></div>');
    let $week=renderTeamWeek(week,bucket);
    $calRow.append($week);
    let periodStart=$globMonday0/1000+86400*7*week;
    let periodEnd=bucket?null:$globSunday0/1000+86400*7*week;
    if (week<0) {
        $calRow.addClass('closedPeriod');
        $calRow.insertAfter($('div.headerRow'));
        if (!$globShowClosed) $calRow.hide();
    } else {
        if (bucket) $calRow.addClass('bucket');
        $('body').append($calRow);
    }
    if (Cookies.get('expandWeek'+week)==='true') expandWeek($week);
    loadJobs(periodStart,periodEnd,[...$globUserList.keys()],releaseScrollBlock);
    loadTasks(periodStart,periodEnd,[...$globUserList.keys()],releaseScrollBlock);
    loadTickets(periodStart,periodEnd,[...$globUserList.keys()],releaseScrollBlock);
    loadAbsents(periodStart,periodEnd,[...$globUserList.keys()],releaseScrollBlock);
}


function toggleUserLayout(userId) {
    if (!$globalUserLayout) {
        $globalUserLayout=userId;
        $globUserList.forEach(function(name,id) {
            if (Number(userId) !== Number(id)) {
                //console.log('hidin '+id);
                $('td.userColumn[data-user-id='+id+']').hide();
            }
        })
        $('div.calendarRow').removeClass('horizontal').addClass('vertical');
    } else {
        $globalUserLayout=0;
        $('div.calendarRow').removeClass('vertical').addClass('horizontal');
        $globUserList.forEach(function(name,id) {
            if (Number(userId) !== Number(id)) {
                //console.log('hidin '+id);
                $('td.userColumn[data-user-id='+id+']').show();
            }
        })
        scrollToAnchor('period0-day0');
    }
}