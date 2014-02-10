ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',

	'game.entities.player',
	'game.levels.test',

	'plugins.box2d.game',

	'impact.debug.debug'
)
.defines(function(){

MyGame = ig.Box2DGame.extend({
	
	clearColor: '#333333',
	gravity: 0, // All entities are affected by this
	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),
	
	
	init: function() {
		// Initialize your game here; bind keys etc.
		this.bindKeys();
		this.loadLevel( LevelTest );
	},

	loadLevel: function( data ) {
		this.parent( data );
		for( var i = 0; i < this.backgroundMaps.length; i++ ) {
			this.backgroundMaps[i].preRender = true;
		}
	},
	
	update: function() {
		// Update all entities and backgroundMaps
		this.parent();
		
		// Add your own, additional update code here
	},
	
	draw: function() {
		// Draw all entities and backgroundMaps
		this.parent();
		
		
		// Add your own drawing code here
		var x = ig.system.width/2,
			y = ig.system.height/2;
		
	},


	bindKeys: function() {
		ig.input.bind(ig.KEY.A, 'left');
		ig.input.bind(ig.KEY.D, 'right');
		ig.input.bind(ig.KEY.W, 'up');
		ig.input.bind(ig.KEY.S, 'down');
		ig.input.bind(ig.KEY.V, 'shoot');
	}
});


ig.main( '#canvas', MyGame, 60, 840, 540, 1 );

});
