<?php
/**
 * @var $APPLICATION object
 * @var $sunday1 integer
 * @var $monday2 integer
 * @var $sunday2 integer
 * @var $monday3 integer
 * @var $sunday6 integer
 * @var $monday7 integer
 */

$hidden='style="display:none"';
$auditors_ids="745"; //Комиссаров
$group_id="13"; //Служба ИТ
$weekDays=[
	1=>'пн',
	2=>'вт',
	3=>'ср',
	4=>'чт',
	5=>'пт',
	6=>'сб',
	7=>'вс',
];

function myDate($date) {
	global $weekDays;
	$date1=date('d.m.Y',$date);
	$wDay=$weekDays[intval(date('N',$date))];
	return "$date1($wDay)";
}

function myShortDate($date) {
	global $weekDays;
	$date1=date('d.m',$date);
	$wDay=$weekDays[intval(date('N',$date))];
	return "$date1($wDay)";
}



function renderRowUsers($tdClass='',$tdStyle='',$trClass='',$trStyle='')
{
    global $canban_users;
    global $absents;
    echo "<tr class='$trClass' $trStyle>";
    foreach ($canban_users as $user=>$name) {
        $userClass='';
        $daysToAbsence=99999;
        $actualAbsence='';
        //ищем отсутствия пользователя
        foreach ($absents[$user] as $item) if (strtotime($item->fields['ACTIVE_TO'].' 23:59:00')>time()){
            //если мы еще не отсутствуем (0)
            if ($daysToAbsence) {
                $from=strtotime($item->fields['ACTIVE_FROM']);
                //$to=strtotime($item->fields['ACTIVE_TO']);

                //суток до отпуска/отсутствия

                $test=(int)max(($from-time())/86400 , 0);
                if ($test < $daysToAbsence) {
                    $daysToAbsence=$test;
                    $actualAbsence=$item->fields['ACTIVE_FROM'].'-'.$item->fields['ACTIVE_TO'];
                }
            }
        }
        if (!$daysToAbsence) {
            $userClass='ABSENT';
        } elseif ($daysToAbsence<7) {
            $userClass='WEEK_ABSENT';
        } elseif ($daysToAbsence<14) {
            $userClass = 'TWO_WEEK_ABSENT';
        }
        if ($daysToAbsence<90) {
	        $title=$daysToAbsence?
		        "${daysToAbsence}дн до следующего отсутствия ($actualAbsence)":
		        "Отсутствует ($actualAbsence)";

        }
        echo "<td days=\"$daysToAbsence\" title='$title' data-user-id='$user' class='userColumn $tdClass $userClass' $tdStyle onclick='toggleUserLayout($user)'>$name</td>";
    }
    echo '</tr>';
}

function drawUserColumnHeader(
	$user,                  //пользователь
	$start,                 //начало периода
	$end,                   //конец периода
	$periodId,
	$openTicketsDraw,       //рисовать ли открытые тикеты
	$semiClosedTicketsDraw,
	$hidden
) {

	//$periodId=str_replace('-','\-',$periodId);

	$closedTicketsCount=count(getClosedTickets($user,$start,$end));
	if ($semiClosedTicketsDraw) $closedTicketsCount+=count(getSemiClosedTickets($user));
	$openTicketsCount=false;
	if ($openTicketsDraw) {
		$openTicketsCount=count(getOpenTickets($user));
	}
	if (is_null($end)) {
		//отложенные тикеты в периоде с открытым концом
		$openTicketsCount=count(getDelayedTickets($user));
	}

	//if ($closedTicketsCount || $openTicketsCount) {
		echo '<div class="colHeader" '.
			'title="Тикеты сотрудника за этот период" '.
			'date="'.date('d.m.Y',$start).'" '.
			"userid=\"$user\" ".
			"onclick=periodUserToggleTickets($user,'$periodId')".

		'>';
		if ($closedTicketsCount)
			echo "<span class='closedTicketsCountLabel' " . ($hidden?'style="display:none"':'') . " title='Количество закрытых тикетов'>$closedTicketsCount</span>";
		if ($openTicketsCount) echo "<span class='openTicketsCountLabel' " . ($hidden?'style="display:none"':'') . " title='Количество открытых тикетов'>$openTicketsCount</span>";
		echo '</div>';
	//}
}


function drawUserColumn(
	$user,                  //пользователь
	$name,                  //имя (не помню зачем)
	$start,                 //начало периода
	$end,                   //конец периода
	$periodId,           //класс периода (для раскраски)
	$periodClass,           //класс периода (для раскраски)
	$closedTicketsDraw,     //рисовать ли закрытые тикеты
	$closedTicketsHide,     //скрыть ли закрытые тикеты
	$semiClosedTicketsDraw, //рисовать ли закрытые тикеты
	$openTicketsDraw,       //рисовать ли открытые тикеты
	$openTasksDraw,         //рисовать ли открытые задачи
	$overdueTasksDraw,      //рисовать ли просроченные задачи
	$closedTasksDraw,       //рисовать закрытые задачи
	$closedTasksHide,       //рисовать ли их скрытыми
	$showParticipants       //показывать ли задачи, где пользователь помогает, а не ответственный
) {

	$abs=userPeriodAbsents($start,$end,$user);
	if (!is_null($abs['title'])) {
		$title="title='${abs['title']}'";
	} else $title='';

	if (!is_null($abs['style'])) {
		$style="style='${abs['style']}'";
	} else $style='';

	//если у нас вся строка - закрытый период, то вложенный UL дополнительно не скрываем
	$divClass=(strpos($periodClass,'closedPeriod')===false)?'closedPeriod':'';

	?>

	<td class='userColumn $periodClass' <?= $title ?> <?= $style ?>
		periodId='<?= $periodId ?>'
		userId='<?= $user ?>'
		startDate='<?= date('d.m.Y',$start)?>'
		endDate='<?= date('d.m.Y',$end)?>'
	>

	<?php drawUserColumnHeader($user,$start,$end,$periodId,$openTicketsDraw,$semiClosedTicketsDraw,$closedTicketsHide) ?>

	<ul class='nonDroppableBlock closedItems <?= $divClass ?>' <?= ($closedTasksHide?'style="display:none"':'') ?>>
		<?php 	//закрытые на этой неделе задачи
			if ($closedTasksDraw) drawClosedTasks($user,$start,$end,$showParticipants);
			//закрытые тикеты
			if ($closedTicketsDraw) drawClosedTickets($user,$start,$end,$closedTicketsHide);
			//почти закрытые (ждут авто закрытия)
			if ($semiClosedTicketsDraw) drawSemiClosedTickets($user,$closedTicketsHide);

			if ($closedTicketsDraw) {
				drawClosedJobs($user, $start, $end, false);
				echo renderNewJobLink($user, date('d.m.Y', $start), $periodId, true);
			}
		?>
	</ul>

	<ul class="nonDroppableBlock">
		<?php
		if ($openTicketsDraw) {
			//незакрытые тикеты
			drawOpenTickets($user,$closedTicketsHide);
		}
		if (is_null($end)) {
			//отложенные тикеты в периоде с открытым концом
			drawDelayedTickets($user,$closedTicketsHide);
		}
		?>
	</ul>

	<?php
	if ($openTasksDraw) {
		//незакрытые задачи ?>
		<ul class='droppableBlock openItems openTasks'
		    date='<?= date('d.m.Y',$start)?>'
			userId='<?= $user ?>'
			username='<?= $name ?>'
			data-start-date="<?= date('d.m.Y',$start)?>"
			data-end-date="<?= $end?date('d.m.Y',$end):'null'?>"
			data-user-id="<?= $user ?>"
			data-user-name="'<?= $name ?>"
		>
			<?= renderNewJobLink($user, date('d.m.Y', $start), $periodId, false) ?>
			<?php
			$overdueTasksDraw?
				drawOpenJobs($user, null, $end, false):
	            drawOpenJobs($user, $start, $end, false);

			$overdueTasksDraw?
				drawOpenTasks($user, null, $end, $showParticipants):
				drawOpenTasks($user, $start, $end, $showParticipants);
			?>
			<?= renderNewTaskLink($user,date('d.m.Y', $end) . ' 17:00:00') ?>
		</ul>
		<?php
	}
	echo "</td>";
}


function drawTeamTasks(
    $start,                 //начало периода
    $end,                   //конец периода
    $periodId,
    $periodClass,           //класс периода (для раскраски)
    $closedTicketsDraw,     //рисовать ли закрытые тикеты
    $closedTicketsHide,     //скрыть ли закрытые тикеты
    $semiClosedTicketsDraw, //рисовать ли закрытые тикеты
    $openTicketsDraw,       //рисовать ли открытые тикеты
    $openTasksDraw,         //рисовать ли открытые задачи
    $overdueTasksDraw,      //рисовать ли просроченные задачи
    $closedTasksDraw,       //рисовать закрытые задачи
    $closedTasksHide,       //рисовать ли их скрытыми
    $showParticipants       //показывать ли задачи, где пользователь помогает, а не ответственный
) {
    global $canban_users;
    echo "<table class='canban'><tr class='$periodClass'>";
        foreach ($canban_users as $user => $name) {
            drawUserColumn(
                $user,                  //пользователь
                $name,                  //имя (не помню зачем)
                $start,                 //начало периода
                $end,                   //конец периода
	            $periodId,
                $periodClass,           //класс периода (для раскраски)
                $closedTicketsDraw,     //рисовать ли закрытые тикеты
                $closedTicketsHide,     //скрыть ли закрытые тикеты
                $semiClosedTicketsDraw, //рисовать ли закрытые тикеты
                $openTicketsDraw,       //рисовать ли открытые тикеты
                $openTasksDraw,         //рисовать ли открытые задачи
                $overdueTasksDraw,      //рисовать ли просроченные задачи
                $closedTasksDraw,       //рисовать закрытые задачи
	            $closedTasksHide,       //рисовать ли их скрытыми
	            $showParticipants       //показывать ли задачи, где пользователь помогает, а не ответственный
            );
        }
    echo "</tr></table>";
}



$day=60*60*24;
$week=$day*7;
$this_tz_str = 'Europe/Moscow';
date_default_timezone_set($this_tz_str);

$beginOfDay = new DateTime('today');//, $this_tz);

$today=$beginOfDay->getTimestamp();
$weekDay=intval(date('N',$today));


$monday1=$today-($weekDay-1)*$day;
$sunday1=$today+(7-$weekDay)*$day+86399; //+23:59:59
//echo date('D Y-m-d H:i:s (Z/z)',$monday1);
//echo date('D Y-m-d H:i:s (Z/z)',$sunday1);


