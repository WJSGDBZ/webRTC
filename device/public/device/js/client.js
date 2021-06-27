'use strict'

//navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var audioSource = document.getElementById("audioSource");
var audioOutput = document.getElementById("audioOutput");
var videoSource = document.getElementById("videoSource");



navigator.getUserMedia({audio:true,video:true},function(strem){},function(err){});
if(!navigator.mediaDevices ||
	!navigator.mediaDevices.enumerateDevices){
	console.log("not support!");
}else{
	navigator.mediaDevices.enumerateDevices()
		.then(getDevice)
		.catch(handleError);
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
	console.log(err.name + ":" + err.message);
} 
