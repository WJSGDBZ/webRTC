'use strict'

var http = require('http');
var log4js = require('log4js');
var express = require('express');
var serveIndex = require('serve-index');
var socketIO = require('socket.io');

var https = require('https');
var fs = require('fs');

log4js.configure({
    appenders: {
        file: {
            type: 'file',
            filename: 'app.log',
            layout: {
                type: 'pattern',
                pattern: '%r %p - %m',
            }
        }
    },
    categories: {
       default: {
          appenders: ['file'],
          level: 'debug'
       }
    }
});

var logger = log4js.getLogger();

var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

//var http_server = http.createServer(app);
//bind socket.io with http_server
//var io = socketIO(http_server);

var options = {
	key : fs.readFileSync('./cert/mylearning.shop.key'),
	cert: fs.readFileSync('./cert/mylearning.shop.pem')
}

//https server
var https_server = https.createServer(options, app);
var io = socketIO(https_server);

var USER_MAX_NUMBER = 2;
//connection
io.sockets.on('connection', (socket)=>{

	socket.on('message', (room, data)=>{
		socket.to(room).emit('message', room, data)//房间内除自己所有人
	});

        socket.on('chat', (room, data)=>{
                socket.to(room).emit('chat', room, data)//房间内除自己所有人
        });

	socket.on('join', (room)=> {
		socket.join(room);
		var myRoom = io.sockets.adapter.rooms.get(room);
		var users = (myRoom)?myRoom.size:0;
		logger.debug('the user number of room is: ' + users);

		if(users <= USER_MAX_NUMBER){
			socket.emit('joined', room, socket.id);	
			if(users > 1){
				socket.to(room).emit('otherjoin',room,socket.id);
			}
		}else{
			socket.leave(room);
			socket.emit('full',room,socket.id);
		}
	 	
	 	//socket.to(room).emit('joined', room, socket.id);//除自己之外
		//io.in(room).emit('joined', room, socket.id)//房间内所有人
	 	//socket.broadcast.emit('joined', room, socket.id);//除自己，全部站点
	});

	socket.on('leave', (room)=> {
		var myRoom = io.sockets.adapter.rooms[room];
		//var users = Object.keys(myRoom.sockets).length;
		//users - 1;

		socket.leave(room);
	 	socket.to(room).emit('bye', room, socket.id);
		socket.emit('leaved',room,socket.id);
	 	//socket.to(room).emit('joined', room, socket.id);//除自己之外
		//io.in(room).emit('joined', room, socket.id)//房间内所有人
	 	//socket.broadcast.emit('joined', room, socket.id);//除自己，全部站点
	});
});

https_server.listen(443,'0.0.0.0');
