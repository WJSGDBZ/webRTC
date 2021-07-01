'use strict'

var videoplay = document.getElementById("player");
var audioSource = document.getElementById("audioSource");
var audioOutput = document.getElementById("audioOutput");
var videoSource = document.getElementById("videoSource");

start();
videoSource.onchange = start;

function start(){

if(!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia){
        console.log('getUserMedia is not support!');
}else{
	var deviceId = videoSource.value;
        var constrants = {
                video : {
                        width: {
				min:240,
				max:640,
			},
                        height:{
				min:180,
				max:480
			},
                        frameRate: {
				min:15,
				max:30
			},
			deviceId: deviceId? deviceId:undefined
                },
                audio : {
                        noiseSuppression:true,
                        echoChncellation:true
                }
        }
        navigator.mediaDevices.getUserMedia(constrants)
                                .then(getMediaStream)
                                .then(getDevice)
                                .catch(handleError);
}

}

function getMediaStream(stream){
	videoplay.srcObject = stream;
	return navigator.mediaDevices.enumerateDevices();
}
function getDevice(deviceInfos){
        deviceInfos.forEach(function(deviceInfo){
                console.log(deviceInfo.kind + "\nlabel = "
                                + deviceInfo.label + "\nid = "
                                + deviceInfo.deviceId + "\ngroupId = "
                                + deviceInfo.groupId);
                var option = document.createElement('option');
                option.text = deviceInfo.label;
                option.value = deviceInfo.deviceId;
                if(deviceInfo.kind === 'audioinput'){
                        audioSource.appendChild(option);
                }else if(deviceInfo.kind === 'audiooutput'){
                        audioOutput.appendChild(option);
                }else if(deviceInfo.kind === 'videoinput'){
                        videoSource.appendChild(option);
                }
        });
}

function handleError(err){
	console.log('getUserMedia error:',err);
}
