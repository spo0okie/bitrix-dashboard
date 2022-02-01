<?php
/*
 * Класс инициации исходящих звонков в астериске
 */

class controller_ticket {
	const MSG_OK='OK';
	const MSG_NO_FROM='NO_FROM_SET';
	const MSG_NO_TO='NO_TO_SET';
	const MSG_NO_USERS='NO_USER_LIST_SET';
	const MSG_NO_JOB_ID='NO_JOB_ID_SET';

	/**
	 * загружает работы переданных пользователей за указанный период
	 */
	static public function loadPeriodUsers($from,$to,$users){
		//смещаем на часовой пояс
		$to-=3600*3;
		$from-=3600*3;

		//https://dev.1c-bitrix.ru/api_help/support/classes/cticket/getlist.php
		$closed=[
			//"CLOSE" => 'Y',
			//"DATE_CLOSE_1" => ConvertTimeStamp($from, "FULL"),
			"DATE_CLOSE_1" => date('d.m.Y',$from),
		];
		if ($to)
			$closed['DATE_CLOSE_2'] = date('d.m.Y',$to);
			//$closed['DATE_CLOSE_2'] = ConvertTimeStamp($to, "FULL");
		//TODO: закрытые ищем неправильно, если тикет закрыт, то датой считается - дата последнего сообщения


		$open=["CLOSE" => 'N'];

		$delayed=["HOLD_IN" => 'Y'];

		if ($from<=time()) {
			if ($to==0) {
				$filters=[
					$closed,
					$open,
					$delayed
				];
			} elseif ($to>=time()) {
				$filters=[
					$closed,
					$open,
				];

			} else {
				$filters=[
					$closed
				];
			}
		} elseif(!$to) {
			$filters=[
				$closed,
			];
		} else return [];


		$by = "s_id";                   // обязательно используем переменные,
		$order = "asc";                 // т.к. константы в параметрах работать не будут

		$tickets=[];
		foreach ($users as $user) {
			foreach ($filters as $filter) {
				$filter["RESPONSIBLE_ID"] = $user;
				//var_dump($filter);
				$rs = CTicket::GetList($by, $order, $filter);

				while ($ticket = $rs->GetNext())
					$tickets[] = $ticket;
			}
		}
		return $tickets;

	}
	
	public function action_load(){
		if (is_null($from=router::getRoute(3, 'from')))
			router::haltJson(static::MSG_NO_FROM);

		if (is_null($to=router::getRoute(4, 'to')))
			router::haltJson(static::MSG_NO_TO);

		if (is_null($users= router::getRoute(5, 'users')))
			router::haltJson(static::MSG_NO_USERS);

		echo json_encode(static::loadPeriodUsers($from, $to,explode(',',$users)),JSON_UNESCAPED_UNICODE);
	}

	public function action_get(){
		if (is_null($id=router::getRoute(3, 'id')))
			router::haltJson(static::MSG_NO_TASK_ID);

		$rsTask = CTicket::GetByID($id);
		if ($arTask = $rsTask->GetNext())
		{
			echo json_encode([$arTask],JSON_UNESCAPED_UNICODE);
		} else {
			router::haltJson("Error loading Ticket");
		}

	}

}

?>