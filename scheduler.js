var Scheduler = function(options) {
	var audioContext = options.audioContext;
	var grid = options.grid;

	var isPlaying = false;
	var startTime;
	var currentStep;
	var tempo = 120.0;
	var lookahead = 25.0; //(in milliseconds)
	var scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
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
			grid.advanceIndicator(lastStep, currentNote);
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
		sampler.playSoundsAt(stepNumber, time);
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
