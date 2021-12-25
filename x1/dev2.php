<?php
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/bx_root.php");
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

CModule::IncludeModule("tasks");

function halt() {
    echo "error";
    exit();
}
$userID=CUser::GetID();

if (!isset($_GET['task'])) halt();
$taskID=$_GET['task'];

//$rsTask = CTasks::GetByID($taskID);
//if (!($arTask = $rsTask->GetNext())) halt();


$oTaskItem=new CTaskItem($taskID,$userID);
$arTask=$oTaskItem->GetData();

if (isset($_GET['responsible'])) {
    //$oTaskItem->delegate($_GET['responsible']);
    //$arTask=
    $oTaskItem->Update(['RESPONSIBLE_ID'=>$_GET['responsible']]);
    if (in_array($_GET['responsible'],$arTask['ACCOMPLICES'])) {
        //echo ('got new responsible in accomplices');
        $accomplices=$arTask['ACCOMPLICES'];
        unset($accomplices[array_search($_GET['responsible'],$accomplices)]);
        $accomplices[]=$arTask['RESPONSIBLE_ID'];
        //var_dump($accomplices);
        $oTaskItem->Update(['ACCOMPLICES'=>$accomplices]);
    }
}

if (isset($_GET['deadline'])) {
    $deadline=$_GET['deadline'];
    if ($deadline=='null') {
        $deadline='';
    } else {
        $deadline.=' 17:00:00';
    }

    $oTaskItem->Update(['DEADLINE'=>$deadline]);
    //echo "deadline set to {$deadline}";
}

if (isset($_GET['status'])) {
    $oTaskItem->Update(['STATUS'=>$_GET['status']]);
/*    switch ($_GET['status']) {
        case 2: $oTaskItem->renew(); break;
        case 3: $oTaskItem->startExecution(); break;
    }*/
}

if (isset($_GET['sorting'])) {
	$oTaskItem->Update(['XML_ID' => $_GET['sorting']]);
}
//CTasks::Update($taskID,$arTask);

echo "ok";