<?php



function getClosedTasks($user,$start,$end,$participants=true)
{
	global $tasks;

	$res=[];
	foreach ($tasks[$user] as $task) {
		if (
			($task['STATUS']==5||$task['STATUS']==6)
			&&
			$task['CLOSED_DATE']
			&&
			strtotime($task['CLOSED_DATE'])>=$start
			&&
			strtotime($task['CLOSED_DATE'])<$end
			&&
			($participants||$task['RESPONSIBLE_ID']==$user)
		)
			$res[]=$task;
	}
	return $res;
}

function getOpenTasks($user,$start,$end,$participants=true)
{
	global $tasks;

	$res=[];
	foreach ($tasks[$user] as $task) {
		if (
			($task['STATUS']!=5&&$task['STATUS']!=6)
			&&
			(
				//старт NULL тогда начиная с любой даты (лишь бы была)
				(is_null($start)&&$task['DEADLINE'] && strtotime($task['DEADLINE'])<$end)
				||
				//конец NULL,тогда берем в
				(is_null($end)&&(!$task['DEADLINE'] || strtotime($task['DEADLINE'])>=$start))
				||
				(!is_null($start)&&!is_null($end)&&(
						strtotime($task['DEADLINE'])>=$start
						&&
						strtotime($task['DEADLINE'])<$end
					))
			)
			&&
			($participants||$task['RESPONSIBLE_ID']==$user)
		)
		$res[]=$task;
	}
	return $res;
}




function renderNewTaskLink($user,$deadline)
{
	global $auditors_ids; //наблюдатели для всех задач
	global $group_id;
	$newTaskUrl="/company/personal/user/$user/tasks/task/edit/0/".
		"?DEADLINE=$deadline" .
		"&AUDITORS_IDS=$auditors_ids" .
		"&GROUP_ID=$group_id";
	return
		"<li class='createTask' onclick='window.open(\"$newTaskUrl\",\"_blank\")'>".
		"<span class='newTask' >Создать задачу</span>".
		"</li>";
}



