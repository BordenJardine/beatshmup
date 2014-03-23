ig.module(
	'game.entities.projectiles'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntityShockwave = ig.Entity.extend({
	size: {x: 20, y: 20},
	offset: {x: -10, y: -10},
	
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

		this.parent( x, y, settings );

		this.lifeTimer = new ig.Timer();
		this.lifeTimer.set(this.lifeSpan);
	},


	update: function() {
		if(this.lifeTimer.delta() >= 0) {
			this.kill();
		}

		this.expand();
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
		this.pos.x -= this.expandRate;
		this.pos.y -= this.expandRate; //gotta scootch it over to keep it centered
	}
});

});
