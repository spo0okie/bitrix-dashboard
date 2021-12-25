<?php
/*
 * Класс инициации исходящих звонков в астериске
 */

class controller_task {
	const MSG_OK='OK';
	const MSG_NO_FROM='NO_FROM_SET';
	const MSG_NO_TO='NO_TO_SET';
	const MSG_NO_USERS='NO_USER_LIST_SET';
	const MSG_NO_TASK_ID='NO_TASK_ID_SET';


	/**
	 * загружает работы переданных пользователей за указанный период
	 */
	static public function loadPeriodUsers($from,$to,$users){
		//смещаем на часовой пояс
		if ($to) $to-=3600*3;
		$from-=3600*3;
		//error_log('loadPeriodUsers:'.ConvertTimeStamp($from, "FULL"));
		//error_log('loadPeriodUsers:'.ConvertTimeStamp($to, "FULL"));

		$tasks=[];

		if (is_null($to)) {
			//открытый конец периода (ведро/долгий ящик с задачами "далеко и без срока")
			$closedTasks=[
				'STATUS'=>[5],
				'>=CLOSED_DATE' => ConvertTimeStamp($from, "FULL"),
			];

			$openTasks=[
				'!STATUS'=>[5,7],
				'::SUBFILTER-1' => [
					'::LOGIC' => 'OR',
					'>=DEADLINE' => ConvertTimeStamp($from, "FULL"),
					'DEADLINE'=>'',
				],

			];
		}else {
			$closedTasks=[
				'STATUS'=>[5],
				'>=CLOSED_DATE' => ConvertTimeStamp($from, "FULL"),
				'<CLOSED_DATE' => ConvertTimeStamp($to, "FULL"),
			];

			$openTasks=[
				'!STATUS'=>[5,7],
				'<DEADLINE' => ConvertTimeStamp($to, "FULL"),
				'>=DEADLINE' => ConvertTimeStamp($from, "FULL"),
			];

			//если период начинается сейчас или даже раньше, то добавляем все просроченные задачи убирая фильтр "ОТ"
			if ($from<=time())
				unset($openTasks['>=DEADLINE']);
		}


		$filter=[
			'::LOGIC' => 'AND',
			'CHECK_PERMISSIONS' => 'Y',
			'::SUBFILTER-1' => [
				'::LOGIC' => 'OR',
				'ACCOMPLICE' => $users,
				'RESPONSIBLE_ID' => $users
			],
		];

		if (!is_null($to) && $to<time()) {
			//отметка ДО раньше текущего времени - это прошлый период. Открытых задач там нет
			//(они есть но все просроченные выводим в текущее время, а не в прошлое)
			$filter['::SUBFILTER-2']=$closedTasks;
		} else {
			$filter['::SUBFILTER-2']=[
				'::LOGIC' => 'OR',
				'::SUBFILTER-1' =>$openTasks,
				'::SUBFILTER-2' =>$closedTasks,
			];
		}
		//var_dump($filter);

		$res=CTasks::GetList(["DEADLINE" => "ASC"],$filter);
		while ($arTask = $res->GetNext()) {
			$arViewedDates[$arTask['ID']] = $arTask['VIEWED_DATE'] ? $arTask['VIEWED_DATE'] : $arTask['CREATED_DATE'];

			//перебираем соисполнителей задачи
			$rsMembers = CTaskMembers::GetList(array(), array("TASK_ID" => $arTask['ID']));
			while ($arMember = $rsMembers->Fetch())
				if (
					($arMember["TYPE"] == "A" ) //упер из метода GetByID. Тот который GetList по умолчанию не вытягивает соисполнителей
					&&
					($arTask['RESPONSIBLE_ID']!=$arMember["USER_ID"]) //на всякий случай проверяем, что у нас соисполнитель не является ответственным
				) {
					$arTask["ACCOMPLICES"][] = $arMember["USER_ID"];
					//$tasks[$arMember["USER_ID"]][]=$arTask;
				}

			//кладем задачу пользователю в табличку
			$tasks[$arTask['ID']]=$arTask;
		}

		$arUpdatesCount = CTasks::GetUpdatesCount($arViewedDates);
		foreach ($arUpdatesCount as $i => $count)
			$tasks[$i]['UPDATES_COUNT']=(integer)$count;

		return array_values($tasks);
	}

	public function action_load(){
		if (is_null($from=router::getRoute(3, 'from')))
			router::haltJson(static::MSG_NO_FROM);

		if (is_null($to=router::getRoute(4, 'to')))
			router::haltJson(static::MSG_NO_TO);
		if ($to=='null') $to=null; //открытый конец

		if (is_null($users= router::getRoute(5, 'users')))
			router::haltJson(static::MSG_NO_USERS);

		echo json_encode(static::loadPeriodUsers($from, $to,explode(',',$users)),JSON_UNESCAPED_UNICODE);
	}

	public function action_get(){
		if (is_null($id=router::getRoute(3, 'id')))
			router::haltJson(static::MSG_NO_TASK_ID);

		$rsTask = CTasks::GetByID($id);
		if ($arTask = $rsTask->GetNext())
		{
			echo json_encode([$arTask],JSON_UNESCAPED_UNICODE);
		} else {
			router::haltJson("Error loading Task");
		}

	}

	function action_update() {
		if (is_null($id=router::getRoute(3, 'id')))
			router::haltJson(static::MSG_NO_TASK_ID);

		$userID=CUser::GetID();

		$oTaskItem=new CTaskItem($id,$userID);
		$arTask=$oTaskItem->GetData();


		if ($responsible=router::getRoute(null,'responsible')) {
			$oTaskItem->Update(['RESPONSIBLE_ID'=>$responsible]);
			if (in_array($responsible,$arTask['ACCOMPLICES'])) {
				$accomplices=$arTask['ACCOMPLICES'];
				unset($accomplices[array_search($responsible,$accomplices)]);
				$accomplices[]=$arTask['RESPONSIBLE_ID'];
				$oTaskItem->Update(['ACCOMPLICES'=>$accomplices]);
			}
		}

		if ($deadline=router::getRoute(null,'deadline')) {
			if ($deadline=='null') {
				$deadline='';
			} else {
				$deadline=date('d.m.Y',$deadline).' 17:00:00';
			}
			echo $deadline;
			$oTaskItem->Update(['DEADLINE'=>$deadline]);
		}

		if ($status=router::getRoute(null,'status')) {
			$oTaskItem->Update(['STATUS'=>$status]);
		}

		if ($sorting=router::getRoute(null,'sorting')) {
			$oTaskItem->Update(['XML_ID' => $sorting]);
		}

		echo '{"result":"ok"}';
	}

	function action_create() {

		if (!($text=router::getRoute(null,'text'))) router::haltJson('no text data');
		if (!($user=router::getRoute(null,'userId'))) router::haltJson('no userId');
		$start=router::getRoute(null,'jobStart');
		$end=router::getRoute(null,'jobEnd');
		if (!$start && !$end) router::haltJson('no date');

		$data=[
			'IBLOCK_ID' => 90,
			'PREVIEW_TEXT_TYPE'=>'text',
			'DETAIL_TEXT_TYPE'=>'text',
			'PROPERTY_VALUES'=> ['USER'=>$user],
		];

		$data["PREVIEW_TEXT"] = $text;
		$data["NAME"] = $text;

		if ($start) $data['DATE_ACTIVE_FROM']=ConvertTimeStamp($start,'FULL');
		if ($end) $data['DATE_ACTIVE_TO']=ConvertTimeStamp($end,'FULL');

		if ($sort=router::getRoute(null,'sorting')) {
			$data['SORT']=$sort;
		}


		if (!$id=static::createJob($data)) router::haltJson('error creating data',500,$data);

		echo '{"result":"ok","id":"'.$id.'"}';
	}

}

?>