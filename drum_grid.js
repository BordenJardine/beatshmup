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
