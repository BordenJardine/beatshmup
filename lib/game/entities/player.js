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
	
	frames: {
		kick: 0,
		snare: 1,
		hh_closed: 2,
		hh_open: 3
	},

	moveVector: 1000,
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		
		// Add the animations
		this.addAnim( 'idle', 1, [0] );

		this.bindDrumListeners();
	},
	
	
	bindDrumListeners: function() {
		context = this;
		document.addEventListener('drumFire', function(e) {
			context.shoot(e.detail.name);
		}, false);
	},

	
	shoot: function(name) {
		var x = this.pos.x + 30;
		var y = this.pos.y;
		
		ig.game.spawnEntity(EntityProjectile, x, y, {frame: this.frames[name]});
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

		if( ig.input.pressed('shoot') ) {
			var x = this.pos.x + 30;
			var y = this.pos.y;
			
			//frames {0: kick, 1:snare, 2: closed_hh, 3 open_hh}
			ig.game.spawnEntity(EntityProjectile, x, y, {frame: 2});
		}
		
		this.currentAnim = this.anims.idle;
		
		
		// This sets the position and angle. We use the position the object
		// currently has, but always set the angle to 0 so it does not rotate
		this.body.SetXForm(this.body.GetPosition(), 0);
		
		// move!
		this.parent();
	}
});


EntityProjectile = ig.Box2DEntity.extend({
	size: {x: 10, y: 10},
	
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.B, 
	collides: ig.Entity.COLLIDES.NEVER,
		
	animSheet: new ig.AnimationSheet( 'media/images/bullets.png', 10, 10 ),	
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		
		this.addAnim( 'idle', 1, [settings.frame] );

		var velocity = 2000;
		this.body.ApplyImpulse( new b2.Vec2(0,-velocity), this.body.GetPosition() );
	}	
});

});
