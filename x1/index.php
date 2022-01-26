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
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/bx_root.php");
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

require_once "conf.php";

$jsUsers=[];
foreach ($canban_users as $idx=>$name) $jsUsers[]="[$idx,'$name']";

?>


<!DOCTYPE html>
<html lang="ru">
<head>
    <?php $APPLICATION->ShowHead();  ?>
	<script>
		let $globalApiUri='/reviakin/x1/api/';
        let $globAuditorsIds="<?= $auditors_ids ?>";
        let $globGroupId="<?= $group_id ?>";
        let $globUserList=new Map([<?= implode(',',$jsUsers) ?>]);
	</script>
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




<script>
    pageSwitchBg();

    const d = new Date();
    let $globWeekDay=(d.getDay()-1 < 0)?6:d.getDay()-1;

    let dMonday0 = new Date();
    dMonday0.setDate(d.getDate()-$globWeekDay);
    dMonday0.setHours(0,0,0,0);

    let dSunday0 = new Date();
    dSunday0.setDate(d.getDate()-$globWeekDay+6);
    dSunday0.setHours(23,59,59,0);

    let dToday = new Date();
    dToday.setHours(0,0,0,0);

    //старые переменные. чтобы не переписывать весь код, продолжаем работать с ними
    let $globMonday0=dMonday0.getTime();
    let $globSunday0=dSunday0.getTime()
    let $globToday=dToday.getTime()

    //Проверяем (успешно), что полученные временные границы находятся в нашем (браузера) часовом поясе
    console.log('Monday: '+unixTimeToMyDateTime($globMonday0)+' // '+$globMonday0/1000);
    console.log('Sunday: '+unixTimeToMyDateTime($globSunday0)+' // '+$globSunday0/1000);
    console.log('TZ: '+d.getTimezoneOffset());
    let $globShowClosed=(Cookies.get('globShowClosed')==='true');
    let $globShowJobs=(Cookies.get('globShowJobs')==='true');
    let $globShowTickets=(Cookies.get('globShowTickets')==='true');
    let $globShowParticipants=(Cookies.get('globShowParticipants')==='true');
    console.log('today is '+$globWeekDay);
    //console.log($globShowClosed)
    //console.log($globShowClosed?'showing closed':'hiding closed');

    $('body').append(renderPageHeader());
    if ($globShowClosed) $('span#globToggleClosed').addClass('toggleOn');
    if ($globShowJobs) $('span#globToggleJobs').addClass('toggleOn');
    if ($globShowTickets) $('span#globToggleTickets').addClass('toggleOn');
    if ($globShowParticipants) $('span#globToggleParticipants').addClass('toggleOn');

    let $minLoadedWeek=0;
    let $maxLoadedWeek=0;
    loadTeamWeek(0);
    loadTeamWeek(1,true);
    toggleUserLayout(Cookies.get('globalUserLayout'))

    let minWeekToLoad=(Cookies.get('minLoadedWeek'));
    let maxWeekToLoad=(Cookies.get('maxLoadedWeek'));

    while ($minLoadedWeek>minWeekToLoad) loadTeamWeek($minLoadedWeek-1);
    while ($maxLoadedWeek<maxWeekToLoad) loadTeamWeek($maxLoadedWeek+1);

</script>
</body>
</html>