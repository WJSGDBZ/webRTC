'use strict'

if(!navigator.mediaDevices || 
	!navigator.mediaDevices.getUserMedia){
	console.log('getUserMedia is not support!');
}else{
	var constrants = {
		video : true,
		audio : true
	}
	navigator.mediaDevices.getUserMedia(constrants)
				.then(getMediaStream)
				.then(getDevice)
				.catch(handleError);
}

var videoplay = document.getElementById("player");
var audioSource = document.getElementById("audioSource");
var audioOutput = document.getElementById("audioOutput");
var videoSource = document.getElementById("videoSource");

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
