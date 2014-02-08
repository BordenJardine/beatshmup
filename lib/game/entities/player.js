ig.module(
	'game.entities.player'
)
.requires(
	'impact.entity',
	'plugins.box2d.entity'
)
.defines(function(){

EntityPlayer = ig.Box2DEntity.extend({
	size: {x: 60, y: 60},
	offset: {x: 0, y: 0},
	
	type: ig.Entity.TYPE.A,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER, // Collision is already handled by Box2D!
	
	animSheet: new ig.AnimationSheet( 'media/images/player.png', 60, 60 ),	
	
	flip: false,
	moveVector: 1000,
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		
		// Add the animations
		this.addAnim( 'idle', 1, [0] );
	},
	
	
	update: function() {
		
		// move left or right
		if( ig.input.state('left') ) {
			this.body.ApplyForce( new b2.Vec2(-this.moveVector, 0), this.body.GetPosition() );
		} else if( ig.input.state('right') ) {
			this.body.ApplyForce( new b2.Vec2(this.moveVector, 0), this.body.GetPosition() );
		}

		if( ig.input.state('up') ) {
			this.body.ApplyForce( new b2.Vec2(0, -this.moveVector), this.body.GetPosition() );
		} else if( ig.input.state('down') ) {
			this.body.ApplyForce( new b2.Vec2(0, this.moveVector), this.body.GetPosition() );
		}
		
		this.currentAnim = this.anims.idle;
		
		
		// This sets the position and angle. We use the position the object
		// currently has, but always set the angle to 0 so it does not rotate
		this.body.SetXForm(this.body.GetPosition(), 0);
		
		// move!
		this.parent();
	}
});

});
