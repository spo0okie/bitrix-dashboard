<?php
/**
 * @var $APPLICATION object
 * @var $day integer
 * @var $week integer
 * @var $today integer
 * @var $monday1 integer
 * @var $sunday1 integer
 * @var $monday2 integer
 * @var $sunday2 integer
 * @var $monday3 integer
 * @var $sunday6 integer
 * @var $monday7 integer
 * @var $prevMonday1 integer
 * @var $prevSunday1 integer
 * @var $prevMonday2 integer
 * @var $prevSunday2 integer
 */

require_once "conf.php";

$jsUsers=[];
foreach ($canban_users as $idx=>$name)
	$jsUsers[]="[$idx,'$name']";

require('bootstrap.php');

?>


<!DOCTYPE html>
<html lang="ru">
<head>
    <?php $APPLICATION->ShowHead();  ?>

    <style type="text/css">
        td.userColumn {
            width:<?= 99/count($canban_users) ?>%;
            text-align: center;
        }
    </style>

	<link rel="stylesheet" type="text/css" href="dev_main.css" />
	<link rel="stylesheet" type="text/css" href="team_table.css" />
	<link rel="stylesheet" type="text/css" href="periods.css" />
	<!-- jQuery -->
	<script type="text/javascript" src="js/jquery.js"></script>
    <script type="text/javascript" src="js/jquery-ui.js"></script>
	<!-- jQuery ModalLink -->
	<link rel="stylesheet" type="text/css" href="css/jquery.modalLink-1.0.0.css">
	<script type="text/javascript" src="js/jquery.modalLink-1.0.0.js"></script>
	<script type="text/javascript" src="js/dev_page.js"></script>
	<script type="text/javascript" src="js/dev_tasks.js"></script>
	<script type="text/javascript" src="js/dev_jobs.js"></script>
	<script type="text/javascript" src="js/dev_absents.js"></script>
	<script type="text/javascript" src="js/dev_tickets.js"></script>
	<script type="text/javascript" src="js/page_layout.js"></script>
	<script type="text/javascript" src="js/jquery.autoResize.js"></script>
	<script type="text/javascript" src="js/js.cookie.min.js"></script>
</head>
<body>


<!-- // ШАПКА С ПОЛЬЗОВАТЕЛЯМИ -->
<div class="row horizontal headerRow">
    <div class="rowTitleCell">&nbsp;</div>
    <table class="">
	    <tr class="pageToolBar">
		    <td colspan="<?= count($canban_users) ?>">
			    <!--  ПАНЕЛЬКА С КНОПКАМИ -->
			    <span class="toolsPanel2">
				    <span id="globToggleClosed" class="clickable" title="Отображать закрытые задачи" onclick="pageToggleClosedTasks()">[^]</span>
				    <span id="globToggleTickets" class="clickable" title="Отображать тикеты" onclick="pageToggleTickets()">[-]</span>
				    <span id="globToggleJobs" class="clickable" title="Отображать работы" onclick="pageToggleJobs()">[*]</span>
				    <span id="globToggleParticipants" class="clickable" title="Отображать соисполнителей" onclick="pageToggleParticipants()">[&lt;&gt;]</span>
			    </span>
			    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
			    <span>
				    <span id="switchBg0" class="clickable"  onclick="pageSwitchBg(0)">[bg0]</span>
				    <span id="switchBg1" class="clickable"  onclick="pageSwitchBg(1)">[bg1]</span>
				    <span id="switchBg2" class="clickable"  onclick="pageSwitchBg(2)">[bg2]</span>
			    </span>
		    </td>
	    </tr>
        <?= renderRowUsers() ?>
    </table>
</div>



<script>
    pageSwitchBg();
    const d = new Date();
    let $globMonday0=<?= $monday1*1000; ?>;
    let $globSunday0=<?= $sunday1*1000; ?>;
    let $globWeekDay=(d.getDay()-1 < 0)?6:d.getDay()-1;
    let $globAuditorsIds="<?= $auditors_ids ?>";
    let $globGroupId="<?= $group_id ?>";
    let $globShowClosed=(Cookies.get('globShowClosed')==='true');
    let $globShowJobs=(Cookies.get('globShowJobs')==='true');
    let $globShowTickets=(Cookies.get('globShowTickets')==='true');
    let $globShowParticipants=(Cookies.get('globShowParticipants')==='true');
    if ($globShowClosed) $('span#globToggleClosed').addClass('toggleOn');
    if ($globShowJobs) $('span#globToggleJobs').addClass('toggleOn');
    if ($globShowTickets) $('span#globToggleTickets').addClass('toggleOn');
    if ($globShowParticipants) $('span#globToggleParticipants').addClass('toggleOn');
    console.log('today is '+$globWeekDay);
    //console.log($globShowClosed)
    //console.log($globShowClosed?'showing closed':'hiding closed');

    let $globUserList=new Map([<?= implode(',',$jsUsers) ?>]);
    /*$body.append(renderTeamWeek(-1));
    $body.append(renderTeamWeek(0));
    $body.append(renderTeamWeek(1));
    loadJobs($globMonday0/1000-86400*7,$globSunday0/1000+86400*7,[...$globUserList.keys()]);*/
    loadTeamWeek(-1);
    loadTeamWeek(0);
    loadTeamWeek(1);
    loadTeamWeek(2);
    loadTeamWeek(3);
    loadTeamWeek(4);
    loadTeamWeek(5,true);
</script>
</body>
</html>