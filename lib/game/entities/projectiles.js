ig.module(
	'game.entities.projectiles'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntityShockwave = ig.Entity.extend({
	size: {x: 20, y: 20},
	
	type: ig.Entity.TYPE.A,
	checkAgainst: ig.Entity.TYPE.B, 
	collides: ig.Entity.COLLIDES.NEVER,

	color: '#ffbbbb',
	radius: 10,
	expandRate: 6,
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
	shots: 20,
	spread: 40,


	init: function( x, y, settings ) {
		this.angle = settings.angle;
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
	lifeSpan: 0.5,
	lifeTimer: 0,
        maxVel: {x: 800, y: 800},
	variance: 400,
	deceleration: 0.98,
		
	
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
