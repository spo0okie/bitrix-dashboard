<?php

/**
 * рендер ячейки-задачи
 * @param array $ticket Задача
 * @param string $class
 * @param string $style дополнительный стиль отображения элемента
 */
function renderTicket($ticket, $class='', $style='')
{

    $viewUrl = '/bitrix/admin/ticket_edit.php?ID='.$ticket['ID'];

    /*    $priority=[
            0=>'<span class="lowPriority">Низкий</span>',
            1=>'<span class="midPriority">Средний</span>',
            2=>'<span class="hiPriority">Высокий</span>',
        ];*/

    ?>

    <li
        class="ticket-<?= $ticket["ID"]?> task-title-container userTicket <?= $class ?> <?= $ticket['LAMP']?>"
        ticketid="<?= $ticket["ID"]?>"
        userid="<?= $ticket["RESPONSIBLE_USER_ID"] ?>"
        status="<?= $ticket['LAMP']?>"
        statusName="<?= $ticket['STATUS_NAME'] ?>"
        lastMessageId="<?= $ticket['LAST_MESSAGE_USER_ID'] ?>"
        <?= $style ?>
    >
        <a href="<?= $viewUrl ?>" class="task-title-link modal-link"><?= $ticket["ID"] .': '. $ticket["TITLE"]; ?></a>

        <span class="deadline"><?php
            if ($ticket['DATE_CLOSE']) {
	            echo date('d-m-Y',strtotime($ticket['LAST_MESSAGE_DATE']));
            } elseif ($ticket['DEADLINE_SOURCE_DATE']) {
	            echo date('d-m-Y',strtotime($ticket['DEADLINE_SOURCE_DATE']));
            } else echo 'отсутствует';
            ?>
        </span>
    </li>
<?php }

function compareTicketsCloseDate(&$ticket1,&$ticket2)
{
	if ($ticket1['DATE_CLOSE']==$ticket2['DATE_CLOSE']) return 0;
	return ($ticket1['DATE_CLOSE']<$ticket2['DATE_CLOSE'])?-1:1;
}

function getClosedTickets($user,$start,$end)
{
	global $closedTickets;
	$res=[];
	foreach ($closedTickets[(int)$user] as $ticket) {
		if (
			$ticket['DATE_CLOSE']
			&&
			strtotime($ticket['LAST_MESSAGE_DATE'])>=$start
			&&
			strtotime($ticket['LAST_MESSAGE_DATE'])<$end
		)
			$res[]=$ticket;
	}
	usort($res,'compareTicketsCloseDate');
	return $res;
}

function getSemiClosedTickets($user)
{
	global $tickets;
	$res=[];

	foreach ($tickets[(int)$user] as $ticket) {
		if (
			$ticket['HOLD_ON'] == 'N'
			&&
			(
				$ticket['LAST_MESSAGE_USER_ID'] == $user
				&&
				($ticket['STATUS_NAME'] == 'Успешно решено' || $ticket['STATUS_NAME'] == 'Не представляется возможным решить')
			)
		)
			$res[]=$ticket;
	}
	return $res;
}

function getOpenTickets($user)
{
	global $tickets;
	$res=[];

	foreach ($tickets[(int)$user] as $ticket) {
		if (
			$ticket['HOLD_ON'] == 'N'
			&&
			!(
				$ticket['LAST_MESSAGE_USER_ID'] == $user
				&&
				($ticket['STATUS_NAME'] == 'Успешно решено' || $ticket['STATUS_NAME'] == 'Не представляется возможным решить')
			)
		)
			$res[]=$ticket;
	}
	return $res;
}

function getDelayedTickets($user)
{
	global $tickets;
	$res=[];
	foreach ($tickets[(int)$user] as $ticket) {
		if (
			$ticket['HOLD_ON']=='Y'
		)
			$res[]=$ticket;
	}
	return $res;
}

function drawClosedTickets($user,$start,$end,$hidden)
{
	foreach (getClosedTickets($user,$start,$end) as $ticket)
		renderTicket($ticket,'closedTicket',$hidden?'':'style="display:none"');
}

function drawSemiClosedTickets($user,$hidden)
{
    foreach (getSemiClosedTickets($user) as $ticket) 
        renderTicket($ticket, 'semiClosedTicket', $hidden?'':'style="display:none"');
}

function drawOpenTickets($user,$hidden)
{
    foreach (getOpenTickets($user) as $ticket)
		renderTicket($ticket,'',$hidden?'':'style="display:none"');
}

function drawDelayedTickets($user,$hidden)
{
    foreach (getDelayedTickets($user) as $ticket)
        renderTicket($ticket,'',$hidden?'':'style="display:none"');
}