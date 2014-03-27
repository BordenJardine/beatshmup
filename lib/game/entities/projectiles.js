ig.module(
	'game.entities.projectiles'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntityShapeBullet = ig.Entity.extend({
	size: {x: 10, y: 10},

	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A, 
	collides: ig.Entity.COLLIDES.ACTIVE,
        maxVel: {x: 400, y: 400},
		
	animSheet: new ig.AnimationSheet( 'media/images/bullets.png', 10, 10 ),	
	frames: {
		circle: 0,
		cross: 1,
		chevron: 2,
		ex: 3
	},
	

	init: function( x, y, settings ) {
		this.angle = (settings.angle != undefined) ? settings.angle : ig.global.UP_RADS;
		this.addAnim( 'idle', 1, [this.frames[settings.shape]] );
		x = x - this.size.x / 2;

		this.vel.x = Math.cos(this.angle) * this.maxVel.x;
		this.vel.y = Math.sin(this.angle) * this.maxVel.y;

		this.parent( x, y, settings );
	},


        handleMovementTrace: function ( res ) {
                if( res.collision.x || res.collision.y ) {
                        this.kill();
                } else {
                        // No collision. Just move normally.
                        this.parent( res );
                }
        }
});


EntityShockwave = ig.Entity.extend({
	size: {x: 20, y: 20},
	
	type: ig.Entity.TYPE.A,
	checkAgainst: ig.Entity.TYPE.B, 
	collides: ig.Entity.COLLIDES.NEVER,

	color: '#ff8888',
	radius: 10,
	expandRate: 3,
	lifeSpan: 0.25,
	lifeTimer: 0,
		
	
	init: function( x, y, settings ) {
		x = x - this.size.x / 2;
		y = y - this.size.y / 2; //trying to center the shockwave

		this.followEntity = settings.followEntity;
		this.lifeTimer = new ig.Timer();
		this.lifeTimer.set(this.lifeSpan);
		this.parent( x, y, settings );
	},


	update: function() {
		if(this.lifeTimer.delta() >= 0) {
			this.kill();
		}

		this.expand();

		if(this.followEntity !== undefined){
			this.pos.x = this.followEntity.pos.x + this.followEntity.size.x / 2
			this.pos.y = this.followEntity.pos.y + this.followEntity.size.y / 2
		}

		this.pos.x -= this.size.x / 2 //adjust for the changing size
		this.pos.y -= this.size.y / 2
		this.parent();
	},

	
        draw: function() {
                var     x = ig.system.getDrawPos(this.pos.x) - ig.game.screen.x + this.size.x/2,
                        y = ig.system.getDrawPos(this.pos.y) - ig.game.screen.y + this.size.y/2;

                this.drawCircle(x, y, this.color, this.radius);
                this.parent();
        },


	drawCircle: function(x, y, color, radius) {
		var ctx = ig.system.context;

		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.lineWidth = 2;
		ctx.strokeStyle = color;
		ctx.stroke();
	},

	
	expand: function() {
		this.radius += this.expandRate;
		this.size = {x: this.radius * 2, y: this.radius * 2};
	}
});


EntityScatterShot = ig.Entity.extend({
	shots: 25,
	spread: 40,


	init: function( x, y, settings ) {
		this.angle = (settings.angle != undefined) ? settings.angle : 270;
		this.pos.x = x;
		this.pos.y = y;
		this.spawnShots();
		this.kill();
	},

	
	spawnShots: function() {
		for(var x = this.shots; x > 0; x--) {
			var randangle = this.angle + ((Math.random() * this.spread) - this.spread / 2);
			ig.game.spawnEntity(EntityScatterBullet, this.pos.x, this.pos.y, {angle: randangle});
		}
	}
});


EntityScatterBullet = ig.Entity.extend({
	size: {x: 3, y: 3},
	
	type: ig.Entity.TYPE.A,
	checkAgainst: ig.Entity.TYPE.B, 
	collides: ig.Entity.COLLIDES.NEVER,

	color: '#66ff77',
	lifeSpan: 0.45,
        maxVel: {x: 800, y: 800},
	variance: 400,
	deceleration: 0.95,
		
	
	init: function( x, y, settings ) {
		this.lifeTimer = new ig.Timer();
		this.lifeTimer.set(this.lifeSpan);

		var angle = settings.angle/ig.global.TO_RADS;
		randVel = (Math.random() * this.variance) + this.maxVel.x - this.variance;
		this.vel.x = Math.cos(angle) * randVel;
		this.vel.y = Math.sin(angle) * randVel;

		this.parent( x, y, settings );
	},


	update: function() {
		if(this.lifeTimer.delta() >= 0) {
			this.kill();
		}

		this.vel.x = this.vel.x * this.deceleration;
		this.vel.y = this.vel.y * this.deceleration;

		this.parent();
	},

	
        draw: function() {
                this.drawDot(this.pos.x, this.pos.y, this.size.x, this.size.y, this.color);
                this.parent();
        },


	drawDot: function(x, y, w, h, color) {
		var ctx = ig.system.context;
		ctx.fillStyle = color;
		ctx.fillRect(x,y,w,h);
	},


        //handle collisions with walls
        handleMovementTrace: function ( res ){
                if( res.collision.x || res.collision.y ) {
                        this.kill();
                } else {
                        // No collision. Just move normally.
                        this.parent( res );
                }
        }

});

});
