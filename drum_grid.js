var createDrumGrid = function(instruments) {
	for(var i = 0; i <= instruments.length; i++) {
		var row = document.querySelector("table").insertRow(-1);
	
		var instrument = (i < instruments.length) ? instruments[i].name : 'indicator';
		var cell = row.insertCell(-1);
		cell.innerHTML = instrument;

		for(var step = 0; step < steps; step++) {
			var cell = row.insertCell(-1);
			cell.setAttribute('class', instrument + ' i' + i + ' s' + step);

			if(i < instruments.length) {
				(function(i, step) {
					cell.onclick = function(e) {
						toggleSoundInMatrix(step, instruments[i].buffer);
						toggleClass(e.target, 'active');
					};
				})(i, step);
			}
		}
	}
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


var advanceIndicator = function(lastStep, nextStep) {
	if(lastStep >= 0) {
		lastEl = document.querySelector('.indicator.s' + lastStep);
		removeClass(lastEl, 'active');
	}

	nextEl = document.querySelector('.indicator.s' + nextStep);
	addClass(nextEl, 'active');
};
