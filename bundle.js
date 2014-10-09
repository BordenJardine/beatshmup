(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DrumGrid = function(options) {
	instruments = options.instruments;
	clickCallback = options.clickCallback;
	steps = options.steps;

	this.advanceIndicator = function(lastStep, newStep) {
		var modifyIndicated = function(step, modification) {
			var els = document.querySelectorAll('.s' + step);
			for(var i = 0; i < els.length; i++) {
				modification(els[i], 'indicated');
			}
		}

		if(lastStep >= 0) {
			modifyIndicated(lastStep, removeClass);
		}
		modifyIndicated(newStep, addClass);
	};


	this.createDrumGrid = function() {
		for(var i = 0; i < instruments.length; i++) {
			var row = document.querySelector("table").insertRow(-1);

			var instrument = instruments[i].name;
			var cell = row.insertCell(-1);
			cell.innerHTML = instrument;

			for(var step = 0; step < steps; step++) {
				var cell = row.insertCell(-1);
				cell.setAttribute('class', instrument + ' i' + i + ' s' + step);

				(function(i, step) {
					cell.onclick = function(e) {
						clickCallback(step, instruments[i]);
						toggleClass(e.target, 'active');
					};
				})(i, step);
			}
		}
	};
};


var toggleClass = function(targetElement, cssClass) {
	(targetElement.className.indexOf(cssClass) != -1)
		? removeClass(targetElement, cssClass)
		: addClass(targetElement, cssClass);
}; 


var removeClass = function(targetElement, cssClass) {
	var removal = new RegExp('\s*' + cssClass + '\s*', 'g');
	targetElement.className = targetElement.className.replace(removal, '');
};


var addClass = function(targetElement, cssClass) {
	targetElement.className += ' ' + cssClass;
};

module.exports = DrumGrid;

},{}],2:[function(require,module,exports){
var Sampler = require('./sampler.js');
var DrumGrid = require('./drum_grid.js');
var Scheduler = require('./scheduler.js');

window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( callback ){
        window.setTimeout(callback, 1000 / 60);
    };
})();

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();

var instruments = [
	{ name: 'kick', path: 'media/sounds/808_kick_short.mp3'},
	{ name: 'snare', path: 'media/sounds/808_snare_lo1.mp3'},
	{ name: 'hh_closed', path: 'media/sounds/808_hat_closed.mp3'},
	{ name: 'hh_open', path: 'media/sounds/808_hat_long.mp3'},
];

var steps = 16;

var sampler = new Sampler({
	audioContext: audioContext,
	instruments: instruments,
	steps: steps
});

var grid = new DrumGrid({
	instruments: instruments,
	steps: steps,
	clickCallback: sampler.toggleSoundInMatrix
});

var scheduler = new Scheduler({
	audioContext: audioContext,
	instruments: instruments,
	steps: steps,
	advanceCallback: function(lastStep, currentStep) {
		grid.advanceIndicator(lastStep, currentStep);
		sampler.fireStepEvents(currentStep);
	},
	scheduleCallback: sampler.playSoundsAt
});

window.addEventListener("load", grid.createDrumGrid);
window.addEventListener("load", scheduler.initScheduler);

},{"./drum_grid.js":1,"./sampler.js":3,"./scheduler.js":4}],3:[function(require,module,exports){
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
		for(var i = instruments.length - 1; i >= 0; i--) {
			var instrument = instruments[i];
			bufferInstrument(instrument, instrument.path);
		}
	};

	var bufferInstrument = function(instrument, path) {
		var bufferSound = function(event) {
      audioContext.decodeAudioData(event.target.response, function(buffer) {
        instrument.buffer = buffer;
      });
		};

		var request = new XMLHttpRequest();
		request.open('GET', path, true);
		request.responseType = 'arraybuffer';
		request.addEventListener('load', bufferSound, false);
		request.send();
	};


	var initStepMatrix = function() {
		for(var i = steps; i >= 0; i--) stepMatrix.push({instruments: []});
	};


	initStepMatrix();
	bufferInstruments();
};

module.exports = Sampler;

},{}],4:[function(require,module,exports){
var Scheduler = function(options) {
	var advanceCallback = options.advanceCallback;
	var scheduleCallback = options.scheduleCallback;
	var audioContext = options.audioContext;
	var grid = options.grid;

	var isPlaying = false;
	var startTime;
	var currentStep;
	var tempo = 120.0;
	var lookahead = 25.0; //in milliseconds
	var scheduleAheadTime = 0.1;
								// This is calculated from lookahead, and overlaps 
								// with next interval (in case the timer is late)
	var nextStepTime = 0.0;	 // when the next note is due.
	var timerID = 0;			// setInterval identifier.

	var lastStep = -1;
	var stepQueue = [];	  // the steps that have been put into the web audio,
								// and may or may not have played yet. {note, time}

	this.initScheduler = function() {
		requestAnimFrame(advance);	// start the drawing loop.
		play();
	}


	var play = function() {
		isPlaying = !isPlaying;

		if (isPlaying) { 
			currentStep = 0;
			nextStepTime = audioContext.currentTime;
			audioContext.createBufferSource();//this is just to get the thing to start
			schedule();
			return "stop";
		} else {
			window.clearTimeout( timerID );
			return "play";
		}
	}


	var advance = function() {
		var currentNote = lastStep;
		var currentTime = audioContext.currentTime;

		while (stepQueue.length && stepQueue[0].time < currentTime) {
			currentNote = stepQueue[0].note;
			stepQueue.shift();
		}

		// We only need to draw if the note has moved.
		if (lastStep != currentNote) {
			advanceCallback(lastStep, currentNote);
			lastStep = currentNote;
		}

		requestAnimFrame(advance);
	}


	var nextStep = function() {
		// Advance current note and time by a 16th note...
		var secondsPerBeat = 60.0 / tempo;	// Notice this picks up the CURRENT 
											  // tempo value to calculate beat length.
		nextStepTime += 0.25 * secondsPerBeat;	// Add beat length to last beat time

		currentStep++;	// Advance the beat number, wrap to zero
		if (currentStep == 16) currentStep = 0; 
	}


	var scheduleSounds = function( stepNumber, time ) {
		stepQueue.push( { note: stepNumber, time: time } );
		scheduleCallback(stepNumber, time);
	}


	var schedule = function() {
		// while there are notes that will need to play before the next interval, 
		// schedule them and advance the pointer.
		while (nextStepTime < audioContext.currentTime + scheduleAheadTime ) {
			scheduleSounds( currentStep, nextStepTime );
			nextStep();
		}
		timerID = window.setTimeout( schedule, lookahead );
	}
};

module.exports = Scheduler;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImRydW1fZ3JpZC5qcyIsImRydW1fbWFjaGluZS5qcyIsInNhbXBsZXIuanMiLCJzY2hlZHVsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIERydW1HcmlkID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRpbnN0cnVtZW50cyA9IG9wdGlvbnMuaW5zdHJ1bWVudHM7XG5cdGNsaWNrQ2FsbGJhY2sgPSBvcHRpb25zLmNsaWNrQ2FsbGJhY2s7XG5cdHN0ZXBzID0gb3B0aW9ucy5zdGVwcztcblxuXHR0aGlzLmFkdmFuY2VJbmRpY2F0b3IgPSBmdW5jdGlvbihsYXN0U3RlcCwgbmV3U3RlcCkge1xuXHRcdHZhciBtb2RpZnlJbmRpY2F0ZWQgPSBmdW5jdGlvbihzdGVwLCBtb2RpZmljYXRpb24pIHtcblx0XHRcdHZhciBlbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucycgKyBzdGVwKTtcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0bW9kaWZpY2F0aW9uKGVsc1tpXSwgJ2luZGljYXRlZCcpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKGxhc3RTdGVwID49IDApIHtcblx0XHRcdG1vZGlmeUluZGljYXRlZChsYXN0U3RlcCwgcmVtb3ZlQ2xhc3MpO1xuXHRcdH1cblx0XHRtb2RpZnlJbmRpY2F0ZWQobmV3U3RlcCwgYWRkQ2xhc3MpO1xuXHR9O1xuXG5cblx0dGhpcy5jcmVhdGVEcnVtR3JpZCA9IGZ1bmN0aW9uKCkge1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBpbnN0cnVtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHJvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJ0YWJsZVwiKS5pbnNlcnRSb3coLTEpO1xuXG5cdFx0XHR2YXIgaW5zdHJ1bWVudCA9IGluc3RydW1lbnRzW2ldLm5hbWU7XG5cdFx0XHR2YXIgY2VsbCA9IHJvdy5pbnNlcnRDZWxsKC0xKTtcblx0XHRcdGNlbGwuaW5uZXJIVE1MID0gaW5zdHJ1bWVudDtcblxuXHRcdFx0Zm9yKHZhciBzdGVwID0gMDsgc3RlcCA8IHN0ZXBzOyBzdGVwKyspIHtcblx0XHRcdFx0dmFyIGNlbGwgPSByb3cuaW5zZXJ0Q2VsbCgtMSk7XG5cdFx0XHRcdGNlbGwuc2V0QXR0cmlidXRlKCdjbGFzcycsIGluc3RydW1lbnQgKyAnIGknICsgaSArICcgcycgKyBzdGVwKTtcblxuXHRcdFx0XHQoZnVuY3Rpb24oaSwgc3RlcCkge1xuXHRcdFx0XHRcdGNlbGwub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHRcdGNsaWNrQ2FsbGJhY2soc3RlcCwgaW5zdHJ1bWVudHNbaV0pO1xuXHRcdFx0XHRcdFx0dG9nZ2xlQ2xhc3MoZS50YXJnZXQsICdhY3RpdmUnKTtcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9KShpLCBzdGVwKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59O1xuXG5cbnZhciB0b2dnbGVDbGFzcyA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQsIGNzc0NsYXNzKSB7XG5cdCh0YXJnZXRFbGVtZW50LmNsYXNzTmFtZS5pbmRleE9mKGNzc0NsYXNzKSAhPSAtMSlcblx0XHQ/IHJlbW92ZUNsYXNzKHRhcmdldEVsZW1lbnQsIGNzc0NsYXNzKVxuXHRcdDogYWRkQ2xhc3ModGFyZ2V0RWxlbWVudCwgY3NzQ2xhc3MpO1xufTsgXG5cblxudmFyIHJlbW92ZUNsYXNzID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCwgY3NzQ2xhc3MpIHtcblx0dmFyIHJlbW92YWwgPSBuZXcgUmVnRXhwKCdcXHMqJyArIGNzc0NsYXNzICsgJ1xccyonLCAnZycpO1xuXHR0YXJnZXRFbGVtZW50LmNsYXNzTmFtZSA9IHRhcmdldEVsZW1lbnQuY2xhc3NOYW1lLnJlcGxhY2UocmVtb3ZhbCwgJycpO1xufTtcblxuXG52YXIgYWRkQ2xhc3MgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50LCBjc3NDbGFzcykge1xuXHR0YXJnZXRFbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyBjc3NDbGFzcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRHJ1bUdyaWQ7XG4iLCJ2YXIgU2FtcGxlciA9IHJlcXVpcmUoJy4vc2FtcGxlci5qcycpO1xudmFyIERydW1HcmlkID0gcmVxdWlyZSgnLi9kcnVtX2dyaWQuanMnKTtcbnZhciBTY2hlZHVsZXIgPSByZXF1aXJlKCcuL3NjaGVkdWxlci5qcycpO1xuXG53aW5kb3cucmVxdWVzdEFuaW1GcmFtZSA9IChmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgZnVuY3Rpb24oIGNhbGxiYWNrICl7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuICAgIH07XG59KSgpO1xuXG53aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXG52YXIgYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuXG52YXIgaW5zdHJ1bWVudHMgPSBbXG5cdHsgbmFtZTogJ2tpY2snLCBwYXRoOiAnbWVkaWEvc291bmRzLzgwOF9raWNrX3Nob3J0Lm1wMyd9LFxuXHR7IG5hbWU6ICdzbmFyZScsIHBhdGg6ICdtZWRpYS9zb3VuZHMvODA4X3NuYXJlX2xvMS5tcDMnfSxcblx0eyBuYW1lOiAnaGhfY2xvc2VkJywgcGF0aDogJ21lZGlhL3NvdW5kcy84MDhfaGF0X2Nsb3NlZC5tcDMnfSxcblx0eyBuYW1lOiAnaGhfb3BlbicsIHBhdGg6ICdtZWRpYS9zb3VuZHMvODA4X2hhdF9sb25nLm1wMyd9LFxuXTtcblxudmFyIHN0ZXBzID0gMTY7XG5cbnZhciBzYW1wbGVyID0gbmV3IFNhbXBsZXIoe1xuXHRhdWRpb0NvbnRleHQ6IGF1ZGlvQ29udGV4dCxcblx0aW5zdHJ1bWVudHM6IGluc3RydW1lbnRzLFxuXHRzdGVwczogc3RlcHNcbn0pO1xuXG52YXIgZ3JpZCA9IG5ldyBEcnVtR3JpZCh7XG5cdGluc3RydW1lbnRzOiBpbnN0cnVtZW50cyxcblx0c3RlcHM6IHN0ZXBzLFxuXHRjbGlja0NhbGxiYWNrOiBzYW1wbGVyLnRvZ2dsZVNvdW5kSW5NYXRyaXhcbn0pO1xuXG52YXIgc2NoZWR1bGVyID0gbmV3IFNjaGVkdWxlcih7XG5cdGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LFxuXHRpbnN0cnVtZW50czogaW5zdHJ1bWVudHMsXG5cdHN0ZXBzOiBzdGVwcyxcblx0YWR2YW5jZUNhbGxiYWNrOiBmdW5jdGlvbihsYXN0U3RlcCwgY3VycmVudFN0ZXApIHtcblx0XHRncmlkLmFkdmFuY2VJbmRpY2F0b3IobGFzdFN0ZXAsIGN1cnJlbnRTdGVwKTtcblx0XHRzYW1wbGVyLmZpcmVTdGVwRXZlbnRzKGN1cnJlbnRTdGVwKTtcblx0fSxcblx0c2NoZWR1bGVDYWxsYmFjazogc2FtcGxlci5wbGF5U291bmRzQXRcbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZ3JpZC5jcmVhdGVEcnVtR3JpZCk7XG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgc2NoZWR1bGVyLmluaXRTY2hlZHVsZXIpO1xuIiwidmFyIFNhbXBsZXIgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHZhciBhdWRpb0NvbnRleHQgPSBvcHRpb25zLmF1ZGlvQ29udGV4dDtcblx0dmFyIGluc3RydW1lbnRzID0gb3B0aW9ucy5pbnN0cnVtZW50cztcblx0dmFyIHN0ZXBzID0gb3B0aW9ucy5zdGVwcztcblxuXHR2YXIgc3RlcE1hdHJpeCA9IFtdO1xuXG5cdHRoaXMuZ2V0U3RlcE1hdHJpeCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gc3RlcE1hdHJpeCB9O1xuXG5cblx0dGhpcy5wbGF5U291bmRzQXQgPSBmdW5jdGlvbihzdGVwLCB0aW1lKSB7XG5cdFx0dmFyIGluc3RydW1lbnRzVG9QbGF5ID0gc3RlcE1hdHJpeFtzdGVwXS5pbnN0cnVtZW50c1xuXG5cdFx0Zm9yKHZhciBpID0gaW5zdHJ1bWVudHNUb1BsYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdHZhciBzb3VyY2UgPSBhdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cdFx0XHRzb3VyY2UuYnVmZmVyID0gaW5zdHJ1bWVudHNUb1BsYXlbaV0uYnVmZmVyO1xuXHRcdFx0c291cmNlLmNvbm5lY3QoYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcblx0XHRcdHNvdXJjZS5zdGFydCh0aW1lKTtcblx0XHR9XG5cdH07XG5cblxuXHR0aGlzLmZpcmVTdGVwRXZlbnRzID0gZnVuY3Rpb24oc3RlcCkge1xuXHRcdHZhciBpbnN0cnVtZW50c1RvUGxheSA9IHN0ZXBNYXRyaXhbc3RlcF0uaW5zdHJ1bWVudHNcblxuXHRcdGZvcih2YXIgaSA9IGluc3RydW1lbnRzVG9QbGF5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHR2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2RydW1GaXJlJywge1xuXHRcdFx0XHRkZXRhaWw6IHtuYW1lOiBpbnN0cnVtZW50c1RvUGxheVtpXS5uYW1lfSxcblx0XHRcdFx0YnViYmxlczogZmFsc2UsXG5cdFx0XHRcdGNhbmNlbGFibGU6IHRydWVcblx0XHRcdH0pO1xuXG5cdFx0XHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcblx0XHR9XG5cdH07XG5cblxuXHR0aGlzLnRvZ2dsZVNvdW5kSW5NYXRyaXggPSBmdW5jdGlvbihzdGVwLCBpbnN0cnVtZW50KSB7XG5cdFx0dmFyIHRvUGxheSA9IHN0ZXBNYXRyaXhbc3RlcF0uaW5zdHJ1bWVudHM7XG5cblx0XHRmb3IoaSBpbiB0b1BsYXkpIHtcblx0XHRcdGlmKHRvUGxheVtpXS5uYW1lID09IGluc3RydW1lbnQubmFtZSkgcmV0dXJuIHRvUGxheS5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHRcdHRvUGxheS5wdXNoKGluc3RydW1lbnQpO1xuXHR9O1xuXG5cdHZhciBidWZmZXJJbnN0cnVtZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZvcih2YXIgaSA9IGluc3RydW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHR2YXIgaW5zdHJ1bWVudCA9IGluc3RydW1lbnRzW2ldO1xuXHRcdFx0YnVmZmVySW5zdHJ1bWVudChpbnN0cnVtZW50LCBpbnN0cnVtZW50LnBhdGgpO1xuXHRcdH1cblx0fTtcblxuXHR2YXIgYnVmZmVySW5zdHJ1bWVudCA9IGZ1bmN0aW9uKGluc3RydW1lbnQsIHBhdGgpIHtcblx0XHR2YXIgYnVmZmVyU291bmQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgYXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YShldmVudC50YXJnZXQucmVzcG9uc2UsIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICBpbnN0cnVtZW50LmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgIH0pO1xuXHRcdH07XG5cblx0XHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRcdHJlcXVlc3Qub3BlbignR0VUJywgcGF0aCwgdHJ1ZSk7XG5cdFx0cmVxdWVzdC5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuXHRcdHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGJ1ZmZlclNvdW5kLCBmYWxzZSk7XG5cdFx0cmVxdWVzdC5zZW5kKCk7XG5cdH07XG5cblxuXHR2YXIgaW5pdFN0ZXBNYXRyaXggPSBmdW5jdGlvbigpIHtcblx0XHRmb3IodmFyIGkgPSBzdGVwczsgaSA+PSAwOyBpLS0pIHN0ZXBNYXRyaXgucHVzaCh7aW5zdHJ1bWVudHM6IFtdfSk7XG5cdH07XG5cblxuXHRpbml0U3RlcE1hdHJpeCgpO1xuXHRidWZmZXJJbnN0cnVtZW50cygpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTYW1wbGVyO1xuIiwidmFyIFNjaGVkdWxlciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0dmFyIGFkdmFuY2VDYWxsYmFjayA9IG9wdGlvbnMuYWR2YW5jZUNhbGxiYWNrO1xuXHR2YXIgc2NoZWR1bGVDYWxsYmFjayA9IG9wdGlvbnMuc2NoZWR1bGVDYWxsYmFjaztcblx0dmFyIGF1ZGlvQ29udGV4dCA9IG9wdGlvbnMuYXVkaW9Db250ZXh0O1xuXHR2YXIgZ3JpZCA9IG9wdGlvbnMuZ3JpZDtcblxuXHR2YXIgaXNQbGF5aW5nID0gZmFsc2U7XG5cdHZhciBzdGFydFRpbWU7XG5cdHZhciBjdXJyZW50U3RlcDtcblx0dmFyIHRlbXBvID0gMTIwLjA7XG5cdHZhciBsb29rYWhlYWQgPSAyNS4wOyAvL2luIG1pbGxpc2Vjb25kc1xuXHR2YXIgc2NoZWR1bGVBaGVhZFRpbWUgPSAwLjE7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gVGhpcyBpcyBjYWxjdWxhdGVkIGZyb20gbG9va2FoZWFkLCBhbmQgb3ZlcmxhcHMgXG5cdFx0XHRcdFx0XHRcdFx0Ly8gd2l0aCBuZXh0IGludGVydmFsIChpbiBjYXNlIHRoZSB0aW1lciBpcyBsYXRlKVxuXHR2YXIgbmV4dFN0ZXBUaW1lID0gMC4wO1x0IC8vIHdoZW4gdGhlIG5leHQgbm90ZSBpcyBkdWUuXG5cdHZhciB0aW1lcklEID0gMDtcdFx0XHQvLyBzZXRJbnRlcnZhbCBpZGVudGlmaWVyLlxuXG5cdHZhciBsYXN0U3RlcCA9IC0xO1xuXHR2YXIgc3RlcFF1ZXVlID0gW107XHQgIC8vIHRoZSBzdGVwcyB0aGF0IGhhdmUgYmVlbiBwdXQgaW50byB0aGUgd2ViIGF1ZGlvLFxuXHRcdFx0XHRcdFx0XHRcdC8vIGFuZCBtYXkgb3IgbWF5IG5vdCBoYXZlIHBsYXllZCB5ZXQuIHtub3RlLCB0aW1lfVxuXG5cdHRoaXMuaW5pdFNjaGVkdWxlciA9IGZ1bmN0aW9uKCkge1xuXHRcdHJlcXVlc3RBbmltRnJhbWUoYWR2YW5jZSk7XHQvLyBzdGFydCB0aGUgZHJhd2luZyBsb29wLlxuXHRcdHBsYXkoKTtcblx0fVxuXG5cblx0dmFyIHBsYXkgPSBmdW5jdGlvbigpIHtcblx0XHRpc1BsYXlpbmcgPSAhaXNQbGF5aW5nO1xuXG5cdFx0aWYgKGlzUGxheWluZykgeyBcblx0XHRcdGN1cnJlbnRTdGVwID0gMDtcblx0XHRcdG5leHRTdGVwVGltZSA9IGF1ZGlvQ29udGV4dC5jdXJyZW50VGltZTtcblx0XHRcdGF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTsvL3RoaXMgaXMganVzdCB0byBnZXQgdGhlIHRoaW5nIHRvIHN0YXJ0XG5cdFx0XHRzY2hlZHVsZSgpO1xuXHRcdFx0cmV0dXJuIFwic3RvcFwiO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KCB0aW1lcklEICk7XG5cdFx0XHRyZXR1cm4gXCJwbGF5XCI7XG5cdFx0fVxuXHR9XG5cblxuXHR2YXIgYWR2YW5jZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjdXJyZW50Tm90ZSA9IGxhc3RTdGVwO1xuXHRcdHZhciBjdXJyZW50VGltZSA9IGF1ZGlvQ29udGV4dC5jdXJyZW50VGltZTtcblxuXHRcdHdoaWxlIChzdGVwUXVldWUubGVuZ3RoICYmIHN0ZXBRdWV1ZVswXS50aW1lIDwgY3VycmVudFRpbWUpIHtcblx0XHRcdGN1cnJlbnROb3RlID0gc3RlcFF1ZXVlWzBdLm5vdGU7XG5cdFx0XHRzdGVwUXVldWUuc2hpZnQoKTtcblx0XHR9XG5cblx0XHQvLyBXZSBvbmx5IG5lZWQgdG8gZHJhdyBpZiB0aGUgbm90ZSBoYXMgbW92ZWQuXG5cdFx0aWYgKGxhc3RTdGVwICE9IGN1cnJlbnROb3RlKSB7XG5cdFx0XHRhZHZhbmNlQ2FsbGJhY2sobGFzdFN0ZXAsIGN1cnJlbnROb3RlKTtcblx0XHRcdGxhc3RTdGVwID0gY3VycmVudE5vdGU7XG5cdFx0fVxuXG5cdFx0cmVxdWVzdEFuaW1GcmFtZShhZHZhbmNlKTtcblx0fVxuXG5cblx0dmFyIG5leHRTdGVwID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gQWR2YW5jZSBjdXJyZW50IG5vdGUgYW5kIHRpbWUgYnkgYSAxNnRoIG5vdGUuLi5cblx0XHR2YXIgc2Vjb25kc1BlckJlYXQgPSA2MC4wIC8gdGVtcG87XHQvLyBOb3RpY2UgdGhpcyBwaWNrcyB1cCB0aGUgQ1VSUkVOVCBcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgIC8vIHRlbXBvIHZhbHVlIHRvIGNhbGN1bGF0ZSBiZWF0IGxlbmd0aC5cblx0XHRuZXh0U3RlcFRpbWUgKz0gMC4yNSAqIHNlY29uZHNQZXJCZWF0O1x0Ly8gQWRkIGJlYXQgbGVuZ3RoIHRvIGxhc3QgYmVhdCB0aW1lXG5cblx0XHRjdXJyZW50U3RlcCsrO1x0Ly8gQWR2YW5jZSB0aGUgYmVhdCBudW1iZXIsIHdyYXAgdG8gemVyb1xuXHRcdGlmIChjdXJyZW50U3RlcCA9PSAxNikgY3VycmVudFN0ZXAgPSAwOyBcblx0fVxuXG5cblx0dmFyIHNjaGVkdWxlU291bmRzID0gZnVuY3Rpb24oIHN0ZXBOdW1iZXIsIHRpbWUgKSB7XG5cdFx0c3RlcFF1ZXVlLnB1c2goIHsgbm90ZTogc3RlcE51bWJlciwgdGltZTogdGltZSB9ICk7XG5cdFx0c2NoZWR1bGVDYWxsYmFjayhzdGVwTnVtYmVyLCB0aW1lKTtcblx0fVxuXG5cblx0dmFyIHNjaGVkdWxlID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gd2hpbGUgdGhlcmUgYXJlIG5vdGVzIHRoYXQgd2lsbCBuZWVkIHRvIHBsYXkgYmVmb3JlIHRoZSBuZXh0IGludGVydmFsLCBcblx0XHQvLyBzY2hlZHVsZSB0aGVtIGFuZCBhZHZhbmNlIHRoZSBwb2ludGVyLlxuXHRcdHdoaWxlIChuZXh0U3RlcFRpbWUgPCBhdWRpb0NvbnRleHQuY3VycmVudFRpbWUgKyBzY2hlZHVsZUFoZWFkVGltZSApIHtcblx0XHRcdHNjaGVkdWxlU291bmRzKCBjdXJyZW50U3RlcCwgbmV4dFN0ZXBUaW1lICk7XG5cdFx0XHRuZXh0U3RlcCgpO1xuXHRcdH1cblx0XHR0aW1lcklEID0gd2luZG93LnNldFRpbWVvdXQoIHNjaGVkdWxlLCBsb29rYWhlYWQgKTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY2hlZHVsZXI7XG4iXX0=
