let $globalAbsentsApiUri='/reviakin/x0/api/absents';
let $globAbsents=new Map([]);

/*{
	"ID": "418834",
	"ACTIVE_FROM": "25.10.2021",
	"ACTIVE_TO": "28.10.2021",
	"NAME": "Командировка в г. Москва (Российская Федерация)",
	"SEARCHABLE_CONTENT": "КОМАНДИРОВКА В Г. МОСКВА (РОССИЙСКАЯ ФЕДЕРАЦИЯ)",
	"XML_ID": "418834",
}*/

/**
 * Складывает массивы или элементы в один массив
 * @param item1
 * @param item2
 * @return array
 */
function arraysAddition(item1,item2)
{
if (!Array.isArray(item1)) item1=[item1];
if (!Array.isArray(item2)) item2=[item2];
return item1.concat(item2);
}

/**
 * проверка пересечения интервалов
 * @param interval1 array
 * @param interval2 array
 * @param boolean neighbours
 * @return boolean
 */
function intervalsIntersect(interval1,interval2,neighbours=false)
{
// сортируем интервалы так, чтобы второй был не раньше первого
if (interval2[0]<interval1[0]) {
    let tmp=interval1;
    interval1=interval2;
    interval2=tmp;
}
//далее у нас точно интервал 1 начинается не позже 2го (одновременно или раньше)
//значит если второй начинается раньше чем первый заканчивается => они пересекаются
return neighbours?
    (interval2[0]-1)<=interval1[1]
    :
    interval2[0]<interval1[1];
}


/**
 * сложение интервалов. проверка на то что они пересекаются не делается
 * @param interval1 array
 * @param interval2 array
 * @return array
 */
function intervalsAddition(interval1,interval2)
{
    return [
        Math.min(interval1[0],interval2[0]),
        Math.max(interval1[1],interval2[1]),
    ];
}

/**
 * Сравнивает интервалы
 * @param interval1
 * @param interval2
 * @return int 1 - первый позже, -1 - первый раньше, 0 - начинаются одновременно
 */
function intervalsCompare(interval1,interval2)
{
    if (interval1[0]===interval2[0]) return 0;
    return  (interval1[0] > interval2[0])?1:-1;
}

function intervalsSort(intervals)
{
    intervals.sort(intervalsCompare)
}



/**
 * Возвращает отсутствия пользователя в периоде в виде массива градиента периодов и подсказки-пояснения
 * @param start
 * @param end
 * @param user
 * @return Map
 */
function userPeriodAbsents(start,end,user) {
    //если на пользователя нет отсутствий, то
    const empty= new Map([['background','none'],['title','']]);
    start+=$globServerTimeShift/1000;
    if (end) {end+=$globServerTimeShift/1000} else {end=start+86400*7;}
    console.log('userPeriodAbsents('+start+','+end+','+user+')');
    if (!$globAbsents.has(user)) {
        //console.log('no absents loaded for user '+user);
        return empty;
    }
    let userAbsents=$globAbsents.get(user);

    //иначе работаем
    const busy='rgba(255,140,0,0.7)';
    const avail='transparent';


    //округляем начало и конец до дней
    let start_day=Math.floor((start)/86400);
    let end_day=Math.floor((end-1)/86400);

    let work_start=start_day;
    let work_end=end_day;
    let periods=[]; //периоды отсутствия сотрудника в указанном интервале времени
    let titles=[]; //TTIP который будет показывать список отсутствий пользователя
    let debug='';

    // перебор по элементам в формате [ключ, значение]
    for (let item of userAbsents) {
        //console.log(item[1]);
        let from=Math.floor((item[1]['UNIX_FROM']+$globServerTimeShift)/86400000);
        let to=Math.floor((item[1]['UNIX_TO']+24*3600-1+$globServerTimeShift)/86400000);

        console.log('Checking for absent ['+from+','+to+'] to intersect ['+work_start+','+work_end+']    //    ' +
        '['+unixTimeToMyDate(from*86400000)+','+unixTimeToMyDate(to*86400000)+'] intersect with ['+unixTimeToMyDate(work_start*86400000)+','+unixTimeToMyDate(work_end*86400000)+']');

        if (from>end_day) continue; //все что началось позже обозримого периода не интересно
        if (to<start_day) continue; //все что закончилось раньше нашего периода - тоже

        //если полностью покрывает обозримый период
        if (from<=work_start && to>=work_end) {
            console.log('full period absent for user '+user);
            return new Map([
                ['background',busy],
                ['title','Полностью отсутствует '+unixTimeToMyDate(from*86400000)+' - '+unixTimeToMyDate(to*86400000)]
            ]);
        }

        //ограничиваем рассматриваемый элемент границами периода на который составляем расписание
        if (from <= start_day) from=start_day;
        if (to >= end_day) to = end_day;

        //объявляем интервал
        let interval=[from,to];

        //добавляем его в TTIP
        titles.push(unixTimeToMyDate(from*86400000)+' - '+unixTimeToMyDate(to*86400000));

        //объединяем с соседними и пересекающимися интервалами
        if (periods.length) {
            for (let i=0; i<periods.length; i++ ){
                if (intervalsIntersect(periods[i],interval,true)) {
                    //если пересекся с уже обнаруженным периодом - то период сливаем с текущим интервалом
                    interval=intervalsAddition(periods[i],interval);
                    periods.slice(i,1);
                    i--;
                }
            }
        }

        //кладем в общую кучку периодов отсутствия
        periods.push(interval);
    }

    if (!periods.length) {
        console.log('no absents found in period for user '+user);
        return empty;
    }

    intervalsSort(periods);

    //к этому моменту мы имеем отсортированный массив непересекающихся и не соприкасающихся интервалов

    let prevPos=null;
    let css=[];
    for (let i=0; i<periods.length; i++ ){
        let period=periods[i];
        let cssStart=Math.round(100*(period[0]-start_day)/(end_day-start_day));
        let cssEnd=Math.round(100*(period[1]-start_day)/(end_day-start_day));
        if (prevPos!==null) {
            css.push(avail+' '+prevPos+'%');
            css.push(avail+' '+cssStart+'%');
        } else if (cssStart) {
            css.push(avail+' 0%');
            css.push(avail+' '+cssStart+'%');
        }
        css.push(busy+' '+cssStart+'%');
        css.push(busy+' '+cssEnd+'%');
        prevPos=cssEnd;
    }

    let style;
    if (prevPos!==null){
        if (prevPos<100) {
            css.push(avail+' '+prevPos+'%');
            css.push(avail+' 100%');
        }
        style='linear-gradient( to bottom, '+css.join(', ')+')';
        console.log(periods);
        console.log(style);
    } else {
        style=null;
    }

    return new Map([['background',style],['title','Отсутствует '+titles.join(', ')]])
}



function updateUserPeriodColumnAbsents($td) {
    let $row=$td.parents('div.row[data-unix-start-date]');
    if (!$row.length) return null;

    let period_start=Math.round($row.attr('data-unix-start-date')/1000);
    let period_end=Math.round($row.attr('data-unix-end-date')/1000);
    let user=Number($td.attr('data-user-id'));
    let bg=userPeriodAbsents(period_start,period_end,user);
    $td.css('background',bg.get('background'));
    $td.attr('title',bg.get('title'));
}

function updateUserHeaderAbsents(user) {
    if (!$globAbsents.has(user)) return;
    let absents=$globAbsents.get(user)
    let userClass='';
    let daysToAbsence=99999;
    let actualAbsence='';
    let title='';
    //ищем отсутствия пользователя

    for (let item of absents) {
        console.log(item[1]);
        let to=Math.floor((item[1]['UNIX_TO']+$globServerTimeShift)/86400000);
        let today=Math.floor((Date.now())/86400000);
        if (to>=today) {
            //если мы еще не отсутствуем (0)
            if (daysToAbsence) {
                let from=Math.floor((item[1]['UNIX_FROM']+$globServerTimeShift)/86400000);
                //суток до отпуска/отсутствия

                let test=Math.max(from-today, 0);
                if (test < daysToAbsence) {
                    daysToAbsence=test;
                    actualAbsence=unixTimeToMyDate(from*86400000)+' - '+unixTimeToMyDate(to*86400000);
                }
            }
        } //else console.log ()
    }
    if (!daysToAbsence) {
        userClass='ABSENT';
    } else if (daysToAbsence<7) {
        userClass='WEEK_ABSENT';
    } else if (daysToAbsence<14) {
        userClass = 'TWO_WEEK_ABSENT';
    }
    if (daysToAbsence<90) {
        title=daysToAbsence?
            daysToAbsence+"дн до следующего отсутствия ("+actualAbsence+")":
            "Отсутствует ("+actualAbsence+")";

    }

    console.log('Setting class '+userClass+' to user '+user+'// daysToAbsence '+daysToAbsence);
    $('div.headerRow')
        .find('td.userColumn[data-user-id='+user+']')
        .removeClass('ABSENT WEEK_ABSENT TWO_WEEK_ABSENT')
        .addClass(userClass)
        .attr('title',title);

}



function userAbsentsUpdateFromJson(userId)
{
    $('td.userColumn[data-user-id='+userId+']').each(function (){
        updateUserPeriodColumnAbsents($(this));
    });
    updateUserHeaderAbsents(userId);
}


function userAbsentsInitItemData(data) {
    data['UNIX_FROM']=bitrixDateTimeToUnix(data['ACTIVE_FROM']);
    data['UNIX_TO']=bitrixDateTimeToUnix(data['ACTIVE_TO']);
    let userId=Number(data['PROPERTY_USER_VALUE']);
    //либо вытаскиваем набор отсутствий пользователя из общего набора либо создаем пустой если его еще нет
    let userAbsents=($globAbsents.has(userId))?$globAbsents.get(userId):new Map();
    userAbsents.set(data['ID'],data)
    $globAbsents.set(userId,userAbsents);
    console.log('got absence for user '+userId);
    userAbsentsUpdateFromJson(userId);
}

function loadAbsents(from,to,users,onComplete=null) {
    //загружаем элементы
    //console.log(users);
    //console.log('loading jobs for users '+users.join(',')+' from '+unixTimeToMyDate(from*1000)+' to '+unixTimeToMyDate((to-1)*1000));
    $.ajax({
        url: $globalAbsentsApiUri+'/load/'+from+'/'+to+'/'+users.join(','),
        error: function () {
            console.log('error loading absents')
            if (onComplete) onComplete();
        },
        success: function (data) {
            //если в новой ячейке есть уже такая задача значит местами меняются ответственный и соисполнитель
            console.log('got items')
            let json = $.parseJSON(data);
            json.forEach(function(item){userAbsentsInitItemData(item)});
            if (onComplete) onComplete();
            return true;
        },
    });

}