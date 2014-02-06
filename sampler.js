var Sampler = function(options) {
	var audioContext = options.audioContext;
	var instruments = options.instruments;
	var steps = options.steps;

	var stepMatrix = [];

	this.playSoundsAt = function(step, time) {
		var buffersToPlay = stepMatrix[step].buffers
		
		for(var i = buffersToPlay.length - 1; i >= 0; i--) {
			var source = audioContext.createBufferSource();
			source.buffer = buffersToPlay[i];
			source.connect(audioContext.destination);
			source.start(time);
		}
	};


	this.toggleSoundInMatrix = function(step, buffer) {
		var toPlay = stepMatrix[step].buffers;
		
		for(i in toPlay) {
			if(toPlay[i] == buffer) return toPlay.splice(i, 1);
		}
		toPlay.push(buffer);
	};



	var bufferInstruments = function() {
		var setBuffer = function(instrument, path) {
			var bufferSound = function(event) {
				var request = event.target;
				instrument.buffer = audioContext.createBuffer(request.response, false);
			};

			var request = new XMLHttpRequest();
			request.open('GET', path, true);
			request.responseType = 'arraybuffer';
			request.addEventListener('load', bufferSound, false);
			request.send();
		};

		for(var i = instruments.length - 1; i >= 0; i--) {
			var instrument = instruments[i];
			setBuffer(instrument, instrument.path);
		}
	};


	var initStepMatrix = function() {
		for(var i = steps; i >= 0; i--) stepMatrix.push({buffers: []});
	};


	initStepMatrix();
	bufferInstruments();
};
