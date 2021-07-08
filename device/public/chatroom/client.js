'use strict'

var username = document.getElementById("username");
var inRoom = document.getElementById("room");
var btnConnect = document.getElementById("connect");
var outContent = document.getElementById("chat");
var input = document.getElementById("input");
var btnSend = document.getElementById("send");
var btnLeave = document.getElementById('leave');

var socket;
var room;
btnConnect.onclick = ()=>{
	//connect
	socket = io.connect();

	//recv message
	socket.on('joined',(room,id)=>{
		btnConnect.disabled = true;
		input.disabled = false;
		btnLeave.disabled = false;		
	});

        socket.on('leaved',(room,id)=>{
                btnConnect.disabled = false;
                input.disabled = true;
		btnLeave.disabled = true;
		btnSend.disabked = true;
		socket.disconnect();
        });

        socket.on('message',(room,data)=>{
		outContent.scrollTop = outContent.scrollHeight;
                outContent.value = outContent.value + data + '\r';

        });

	socket.on("disconnect",(socket)=>{
		input.disabled = true;
		btnLeave.disabled = true;
	});


	//send
	room = inRoom.value;
	console.log(room);
        socket.emit('join',room);

}

btnSend.onclick = ()=>{
	var data = input.value;
	data = username.value + ":" + data;
	outContent.scrollTop = outContent.scrollHeight;
        outContent.value = outContent.value + data + '\r';
	socket.emit('message',room,data);
	input.value = "";
}

btnLeave.onclick = ()=>{
	room = inRoom.value;
	socket.emit('leave',room);
}

input.onkeypress = (event)=> {
    //event = event || window.event;
    if (event.keyCode == 13) { //回车发送消息
	var data = input.value;
	data = username.value + ':' + data;
	socket.emit('message', room, data);
        outContent.scrollTop = outContent.scrollHeight;
        outContent.value = outContent.value + data + '\r';
	input.value = '';
	event.preventDefault();//阻止默认行为
    }
}

