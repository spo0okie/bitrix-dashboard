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


$globShowClosed=isset($_GET['closed'])&&$_GET['closed'];
$globShowTickets=isset($_GET['tickets'])&&$_GET['tickets'];
$globShowParticipants=isset($_GET['participants'])&&$_GET['participants'];

$canban_users= [
	1127=>'Акаев (797)',
	3586=>'Бардина (6644)',
    1607=>'Аманатов (772)',
    //1126=>'Галушкин (149)',
    4115=>'Кошпаев (5041)',
    852=> 'Османов (1129)',
    2698=>'Ревякин (5034)',
	3588=> 'Савцев (6645)',
	744=> 'Сычев (823)',
    3290=>'Цовбун (6647)',
    //4124=>'Эльберг (6646)',
];

require('lib9/bootstrap.php');

?>



<html>
<head>
    <?php $APPLICATION->ShowHead();  ?>

    <style type="text/css">
        td.userColumn {
            width:<?= 99/count($canban_users) ?>%;
            text-align: center;
        }
    </style>

	<link rel="stylesheet" type="text/css" href="lib9/dev_main.css" />
	<link rel="stylesheet" type="text/css" href="lib9/team_table.css" />
	<link rel="stylesheet" type="text/css" href="lib9/periods.css" />

	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.js"></script>
    <script type="text/javascript" src="//ajax.aspnetcdn.com/ajax/jquery.ui/1.10.3/jquery-ui.js"></script>
	<!-- jQuery ModalLink -->
	<link rel="stylesheet" type="text/css" href="css/jquery.modalLink-1.0.0.css">
	<script type="text/javascript" src="js/jquery.modalLink-1.0.0.js"></script>
	<!-- jQuery Modal -->
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-modal/0.9.1/jquery.modal.min.js"></script>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-modal/0.9.1/jquery.modal.min.css" />

	<script type="text/javascript" src="lib9/dev_page.js"></script>
	<script type="text/javascript" src="lib9/dev_tasks.js"></script>
	<script type="text/javascript" src="lib9/dev_jobs.js"></script>
	<script type="text/javascript" src="lib8/jquery.autoResize.js"></script>
    <script type="text/javascript">
        let $globShowClosed=<?= $globShowClosed?'true':'false' ?>;
        let $globShowTickets=<?= $globShowTickets?'true':'false' ?>;
        let $globShowParticipants=<?= $globShowParticipants?'true':'false' ?>;
    </script>
</head>
<body>

<?php // ПАНЕЛЬКА С КНОПКАМИ ?>
<div class="toolsPanel">
    <span class="clickable" title="Отображать закрытые задачи" onclick="pageToggleClosedTasks()">[^]</span>
	<span class="clickable" title="Отображать тикеты" onclick="pageToggleTickets()">[-]</span>
	<span class="clickable" title="Отображать работы" onclick="pageToggleJobs()">[*]</span>
    <span class="clickable" title="Отображать соисполнителей" onclick="pageToggleParticipants()">[&lt;&gt;]</span>
</div>

<?php // ШАПКА С ПОЛЬЗОВАТЕЛЯМИ ?>
<div class="row headerRow">
    <div class="rowTitleCell">&nbsp;</div>
    <table class="">
        <?= renderRowUsers() ?>
    </table>
</div>



<?php // ПОЗАПРОШЛАЯ НЕДЕЛЯ ?>
<?php
$periods=[];

$weekTitles=[
	-4=>'4 недели назад',
	-3=>'3 недели назад',
	-2=>'2 недели назад',
	-1=>'неделя назад',
	0=>'эта неделя',
	1=>'след. неделя',
	2=>'2я неделя',
	3=>'3я неделя',
];

$periods[]=[
	'title'=>   'месяц назад',
	'start'=>   $monday1-$week*9,
	'end'=>     $sunday1-$week*5,
	'class'=>   'period5 monthPeriod',
	'id' =>     'period-5',
	'expanded'=>false,
	'overdue'=> false,
];

foreach ($weekTitles as $i => $title) {
	$id=str_replace('-','rev','period'.$i);
	$class='period'.abs($i);
	$expandPeriod=isset($_GET['expand'.$id])&&$_GET['expand'.$id];
	if (!$expandPeriod) {
		$periods[]=[
			'title'=>   $title,
			'start'=>   $monday1+$week*$i,
			'end'=>     $sunday1+$week*$i,
			'class'=>   $class.' weekPeriod',
			'id'=>      $id,
			'expanded'=>false,
		];
	} else {
		for ($j = 1; $j<8; $j++ ){
			$periods[]=[
				'title'=>   myShortDate($monday1+$week*$i+($j-1)*$day),
				'start'=>   $monday1+$week*$i+($j-1)*$day,
				'end'=>     $monday1+$week*$i+($j)*$day-1,
				'class'=>   $class.' day'.$j.' dayPeriod',
				'id'=>      $id.'-day'.$j,
				'expanded'=>true,
			];
		}
	}

}


$periods[]=[
    'title'=>   'через месяц',
    'start'=>   $monday1+$week*4,
    'end'=>     $sunday1+$week*8,
    'class'=>   'period4 monthPeriod',
    'overdue'=> false,
	'id' =>     'period4',
	'expanded'=>false,
];
$periods[]=[
    'title'=>   'далеко',
    'start'=>   $monday1+$week*9,
    'end'=>     null,
    'overdue'=> false,
    'class'=>   'period5 monthPeriod',
	'id' =>     'period5',
	'expanded'=>false,
];

$ids=[];

foreach ($periods as $period) {
    $start=     $period['start'];
    $end=       $period['end'];
    $startDate= date('Y-m-d',$start);
    $ID=        'day'.(int)(($start-$monday1)/$day);
	$ID=        $period['id'];
	$periodClass=$period['class'];;

	$ids[]=$ID;
	/**
	 $globShowClosed=<?= $globShowClosed?'true':'false' ?>;
	 $globShowTickets=<?= $globShowTickets?'true':'false' ?>;
	 $globShowParticipants=<?= $globShowParticipants?'true':'false' ?>;
	 */

    if (!is_null($end) && $end<$today) {
	    //прошлые периоды
	    $closedTicketsDraw=true;
	    $closedTicketsHide=$globShowTickets;
        $semiClosedTicketsDraw=false;
        $openTicketsDraw=false;
	    $openTasksDraw=false;
	    $overdueTasksDraw=false;
        $closedTasksDraw=true;
        $closedTasksHide=false;
	    $periodClass.=' closedPeriod';
	    $periodDisplay=$globShowClosed?'':$hidden;

    } elseif ($start>=$today+$day) {
	    //будущие периоды
	    $closedTicketsDraw=false;
	    $closedTicketsHide=$globShowTickets;
	    $semiClosedTicketsDraw=false;
	    $openTicketsDraw=false;
	    $openTasksDraw=true;
	    $overdueTasksDraw=false;
	    $closedTasksDraw=false;
	    $closedTasksHide=false;
	    $periodDisplay='';
    } else {
    	//текущая неделя/день
	    $closedTicketsDraw=true;
	    $closedTicketsHide=$globShowTickets;
	    $semiClosedTicketsDraw=true;
	    $openTicketsDraw=true;
	    $openTasksDraw=true;
	    $overdueTasksDraw=true;
	    $closedTasksDraw=true;
	    $closedTasksHide=!$globShowClosed;
	    $periodDisplay='';
	    //$periodClass.=' now';
    }

	//$overdueTasksDraw=false;

	//echo $openTasksDraw?'Y':'N';
	$tipStart=myDate($start);
	$tipEnd=myDate($end);
	//$tipStart=date('Y-m-d H:i:s (Z/z)',$start);
	//$tipEnd=date('Y-m-d H:i:s (Z/z)',$end);
    if ($period['expanded']) {
	    $tip=$tipStart;
	    $tokens=explode('-',$ID);
	    $expandId=count($tokens)?$tokens[0]:$ID;
	    $title='<h3 class="href"  onclick="window.location.href=getPageStateUrl(\'expand'.$expandId.'\',false)+\'#'.$tokens[0].'\'">'.$period['title'].'</h3>';
    } else {
	    $tip=$tipStart.' - '.$tipEnd;
	    $title='<h3 class="href" onclick="window.location.href=getPageStateUrl(\'expand'.$period['id'].'\',\'1\')+\'#'.$period['id'].'-day1\'">'.$period['title'].'</h3>';
    }

?>
<div class="row <?= $periodClass ?> " <?= $periodDisplay ?> id="<?= $ID ?>">
    <div class="rowTitleCell" title="<?= $tip ?>" onclick="scrollToAnchor('<?= $ID ?>')">
        <?= $title ?>
    </div>

    <div class="rowDataCell">
        <?php drawTeamTasks(
            $start,                 //начало периода
            $end,                   //конец периода
            $ID,
            $periodClass,           //класс периода (для раскраски)
            $closedTicketsDraw,     //рисовать ли закрытые тикеты
            $closedTicketsHide,     //скрыть ли закрытые тикеты
            $semiClosedTicketsDraw, //рисовать ли закрытые тикеты
            $openTicketsDraw,       //рисовать ли открытые тикеты
	        $openTasksDraw,         //рисовать ли открытые задачи
	        $overdueTasksDraw,      //рисовать ли просроченные задачи
            $closedTasksDraw,       //рисовать закрытые задачи
	        $closedTasksHide,       //рисовать ли их скрытыми
	        $globShowParticipants   //показывать ли задачи, где пользователь помогает, а не ответственный
        ) ?>
    </div>
</div>
<?php } ?>
<script>
	$globScrollItems=[
	    <?php foreach ($ids as $id) echo "$('div#$id:visible'),"; ?>
	];
</script>
</body>
</html>