'use strict'

var http = require('http');

var express = require('express');
var serveIndex = require('serve-index');
var socketIO = require('socket.io');

var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

var http_server = http.createServer(app);
//bind socket.io with http_server
var io = socketIO(http_server);

//connection
io.sockets.on('connection', (socket)=>{

	socket.on('message', (room, data)=>{
		socket.to(room).emit('message', room, socket.id, data)//房间内所有人
	});

	socket.on('join', (room)=> {
		socket.join(room);
		var myRoom = io.sockets.adapter.rooms[room];
		//var users = Object.keys(myRoom.sockets).length;
	
	 	socket.emit('joined', room, socket.id);
	 	//socket.to(room).emit('joined', room, socket.id);//除自己之外
		//io.in(room).emit('joined', room, socket.id)//房间内所有人
	 	//socket.broadcast.emit('joined', room, socket.id);//除自己，全部站点
	});

	socket.on('leave', (room)=> {
		var myRoom = io.sockets.adapter.rooms[room];
		//var users = Object.keys(myRoom.sockets).length;
		//users - 1;

		socket.leave(room);
	 	socket.emit('leaved', room, socket.id);
	 	//socket.to(room).emit('joined', room, socket.id);//除自己之外
		//io.in(room).emit('joined', room, socket.id)//房间内所有人
	 	//socket.broadcast.emit('joined', room, socket.id);//除自己，全部站点
	});
});

http_server.listen(80,'0.0.0.0');
