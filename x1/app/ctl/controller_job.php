<?php
/*
 * Класс инициации исходящих звонков в астериске
 */

class controller_job {
	const MSG_OK='OK';
	const MSG_NO_FROM='NO_FROM_SET';
	const MSG_NO_TO='NO_TO_SET';
	const MSG_NO_USERS='NO_USER_LIST_SET';
	const MSG_NO_JOB_ID='NO_JOB_ID_SET';

	static public function deleteJob($id) {
		return CIBlockElement::Delete($id);
	}

	static public function updateJob($id,$data) {
		global $USER;
		if (!isset($data['MODIFIED_BY']))
			$data['MODIFIED_BY']=$USER->GetID();

		$el = new CIBlockElement;

		return $el->Update($id, $data);
	}

	static public function createJob($data) {
		global $USER;
		if (!isset($data['CREATED_BY']))
			$data['CREATED_BY']=$USER->GetID();

		$el = new CIBlockElement;

		return $el->Add($data);
	}

	/**
	 * загружает работы переданных пользователей за указанный период
	 */
	static public function loadPeriodUsers($from,$to,$users){
		//смещаем на часовой пояс
		if ($to) $to-=3600*3;
		$from-=3600*3;
		//error_log('loadPeriodUsers:'.ConvertTimeStamp($from, "FULL"));
		//error_log('loadPeriodUsers:'.ConvertTimeStamp($to, "FULL"));

		$closed=[
			'<DATE_ACTIVE_TO' => ConvertTimeStamp($to, "FULL"),
			'>=DATE_ACTIVE_TO' => ConvertTimeStamp($from, "FULL")
		];

		if ($from>time())
			$open=[
				'DATE_ACTIVE_TO' => false,
				'<DATE_ACTIVE_FROM' => ConvertTimeStamp($to, "FULL"),
				'>=DATE_ACTIVE_FROM' => ConvertTimeStamp($from, "FULL"),
			];
		else
			$open=[
				'DATE_ACTIVE_TO' => false,
				'<DATE_ACTIVE_FROM' => ConvertTimeStamp($to, "FULL"),
			];



		if ($to && $to<=time())
			$filter=$closed;
		elseif ($from>time()) {
			if (!$to) {
				unset($open['<DATE_ACTIVE_FROM']);
				$filter=[['LOGIC' => 'OR',$open,['DATE_ACTIVE_TO' => false,'DATE_ACTIVE_FROM' => false]]];
			}else {
				$filter=$open;

			}

		} else
			$filter=[['LOGIC' => 'OR',$open,$closed]];

		$filter['IBLOCK_ID'] = 90;
		$filter['PROPERTY_USER'] = $users;

		//var_dump($filter);
		$search = CIBlockElement::GetList(
			[],
			$filter,
			false,
			false,
			['*','PROPERTY_USER']
		);

		$jobs=[];

		while ($item = $search->GetNextElement()) {
			//$item->fields['PROPERTY_USER']=$user;
			$jobs[]=$item->fields;
		}

		return $jobs;
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

	function action_delete() {
		if (is_null($id=router::getRoute(3, 'id')))
			router::haltJson(static::MSG_NO_JOB_ID);

		if (!static::deleteJob($id)) router::haltJson('error updating data');

		echo '{"result":"ok"}';
	}

	function action_update() {
		if (is_null($id=router::getRoute(3, 'id')))
			router::haltJson(static::MSG_NO_JOB_ID);

		$data=[];
		if ($text=router::getRoute(null,'text')) {
			$data['PREVIEW_TEXT_TYPE']='text';
			$data['DETAIL_TEXT_TYPE']='text';
			$data["PREVIEW_TEXT"] = $text;
			$data["DETAIL_TEXT"] = '';
			$data["NAME"] = $text;

		}
		$start=router::getRoute(null,'jobStart');
		$end=router::getRoute(null,'jobEnd');
		if ($start||$end) {
			$data['DATE_ACTIVE_FROM']=$start?ConvertTimeStamp($start,'FULL'):'';
			$data['DATE_ACTIVE_TO']=$end?ConvertTimeStamp($end,'FULL'):'';
		}

		if ($user=router::getRoute(null,'userId')) {
			$data['PROPERTY_VALUES']=['USER'=>$user];
		}

		if ($sort=router::getRoute(null,'sorting')) {
			$data['SORT']=$sort;
		}

		if (!count($data)) router::haltJson('no data to commit');

		if (!static::updateJob($id,$data)) router::haltJson('error updating data',500,$data);

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

	public function action_event(){
		$body = file_get_contents('php://input');
		error_log(print_r($body,true));
	}
	
}

?>