'use strict'
//video
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

//chat 
var username = document.getElementById("username");
var inRoom = document.getElementById("room");
var outContent = document.getElementById("chat");
var input = document.getElementById("input");

//button
var btnSend = document.getElementById("send");
var btnStart = document.getElementById("start");
var btnHangup = document.getElementById("hangup");

//select
var selbw = document.getElementById("bandwidth");

//Stats
var bitrateGraph;
var bitrateSeries;

var packetGraph;
var packetSeries;

//SDP
var offer = document.getElementById("offer");
var answer = document.getElementById("answer");

//param
var roomId;
var lastResult;
var state = 'init';

//need to close
var localStream = null;
var pc = null;
var dc = null;
var socket = null;

function call(){
	if(state === 'joined_conn'){
		if(pc){
			var options = {
				//接收远端视频和音频
				offerToReceiveAudio: 1,
				offerToReceiveVideo: 1,
			};
			pc.createOffer(options)
				.then(getOffer)
				.catch(handleOfferError);
		}		
	}
}

function dataChannelStateChange(e){
	var state = dc.readyState;
	if(state === 'open'){
		input.disabled = false;
                btnSend.disabled = false;		
	}else{
                input.disabled = true;
                btnSend.disabled = true;
	}
}

function recvmsg(e){
	//console.log('recv msg',e);
	var msg = e.data;
	if(msg){
		outContent.scrollTop = outContent.scrollHeight;
                outContent.value = outContent.value + msg + '\r';	
	}else{
		console.error('recv msg is null');
	}
}

function conn(){
	socket = io.connect();//连接信令服务器
	
	socket.on('joined',(room,id)=>{
		console.log("state change:",state,'to','joined');
		state = 'joined';

		createPeerConn();

                btnStart.disabled = true;
                btnHangup.disabled = false;
	});

	socket.on('otherjoin',(room,id)=>{
		console.log("state change:",state,'to','joined_conn');
		if(state == 'joined_unbind'){
			createPeerConn();
		}
		
		dc = pc.createDataChannel('chat');
		dc.onmessage = recvmsg;
		dc.onopen = dataChannelStateChange;
		dc.onclose = dataChannelStateChange;

		state = 'joined_conn';
		//媒体协商
		call();	
	});

	socket.on('full',(room,id)=>{
		console.log("state change:",state,'to','leaved');
		state = 'leaved';
		socket.disconnect();
		alert("room full");

                btnStart.disabled = false;
                btnHangup.disabled = true;
        });

        socket.on('leaved',(room,id)=>{
                console.log("state change:",state,'to','leaved');
                state = 'leaved';
                socket.disconnect();

		btnStart.disabled = false;
		btnHangup.disabled = true;
        });

        socket.on('bye',(room,id)=>{
		console.log("state change:",state,'to','joined_unbind');
		state = 'joined_unbind';
		closePeerConn();

        });

	socket.on('message',(room,data)=>{
		if(data){
			if(data.hasOwnProperty('type') && data.type === 'offer'){
				offer.value = data.sdp;
				//发过来时已经是文本了，不是对象了
				pc.setRemoteDescription(new RTCSessionDescription(data));
				pc.createAnswer()
					.then(getAnswer)
					.catch(handleAnswerError);
			}else if(data.hasOwnProperty('type') && data.type === 'answer'){
				answer.value = data.sdp;
				pc.setRemoteDescription(new RTCSessionDescription(data));
				selbw.disabled = false;
			}else if(data.hasOwnProperty('type') && data.type === 'candidate'){
				var candidate = new RTCIceCandidate({
					sdpMLineIndex:data.label,
					candidate: data.candidate
				});

				pc.addIceCandidate(candidate);
			}else{
				console.error('the messgae is invaild',data);
			}
		}
	});

        //socket.on('chat',(room,data)=>{
        //        outContent.scrollTop = outContent.scrollHeight;
        //        outContent.value = outContent.value + data + '\r';

        //});

	roomId = inRoom.value;
	console.log('join room: ',roomId);
	socket.emit('join',roomId);


}

function getMediaStream(stream){
	localVideo.srcObject = stream;
	localStream = stream;
	
	conn();

	bitrateSeries = new TimelineDataSeries();
	bitrateGraph = new TimelineGraphView('bitrateGraph', 'bitrateCanvas');
	bitrateGraph.updateEndDate();

	packetSeries = new TimelineDataSeries();
	packetGraph = new TimelineGraphView('packetGraph', 'packetCanvas');
	packetGraph.updateEndDate();
}

function handleError(err){
	console.log("failed to get media stream",err);
}

function getAnswer(desc){
	pc.setLocalDescription(desc);
	answer.value = desc.sdp;

	selbw.disabled = false;
	sendMessage(roomId,desc);
}	
function handleAnswerError(err){
	console.error("fail to create answer",err);
}

function handleOfferError(err){
	console.error("fail to create offer",err);
}

function sendMessage(roomId,data){
	
	console.log('send p2p message',roomId,data);
	if(socket){
		socket.emit('message',roomId,data);
	}
}

function getOffer(desc){
	pc.setLocalDescription(desc);//去收集candidate
	offer.value = desc.sdp

	sendMessage(roomId,desc);
}

function start(){

	if(!navigator.mediaDevices || 
		!navigator.mediaDevices.getUserMedia){
		console.log("not support");
		return ;
	}else{
		var constraints = {
			video:true,
			audio:true
		};
		navigator.mediaDevices.getUserMedia(constraints)
					.then(getMediaStream)
					.catch(handleError);
	}
}

function getRemoteStream(e){
	remoteVideo.srcObject = e.streams[0];
}

function closeLocalMedia(){
	if(localStream){
		console.log('close LocalStream');
		if(localStream.getTracks()){
                	localStream.getTracks().forEach((track)=>{
	                        track.stop();
        	        });
		}
	}

	localStream = null;
}

function leave(){
	if(socket){
		socket.emit('leave',roomId);
	}

        closePeerConn();
       	closeLocalMedia();

	btnStart.disabled = false;
	btnHangup.disabled = true;
	outContent.value = "";
}

function connSignalServer(){
	//开启本地视频
	start();
}

function closePeerConn(){
	if(pc){
		console.log("close peer conn");
		pc.close();
		pc = null;
	}
	
}

function createPeerConn(){
	if(!pc){
		console.log('create peer conn');
		var pcConfig = {
			'iceServers':[{
				'urls':'turn:116.62.104.83:3478',
				'credential':'123',
				'username':'jun'
			},{
				'url':'stun:stun.l.google.com:19302'
			}],
			
		};
		pc = new RTCPeerConnection(pcConfig);

		pc.onicecandidate = (e)=>{
			if(e.candidate){
				console.log('find candidate',e.candidate);
				sendMessage(roomId,{
					type:'candidate',
					label:e.candidate.sdpMLineIndex,
					id:e.candidate.sdpMid,
					candidate:e.candidate.candidate
				});		
			}
		}

		pc.ondatachannel = (e)=>{
			if(!dc){
				dc = e.channel;
				dc.onmessage = recvmsg;
				dc.onopen = dataChannelStateChange;
				dc.onclose = dataChannelStateChange;
			}
		}

		pc.ontrack = getRemoteStream;
	}

	if(localStream){
		localStream.getTracks().forEach((track)=>{
			pc.addTrack(track,localStream);	
		});
	}
}


function changeBw(){
	selbw.diabled = true;
	var bw = selbw.options[selbw.selectedIndex].value;
	var vsender = null;
	var senders = pc.getSenders();//获取发送器
	
	senders.forEach((sender)=>{
		if(sender && sender.track.kind == 'video'){
			vsender = sender;
		}
	});

	var param = vsender.getParameters();
	if(!param.encodings){
		return ;
	}
	

	param.encodings[0].maxBitrate = (bw==='unlimited')?'unlimited':bw * 1024;
	vsender.setParameters(param)
		.then(()=>{
			selbw.disabled = false;
			console.log("successed to set param");
		})
		.catch((err)=>{
			console.error("failed to set param",err);
		});

}

window.setInterval(()=>{
	if(!pc){
		return ;
	}
        var vsender = null;
        var senders = pc.getSenders();//获取发送器

        senders.forEach((sender)=>{
                if(sender && sender.track.kind == 'video'){
                        vsender = sender;
                }
        });
	if(!vsender){
		return ;
	}

	vsender.getStats().then(res => {
    	res.forEach(report => {
      	let bytes;
      	let packets;
      	if (report.type === 'outbound-rtp') {
        	if (report.isRemote) {
          	return;
        	}
        	const now = report.timestamp;
        	bytes = report.bytesSent;
        	packets = report.packetsSent;
        	if (lastResult && lastResult.has(report.id)) {
          	// calculate bitrate
          	const bitrate = 8 * (bytes - lastResult.get(report.id).bytesSent) /
            	(now - lastResult.get(report.id).timestamp);

          	// append to chart
		console.log(bitrateSeries);
          	bitrateSeries.addPoint(now, bitrate);
          	bitrateGraph.setDataSeries([bitrateSeries]);
          	bitrateGraph.updateEndDate();

          	// calculate number of packets and append to chart
          	packetSeries.addPoint(now, packets -
            	lastResult.get(report.id).packetsSent);
          	packetGraph.setDataSeries([packetSeries]);
          	packetGraph.updateEndDate();
        	}
      	}
    	});
    	lastResult = res;
  	});
}, 1000);

btnSend.onclick = ()=>{
        var data = input.value;
        data = username.value + ":" + data;
        outContent.scrollTop = outContent.scrollHeight;
        outContent.value = outContent.value + data + '\r';
        //socket.emit('chat',roomId,data);
	dc.send(data);
        input.value = "";
}

input.onkeypress = (event)=> {
    //event = event || window.event;
    if (event.keyCode == 13) { //回车发送消息
        var data = input.value;
        data = username.value + ':' + data;
        //socket.emit('chat', roomId, data);
	dc.send(data);
        outContent.scrollTop = outContent.scrollHeight;
        outContent.value = outContent.value + data + '\r';
        input.value = '';
        event.preventDefault();//阻止默认行为
    }
}
btnStart.onclick = connSignalServer;
btnHangup.onclick = leave;
selbw.onchange = changeBw;

