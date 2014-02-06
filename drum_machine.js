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

var sampler = new Sampler({audioContext: audioContext, instruments: instruments, steps: steps});
var grid = new DrumGrid({instruments: instruments, steps: steps, sampler: sampler});
var scheduler = new Scheduler({audioContext: audioContext, grid: grid, instruments: instruments, steps: steps});

window.addEventListener("load", grid.createDrumGrid);
window.addEventListener("load", scheduler.initScheduler);
