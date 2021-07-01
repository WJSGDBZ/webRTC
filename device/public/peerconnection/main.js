'use strict'

var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

var btnStart = document.getElementById("start");
var btnCall = document.getElementById("call");
var btnHangup = document.getElementById("hangup");

var offer = document.getElementById("offer");
var answer = document.getElementById("answer");

var localStream;
var pc1;
var pc2;

function getMediaStream(stream){
	localVideo.srcObject = stream;
	localStream = stream;
}

function handleError(err){
	console.log("failed to get media stream",err);
}

function getAnswer(desc){
	pc2.setLocalDescription(desc);
	answer.value = desc.sdp;
	pc1.setRemoteDescription(desc);


}	
function handleAnswerError(err){
	console.error("fail to create answer",err);
}

function handleOfferError(err){
	console.error("fail to create offer",err);
}

function getOffer(desc){
	pc1.setLocalDescription(desc);
	offer.value = desc.sdp

	pc2.setRemoteDescription(desc);

	pc2.createAnswer()
		.then(getAnswer)
		.catch(handleAnswerError);

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

		btnStart.disabled = true;
		btnCall.disabled = false;
		btnHangup.disabled = true;
	}
}

function getRemoteStream(e){
	remoteVideo.srcObject = e.streams[0];
}

function call(){
	pc1 = new RTCPeerConnection();
	pc2 = new RTCPeerConnection();

	pc1.onicecandidate = (e)=>{
		pc2.addIceCandidate(e.candidate);
	}
	
	pc2.onicecandidate = (e)=>{
                pc1.addIceCandidate(e.candidate);
        }

	pc2.ontrack = getRemoteStream;

	localStream.getTracks().forEach((track)=>{
		pc1.addTrack(track,localStream);
	});
	var Offer0ptions = {
		offerToReceiveAudio:1,
		offerToReceiveVideo:1
	};
	pc1.createOffer(Offer0ptions)
		.then(getOffer)
		.catch(handleOfferError);

	btnCall.disabled = true;
	btnHangup.disabled = false;

}

function hangup(){
	pc1.close();
	pc2.close();
	pc1 = null;
	pc2 = null;
	
	btnCall.disabled = false;
	btnHangup.disabled = true;
	offer.value = "";
	answer.value = "";
}

btnStart.onclick = start;
btnCall.onclick = call;
btnHangup.onclick = hangup;


