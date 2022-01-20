<?php

/*
 * Класс маршрутизатора. Парсит входящие параметры (URL или $_GET) и вызывает соответствующий контроллер
 */
class router
{

	private static $input=null;
	private static $inputJson=null;

	/**
	 * Смещение индексов параметров (дополнительные директории в пути)
	*/
	private static $num_shift=3;

	/*
	 * здесь будет храниться массив токенов маршрута
	 */
	private static $route=null;
	/*
	 * Корневая папка приложения
	 */
	static public $app_folder='app';
	
	/*
	 * Папка для контроллеров
	 */
	static public $ctl_folder='ctl';
	
	/*
	 * Папка для моделей
	 */
	static public $mod_folder='models';
	
	/*
	 * Возвращает имя файла модели
	 */
	static public function loadModel($model_name)
	{
		$model_file = strtolower($model_name).'.php';
		$model_path = router::$app_folder."/".router::$mod_folder."/".$model_file;
		if(file_exists($model_path)) {
			include $model_path;
			return true;
		} else return false;
	}

	static public function loadController($controller_name)
	{
		$controller_file = strtolower($controller_name).'.php';
		$controller_path = router::$app_folder."/".router::$ctl_folder."/".$controller_file;
		if(file_exists($controller_path)) {
			include $controller_path;
			return true;
		} else return false; 
	}
	
	/*
	 * возвращает элемент пути, или по номеру подпапки в URL или по имени переменной в $_GET
	 */
	static public function getRoute($num,$var,$def=NULL)
	{
		if (!is_array(router::$route)) {
		    $noArgs=explode('?', $_SERVER['REQUEST_URI'])[0];
            router::$route=explode('/', $noArgs);
        }

		if ( !empty($_GET[$var]) )
			return $_GET[$var];

		if ( !empty($_POST[$var]) )
			return $_POST[$var];

		if (!is_null($num) && !empty(router::$route[$num+static::$num_shift]) )
			return urldecode(router::$route[$num+static::$num_shift]);

		return $def;
	}
	
	static public function init()
	{
		header('Content-Type: text/html; charset=utf-8');
		// получаем имя контроллера
		$controller_name = router::getRoute(1,'ctl','main');
		$action_name = router::getRoute(2,'req','help');

		// добавляем префиксы
		$model_name = 'model_'.$controller_name;
		$controller_name = 'controller_'.$controller_name;
		$action_name = 'action_'.$action_name;

		// подцепляем файл с классом модели (файла модели может и не быть)
		router::loadModel($model_name);

		// подцепляем файл с классом контроллера
		if (!router::loadController($controller_name))
			router::errorNoClass($controller_name);
		
		// создаем контроллер
		$controller = new $controller_name;
		if(method_exists($controller, $action_name))
			$controller->$action_name();
		else
			router::errorNoAction($action_name);
	
	}

	function errorNoClass($ctl)
	{
		echo 'UNKNOWN_CTL_CLASS: '.$ctl;
		http_response_code(404);
		exit ();
	}
	function errorNoAction($act)
	{
		echo 'UNKNOWN_METHOD '.$act;
		http_response_code(404);
		exit ();
	}

	static function haltJson($text,$code=500,$info=null) {

		$output=[
			'result'=>'error',
			'error'=>$text
		];
		if ($info) $output['info']=$info;
		echo json_encode($output);
		http_response_code($code);
		exit();
	}

	static function  inputData()
	{
		return is_null(static::$input)?
			(static::$input=file_get_contents('php://input'))
			:static::$input;
	}

	static function inputJson()
	{
		return is_null(static::$inputJson)?
			(static::$inputJson=json_decode(static::inputData())):
			static::$inputJson;
	}

}

