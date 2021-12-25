let $globalHoveredTask=null;
let $globScrollPos=window.top.location.hash.substr(1);
let $globBodyMargin=20;
let $globServerTimeShift=3*3600*1000;
let $globScrollBlock=1;
let $globShowTasks=true;

function unixTimeToMyDate(time) {
    let nd = new Date(time);
    const dayOfWeek = nd.getDay();
    const date = $.datepicker.formatDate( "dd.mm.yy", nd);
    return isNaN(dayOfWeek) ? date :
        date+'('+(['вс','пн','вт','ср','чт','пт','сб','вс'][dayOfWeek])+')';

}

function unixTimeToMyShortDate(time) {
    let nd = new Date(time);
    const dayOfWeek = nd.getDay();
    const date = $.datepicker.formatDate( "dd.mm", nd);
    return isNaN(dayOfWeek) ? date :
        date+'('+(['вс','пн','вт','ср','чт','пт','сб','вс'][dayOfWeek])+')';

}


function getCurrentTimeInServerTZ() {
    //http://www.techrepublic.com/article/convert-the-local-time-to-another-time-zone-with-this-javascript/6016329
    let offset=3; //Europe/Msk
    let d = new Date();
    let utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    let nd = new Date(utc + (3600000*offset));
    return $.datepicker.formatDate( "dd.mm.yy", nd);
}

function getCurrentUnixTimeInServerTZ() {
    //http://www.techrepublic.com/article/convert-the-local-time-to-another-time-zone-with-this-javascript/6016329
    let offset=3; //Europe/Msk
    let d = new Date();
    let utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    let nd = new Date(utc + (3600000*offset));
    return $.datepicker.formatDate( "dd.mm.yy", nd);
}

//приводит текстовую запись даты-времени в формате Битрикса к формату JS
function bitrixDateTimeToJS(time) {
    if (typeof time !== 'string') return null;
    let $tokens=time.split(' ');
    let $newDate=$tokens[0].split('.').reverse().join('-');
    if ($tokens.length===2) {
        return $newDate+'T'+$tokens[1]+'+03:00'
    } else {
        return $newDate+'T00:00:00+03:00'
    }
}

//то же самое только выкидывает время, оставляет только дату
function bitrixDateToJS(time) {
    if (typeof time !== 'string') return null;
    let $tokens=time.split(' ');
    return $tokens[0].split('.').reverse().join('-')+'T00:00:00+03:00';
}

function bitrixDateTimeToUnix(time) {
    if (typeof time !== 'string') return null;
    return Date.parse(bitrixDateTimeToJS(time));
}

function bitrixDateToUnix(time) {
    if (typeof time !== 'string') return null;
    return Date.parse(bitrixDateToJS(time));
}

function unixTimeToBitrixDate(time) {
    let nd = new Date(time);
    return $.datepicker.formatDate( "dd.mm.yy", nd);
}

//Переключение задника
function pageSwitchBg(bg=false) {
    if (bg===false)
        bg=(Cookies.get('globBgType'));
    $('body')
        .removeClass('bg0 bg1 bg2 bg3 bg4 bg5 bg6')
        .addClass('bg'+bg);
    Cookies.set('globBgType',bg);
}


//Переключение отображения закрытых задач
function pageToggleClosedTasks() {
    $('div.row.closedPeriod, td>ul.closedPeriod, div.calendarRow.closedPeriod').toggle();
    $('span#globToggleClosed').toggleClass('toggleOn');
    $globShowClosed=!$globShowClosed;
    Cookies.set('globShowClosed',$globShowClosed,{expires:365});
    scrollToAnchor($globScrollPos);
}

//Переключение отображения тикетов
function pageToggleTickets() {
    $('ul:not(.invertTicketsVisibility)>li.userTicket').toggle();
    $('ul.invertTicketsVisibility').removeClass('invertTicketsVisibility');
    $('span#globToggleTickets').toggleClass('toggleOn');
    $globShowTickets=!$globShowTickets;
    Cookies.set('globShowTickets',$globShowTickets,{expires:365});
    scrollToAnchor($globScrollPos);
}

//Переключение отображения тикетов
function pageToggleJobs() {
    $('ul:not(.invertJobsVisibility)>li.userJob').toggle();
    $('ul:not(.invertJobsVisibility)>li.createJob').toggle();
    $('ul.invertJobsVisibility').removeClass('invertJobsVisibility');

    $('span#globToggleJobs').toggleClass('toggleOn');
    $globShowJobs=!$globShowJobs;
    Cookies.set('globShowJobs',$globShowJobs,{expires:365});
    scrollToAnchor($globScrollPos);
}

//Переключение соисполнителей
function pageToggleParticipants() {
    $('li.dimmedOut').toggle();
    $('span#globToggleParticipants').toggleClass('toggleOn');
    $globShowParticipants=!$globShowParticipants;
    Cookies.set('globShowParticipants',$globShowParticipants,{expires:365});
    scrollToAnchor($globScrollPos);
}



//передача статуса отображения закрытых задач и тикетов в урл
function updatePageUrlState() {
    let $url=new URL(window.location);
    window.history.replaceState('', '', $url.pathname+'#'+$globScrollPos);
}

/**
 * Генерирует название ID для периода по неделе и дню
 * @param week
 * @param day
 * @returns {string}
 */
function generatePeriodAnchorName(week,day=null) {
    return 'period'+
        (week<0?('rev'+Math.abs(week)):week)+
        (day===null?'':'-day'+day)
}

//прокрутка до якоря #
function scrollToAnchor(anchor) {
    if (!anchor) return;
    //console.log("Scrolling to "+anchor)
    let $period=$("div#"+anchor);
    if (!$period.length && anchor.indexOf('-')!==-1) {
        console.log("Hm. cant find. trying auto remove day part "+anchor)
        //не нашли куда прокручивать, но можно уменьшить точность до недели выкинув день из якоря
        $period=$("div#"+anchor.substring(0,anchor.indexOf('-')-1));
    }
    if ($period.length)
        $('html, body').scrollTop($period.offset().top-$globBodyMargin);
    else
        console.log("No luck to find anchor")
}


$(window).scroll(function(e){
    //console.log(e);
    if ($globScrollBlock>0) return;
    let visibleTop = $(this).scrollTop()+$globBodyMargin; // or the value for the #navigation height
    let visibleBottom = $(this).scrollTop()+$globBodyMargin+$(window).height(); // or the value for the #navigation height
    let fromTop=visibleTop+$(window).height()/2;
    let curPos=null;
    $('div.row[data-unix-start-date]').each(function(i,item){
        //console.log(item);
        if (
            $(item).offset()
            &&
            ($(item).offset().top <= fromTop)
            &&
            (
                ($(item).offset().top >= visibleTop)
                ||
                ($(item).offset().top + $(item).height() >= visibleBottom)
            )
        ) {
            fromTop=$(item).offset().top;
            curPos=$(item);

        }
    });

    if (curPos !== null) {
        let id = curPos.attr('id');
        if ($globScrollPos !== id) {
            $globScrollPos = id;
            updatePageUrlState();
        }
    }
});


$(document).ready(function(){
    //setTimeout(attachAllTTips,500);

    $globBodyMargin=window.getComputedStyle(document.body).marginTop;
    $globBodyMargin=Number($globBodyMargin.slice(0,$globBodyMargin.length-2));

    //console.log(document.documentElement.clientHeight);
    releaseScrollBlock(true);


    //$('ul.droppableBlock').disableSelection();
    /*
    "handle" - click down
    "start" - start of dragging - you can add a class here
    "activate"
    "sort" - change of the item position
    "change" – change of the items order
    "beforeStop" - release of a mouse button
    "deactivate"
    "out"
    "stop" - you can remove a class here
     */
});

/**
 * Сортировка открытых элементов (такая логика годится только для открытых)
 * Давайте попробуем придерживаться такой логики:
 * Элемент с индексом сортировки идет раньше элемента без него
 * Элемент без даты идет позже элемента с датой
 */
function canBanSortOpenItems(a,b) {
    let sortingA=Number($(a).attr('data-sorting'));
    let sortingB=Number($(b).attr('data-sorting'));
    if (isNaN(sortingA)) sortingA=0;
    if (isNaN(sortingB)) sortingB=0;
    //console.log('sorting '+sortingA+' vs '+sortingB);
    if (sortingA || sortingB) {
        if (sortingA===sortingB) {
            //console.log('sorting '+sortingA+' equals '+sortingB);
            return 0
        }
        //console.log('sorting '+sortingA+' vs '+sortingB);
        return (sortingA < sortingB) ? 1:-1;
    }

    let timeMarkA=Number($(a).attr('data-timestamp'));
    let timeMarkB=Number($(b).attr('data-timestamp'));

    //если дата отличается то получается что, либо сравниваем даты между собой либо с NULL, NULL всегда больше
    if (timeMarkA===timeMarkB)  return 0

    //console.log('date differ '+timeMarkA+' vs '+timeMarkB);
    if (!timeMarkA) return 1; //У А нет даты, потому он "позже"
    if (!timeMarkB) return -1; //У B нет даты, потому он "позже"

    return (timeMarkA>timeMarkB)?1:-1;


    //если до сюда дошли, значит оба без даты
    //console.log('wow. comparing sort index '+sortingA+' vs '+sortingB);
    //сравниваем сортировки
}

/**
 * Возвращает индекс сортировки закрытого элемента
 * @param $li
 */
function canBanClosedItemSortIndex($li) {
    if ($li.hasClass('userTask')) return 100;
    if ($li.hasClass('userTicket')) return 80;
    if ($li.hasClass('userJob')) return 60;
    return 0;
}

/**
 * Сортировка закрытых элементов (такая логика годится только для закрытых)
 * Давайте попробуем придерживаться такой логики:
 * Сначала задачи, потом тикеты, потом работы
 * Элемент без даты идет позже элемента с датой
 */
function canBanSortClosedItems(a,b) {
    let sortingA=canBanClosedItemSortIndex($(a));
    let sortingB=canBanClosedItemSortIndex($(b));
    if (sortingA===sortingB) {
        //TODO: сравнение одинаковых элементов между собой тоже можно де сделать. Можно попробовать тут их сортирнуть как открытые
        return 0;
    }
    return (sortingA < sortingB) ? 1:-1;
}

/* сортирует список согласно правила выше */
function canBanSortUl($ul) {
    //console.log('sorting items');
    if ($ul.hasClass('openItems')) {
        //console.log('sorting open items');
        let $items=$ul.children('li.userItem').sort(function(a,b){return canBanSortOpenItems(a,b)});
        $items.insertAfter($ul.children('li.createJob'));
    }

    if ($ul.hasClass('closedItems')) {
        //console.log('sorting closed items');
        let $items=$ul.children('li.userItem').sort(function(a,b){return canBanSortClosedItems(a,b)});
        $items.insertBefore($ul.children('li.createJob'));

    }
}

/* говорит какой индекс сортировки поставить элементу который воткнули в список */
function getNewItemSortIndex($item) {
    let i=$item.index();
    //console.log(i);
    let testVal=null;
    let $testItem=null;

    //ищем сортировку элемента сверху (первого элемента с сортировкой по пути от текущего положения наверх)
    let previousSort=null;
    let nextSort=null;
    let $list=$item.parent();
    //console.log($list);
    if (i) for (let j=i-1;j>=0;j--) {
        $testItem=$list.children('li').eq(j);
        //console.log('testing item '+j+' sort value')
        //console.log($testItem);
        if ($testItem.hasClass('userItem')) {
            //console.log('class ok. data is '+ $testItem.data('sorting'))
            if ($testItem.attr('data-sorting')) {
                //console.log('data ok ')
                previousSort=Number($testItem.attr('data-sorting'));
                break;
            }
        }
    }

    //теперь ищем есть ли сортировка снизу. тут проще если у первого снизу нет, то и дальше быть не может
    $testItem=$list.children('li').eq(i+2);
    //console.log('testing item '+(i+2)+' sort value');
    if ($testItem.hasClass('userItem')) {
        //console.log('class ok. data is '+ $testItem.data('sorting'))
        if ($testItem.attr('data-sorting')) {
            //console.log('data ok ')
            nextSort=Number($testItem.attr('data-sorting'));
        }
    }
    console.log('placed between '+previousSort+' and '+nextSort);

    //если встали между 2мя сортировками, берем среднюю
    if (previousSort && nextSort) return Math.round((previousSort+nextSort)/2);

    //далее есть только какая то одна
    if (previousSort) return previousSort - 100;
    if (nextSort) return nextSort + 100;

    //ничего нет. берем серединку unsigned integer
    return 32768;
}


function getUlMaxSortingIndex(ul) {
    let $ul=$(ul);
    let max=null;
    $ul.children('li').each(function(){
        //console.log(this);
        if ($(this).attr('data-sorting')!==null) {
            //console.log ($(this).data('sorting'));
            if ((max==null) || ($(this).attr('data-sorting') > max)) {
                max=$(this).attr('data-sorting');
            }
        }
    });
    console.log('max sorting is '+max);
    if (max==null) return 32768;
    return max;
}

function getUlMinSortingIndex(ul) {
    let $ul = $(ul);
    let min = null;
    $ul.children('li').each(function () {
        if ($(this).data('sorting') !== null) {
            if ((min === null) || ($(this).attr('data-sorting') < min)) {
                min = $(this).attr('data-sorting');
            }
        }
    });
    if (min===null) return 32768;
    return min;
}

