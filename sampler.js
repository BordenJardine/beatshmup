var Sampler = function(options) {
	var audioContext = options.audioContext;
	var instruments = options.instruments;
	var steps = options.steps;

	var stepMatrix = [];

	this.getStepMatrix = function() { return stepMatrix };


	this.playSoundsAt = function(step, time) {
		var instrumentsToPlay = stepMatrix[step].instruments
		
		for(var i = instrumentsToPlay.length - 1; i >= 0; i--) {
			var source = audioContext.createBufferSource();
			source.buffer = instrumentsToPlay[i].buffer;
			source.connect(audioContext.destination);
			source.start(time);
		}
	};


	this.fireStepEvents = function(step) {
		var instrumentsToPlay = stepMatrix[step].instruments
		
		for(var i = instrumentsToPlay.length - 1; i >= 0; i--) {
			var event = new CustomEvent('drumFire', {
				detail: {name: instrumentsToPlay[i].name},
				bubbles: false,
				cancelable: true
			});

			document.dispatchEvent(event);
		}
	};


	this.toggleSoundInMatrix = function(step, instrument) {
		var toPlay = stepMatrix[step].instruments;
		
		for(i in toPlay) {
			if(toPlay[i].name == instrument.name) return toPlay.splice(i, 1);
		}
		toPlay.push(instrument);
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
		for(var i = steps; i >= 0; i--) stepMatrix.push({instruments: []});
	};


	initStepMatrix();
	bufferInstruments();
};
