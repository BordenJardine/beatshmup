var stepMatrix = [];

var initStepMatrix = function(steps) {
	for(steps >= 0; steps--;) stepMatrix.push({sounds: []});
	return stepMatrix;
};


var toggleSoundInMatrix = function(step, sound) {
	toPlay = stepMatrix[step].sounds;
	
	for(i in toPlay) {
		if(toPlay[i] == sound) return toPlay.splice(i, 1);
	}
	toPlay.push(sound);
};


var playSoundsAt = function(step, time) {
	var soundsToPlay = stepMatrix[step].sounds
	
	for(var i = soundsToPlay.length - 1; i >= 0; i--) {
		var source = audioContext.createBufferSource();
		source.buffer = soundsToPlay[i];
		source.connect(audioContext.destination);
		source.start(time);
	}
};


var bufferInstruments = function(instruments) {
	var setBuffer = function(instrument, path) {
		var bufferSound = function(event) {
			var request = event.target;
			instrument.buffer = audioContext.createBuffer(request.response, false);
		};

		request = new XMLHttpRequest();
		request.open('GET', path, true);
		request.responseType = 'arraybuffer';
		request.addEventListener('load', bufferSound, false);
		request.send();
	};

	//maybe make this not destructive;
	for(var i = instruments.length - 1; i >= 0; i--) {
		var instrument = instruments[i];
		setBuffer(instrument, instrument.path);
	}
};


var selectInstrument = function(name) {
	for(i in instruments) {
		if (instruments[i].name == name) return instruments[i];
	}
	return 'none'
};
