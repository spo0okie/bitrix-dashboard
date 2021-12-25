<?php
/**
 * Складывает массивы или элементы в один массив
 * @param $item1
 * @param $item2
 * @return array
 */
function arraysAddition($item1,$item2)
{
    if (!is_array($item1)) $item1=[$item1];
    if (!is_array($item2)) $item2=[$item2];
    return array_merge($item1,$item2);
}

/**
 * проверка пересечения интервалов
 * @param $interval1 array
 * @param $interval2 array
 * @param bool $neighbours
 * @return bool
 */
function intervalsIntersect($interval1,$interval2,$neighbours=false)
{
    // сортируем интервалы так, чтобы второй был не раньше первого
    if ($interval2[0]<$interval1[0]) {
        $tmp=$interval1;
        $interval1=$interval2;
        $interval2=$tmp;
    }
    //далее у нас точно интервал 1 начинается не позже 2го (одновременно или раньше)
    //значит если второй начинается раньше чем первый заканчивается => они пересекаются
    return $neighbours?
        ($interval2[0]-1)<=$interval1[1]
        :
        $interval2[0]<$interval1[1];
}


/**
 * сложение интервалов. проверка на то что они пересекаются не делается
 * @param $interval1 array
 * @param $interval2 array
 * @return array
 */
function intervalsAddition($interval1,$interval2)
{
    return [
        min($interval1[0],$interval2[0]),
        max($interval1[1],$interval2[1]),
        //arraysAddition($interval1[2],$interval2[2]),
    ];
}

/**
 * Сравнивает интервалы
 * @param $interval1
 * @param $interval2
 * @return int 1 - первый позже, -1 - первый раньше, 0 - начинаются одновременно
 */
function intervalsCompare($interval1,$interval2)
{
    if ($interval1[0]==$interval2[0]) return 0;
    return  ($interval1[0] > $interval2[0])?1:-1;
}

function intervalsSort(&$intervals)
{
    usort($intervals,['intervalsCompare']);
}



/**
 * Возвращает отсутствия пользователя в периоде в виде массива градиента периодов и подсказки-пояснения
 * @param $start
 * @param $end
 * @param $user
 * @return string[]
 */
function userPeriodAbsents($start,$end,$user) {
    global $absents;

	$busy='rgba(255,140,0,0.7)';
	//$busy='rgba(0,0,0,0.7)';
	//$avail='rgba(127,127,127,0)';
	$avail='transparent';

    //округляем начало и конец до дней
    $start_day=(int)($start/86400);
    $end_day=(int)($end/86400);

    $work_start=$start_day;
    $work_end=$end_day;
    $periods=[];
    $titles=[]; //TTIP который будет показывать список отсуствий пользователя
    $debug='';

    foreach ($absents[$user] as $item) {
        $from=(int)(strtotime($item->fields['ACTIVE_FROM'].' 00:00:00')/86400);
        $to=(int)(strtotime($item->fields['ACTIVE_TO'].' 23:59:59')/86400);

        if ($from>=$end_day) continue; //все что началось позже обозримого периода не интересно
        if ($to<=$start_day) continue; //все что закончилось раньше нашего периода - тоже

        //если полностью покрывает обозримый период
        if ($from<=$work_start && $to>=$work_end) {
            return [
                'style'=>"background:$busy",
                'title'=>'Полностью отсутствует '.$item->fields['ACTIVE_FROM'].' - '.$item->fields['ACTIVE_TO']
            ];
        }

        //ограничиваем элемент границами периода
        if ($from <= $start_day) $from=$start_day;
        if ($to >= $end_day) $to = $end_day;

        //объявляем интервал
        $interval=[$from,$to];

        //добавляем его в TTIP
        $titles[]=$item->fields['ACTIVE_FROM'].' - '.$item->fields['ACTIVE_TO'];

        //объединяем с соседними и пересекающимися интервалами
        if (count($periods))
            foreach ($periods as $i=>$period)
                if (intervalsIntersect($period,$interval,true)) {
                    $interval=intervalsAddition($period,$interval);
                    unset($periods[$i]);
                }

        //кладем в общую кучку периодов отсутствия
        $periods[]=$interval;
    }

    if (!count($periods)) {
        return [
            'display'=>null,
            'title'=>null,
        ];
    }

    intervalsSort($periods);

    //к этому моменту мы имеем отсортированный массив непересекающихся и не соприкасающихся интервалов
    //

    $prevPos=null;
    $css=[];
    foreach ($periods as $period) {
        $cssStart=(int)(100*($period[0]-$start_day)/($end_day-$start_day));
        $cssEnd=(int)(100*($period[1]-$start_day)/($end_day-$start_day));
        if (!is_null($prevPos)) {
            $css[]=$avail.' '.$prevPos.'%';
            $css[]=$avail.' '.$cssStart.'%';
        } elseif ($cssStart) {
	        $css[]=$avail.' 0%';
	        $css[]=$avail.' '.$cssStart.'%';
        }
        $css[]=$busy.' '.$cssStart.'%';
        $css[]=$busy.' '.$cssEnd.'%';
        $prevPos=$cssEnd;
    }

    if (!is_null($prevPos)){
        if ($prevPos<100) {
            $css[]=$avail.' '.$prevPos.'%';
            $css[]=$avail.' 100%';
        }
        $style='background: linear-gradient( to bottom, '.implode(', ',$css).')';
    } else {
	    $style=null;
    }

    return [
        'style'=>$style,
        'title'=>'Отсутствует '.implode(', ',$titles)
    ];
}
