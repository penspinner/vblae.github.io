// fix for blurry text on hi dpi displays found at
// https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();
// ---------------------------------

function start(){
	var container = document.getElementById("bullets-container"),
			cnvs      = document.getElementById("bullets-canvas"),
			ctx       = cnvs.getContext("2d"),

			// width & height
			w = container.clientWidth,
			h = 600,

			// canvas translations
			tx = w / 2,
			ty = h / 2;

	cnvs.setAttribute("width",  w * PIXEL_RATIO);
	cnvs.setAttribute("height", h * PIXEL_RATIO);
  cnvs.style.width  = w + "px";
  cnvs.style.height = h + "px";
	
  // adjust for pixel ratio 
  ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
	// make (0, 0) the center of canvas
	ctx.translate(tx, ty);
			
	var	bounds = BoundingBox.create(-tx, tx, -ty, ty),
			enemy  = Player.create(tx * 0.7, 0, 20, 100, "darkred"),
			player = Player.create(-tx * 0.7, 0, 20, 100, "grey"),
			gun    = Gun.create(player, "brown");

	gun.spread = 0.08;
	player.equipt(gun);
	Controller.takeControl(player);

	CollisionManager.addPlayer(player);
	CollisionManager.addPlayer(enemy);
	CollisionManager.addGun(gun);

	document.addEventListener("keydown", handleKeyDown);
	document.addEventListener("keyup", handleKeyUp);

	update();

	// update loop
	function update(){
		ctx.fillRect(-tx, -ty, w, h);
		ctx.save();

		player.update(bounds);
		enemy.update(bounds);
		ImpactManager.update();
		CollisionManager.checkForCollisions();

		player.draw(ctx);
		enemy.draw(ctx);
		ImpactManager.draw(ctx);

		ctx.restore();
		requestAnimationFrame(update);
	}
}

var CollisionManager = {
	guns    : [],
	players : [],

	addPlayer : function(p){
		this.players.push(p);
	},

	addGun : function(g){
		this.guns.push(g);
	},

	checkForCollisions : function(){
		this.checkPlayerCollisions();
		this.checkBulletCollisions();
	},

	checkPlayerCollisions : function(){
		var players = this.players;

		for(var i = 0; i < players.length; i++){
			var p0 = players[i];

			for(var j = i + 1; j < players.length; j++){
				var p1 = players[j];

				if(Utils.circleCollision(p0, p1)){
					var	totalMass = p0.mass + p1.mass,

							mass2A = p0.mass * 2,
							mass2B = p1.mass * 2,
							massAB = p0.mass - p1.mass,
							massBA = p1.mass - p0.mass,

							mr0 = massAB / totalMass,
							mr1 = mass2B / totalMass,
							mr2 = mass2A / totalMass,
							mr3 = massBA / totalMass,

							dx0 = mr0 * p0.dx + mr1 * p1.dx,
							dy0 = mr0 * p0.dy + mr1 * p1.dy,
							
							dx1 = mr2 * p0.dx + mr3 * p1.dx,
							dy1 = mr2 * p0.dy + mr3 * p1.dy;

					p0.dx = dx0;
					p0.dy = dy0;

					p1.dx = dx1;
					p1.dy = dy1;
				}
			}
		}
	},

	checkBulletCollisions : function(){
		var players = this.players,
				guns    = this.guns;

		for(var i = 0; i < guns.length; i++){
			var bullets = guns[i].bullets;

			for(var j = 0; j < bullets.length; j++){
				var b = bullets[j];

				for(var k = 0; k < players.length; k++){
					var p = players[k];

					if(Utils.circlePointCollision(b.x, b.y, p)){
						b.hasHit = true;

						var totalMass = b.mass + p.mass,
								
								mass2A = b.mass * 2,
								massBA = p.mass - b.mass,

								mr0 = mass2A / totalMass,
								mr1 = massBA / totalMass,

								dx = b.dx * Math.cos(b.angle),
								dy = b.dy * Math.sin(b.angle),

								pdx = mr0 * dx + mr1 * p.dx,
								pdy = mr0 * dy + mr1 * p.dy;

						p.dx = pdx;
						p.dy = pdy;

						ImpactManager.create(b.x, b.y, b.angle + Math.PI , "red");
					}
				}
			}
		}
	}
};

var ImpactManager = {
	impacts : [],

	create : function(x, y, a, c){
		this.impacts.push(Impact.create(x, y, a, c));
	},

	update : function(){
		var impacts = this.impacts;

		for (var i = impacts.length - 1; i >= 0; i--) {
			var ci = impacts[i];
			
			// impact has no live particles, remove from list
			if(ci.particles.length == 0)
				impacts.splice(i,1);
			else
				ci.update();
		}
	},

	draw : function(ctx){
		var impacts = this.impacts;

		for (var i = impacts.length - 1; i >= 0; i--) 
			impacts[i].draw(ctx);
	}
};

var Impact = {
	x         : 0,
	y         : 0,
	dx        : 5,
	dy        : 5,
	angle     : 0,
	color     : null,
	particles : null,

	create : function(x, y, a, c){
		var newImpact = Object.create(this);

		newImpact.x     = x;
		newImpact.y     = y;
		newImpact.angle = a;
		newImpact.color = c || "rgb(255, 176, 120)";

		newImpact.createParticles();

		return newImpact;
	},

	createParticles : function(){
		var particles = this.particles = [],
				np = 10; 

		for(var i = 0; i < np; i++){
			particles.push({
				x : this.x,
				y : this.y,
				angle : Utils.randomRange(-Math.PI, Math.PI),
				distanceTraveled : 0,
				maxDistance : Utils.randomRange(10, 60),
			});
		}
	},

	update : function(){
		var particles = this.particles;

		for (var i = particles.length - 1; i >= 0; i--) {
			var p = particles[i];

			var dx = this.dx * Math.cos(p.angle),
					dy = this.dy * Math.sin(p.angle); 

			p.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

			// particle has reached end of life time, remove from list
			if(p.distanceTraveled >= p.maxDistance){
				this.particles.splice(i, 1);
				continue;
			}

			p.x += dx;
			p.y += dy;
		}
	},

	draw : function(ctx){
		var particles = this.particles;
		
		ctx.fillStyle = this.color;
		for (var i = particles.length - 1; i >= 0; i--) {
			var p = particles[i];

			ctx.beginPath();
			ctx.arc(p.x, p.y, 1, 0, Math.PI * 2, false);
			ctx.fill();
		}
	}
};

var Bullet = {
	x        : 0,
	y        : 0,
	dx       : 25,
	dy       : 25,
	mass     : 0.1,
	angle    : 0,
	width    : 2,
	length   : 47,
	ricochet : 0.25,
	color    : null,
	vertices : null,
	hasHit   : false,

	create : function(x, y, a, c){
		var newBullet = Object.create(this);

		newBullet.x     = x;
		newBullet.y     = y;
		newBullet.angle = a || 0;
		newBullet.color = c || "rgb(189, 176, 100)";

		newBullet.vertices = BulletModel.create(newBullet.width, newBullet.length);
		newBullet.rotateModel();

		return newBullet;
	},

	draw : function(ctx){
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
		ctx.lineTo(this.vertices[1].x, this.vertices[1].y);
		ctx.lineTo(this.vertices[2].x, this.vertices[2].y);
		ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
		ctx.fill();
	},

	update : function(bounds){
		var dx = this.dx * Math.cos(this.angle),
				dy = this.dy * Math.sin(this.angle);

		var vertices = this.vertices;
		for(var i = 0; i < vertices.length; i++){
			var v = vertices[i];

			v.x += dx;
			v.y += dy;
		}

		this.x = vertices[0].x;
		this.y = vertices[0].y;

		this.boundTo(bounds);
	},

	boundTo : function(bounds){
		this.bound("x", bounds.lx, bounds.rx);
		this.bound("y", bounds.ty, bounds.by);
	},

	bound : function(prop, min, max){
		var value = undefined;

		if(this[prop] < min)
			value = min;
		else if(this[prop] > max)
			value = max;

		// if value != undefined, then bullet has hit boundary
		if(value){
			if(this.ricochet())
				this.onRicochet(prop, value);
			else
				this.hasHit = true;
		
			ImpactManager.create(this.x, this.y, this.angle + Math.PI);
		}
	},

	onRicochet : function(prop, value){
		this[prop] = value;
		this.angle += -Math.PI / 2 * Math.random() * Math.PI;

		this.resetModel();
		this.rotateModel();
	},

	ricochet : function(){
		return (.25 >= Math.random());
	},

	resetModel : function(){
		this.vertices = BulletModel.create(this.width, this.length);
	},

	rotateModel : function(){
		var cos = Math.cos(this.angle),
		    sin = Math.sin(this.angle);

		var vertices = this.vertices;
		for(var i = 0; i < vertices.length; i++) {
			var v = vertices[i],
					x = v.x * cos - v.y * sin,
					y = v.y * cos + v.x * sin;

			v.x = x + this.x;
			v.y = y + this.y;
		}
	}
};

var BulletModel = {
	create : function(w, l){
		var hw = w / 2,
				nl = -l,
				vertices = [];

		vertices.push({
			x : 0,
			y : 0
		});

		vertices.push({
			x : nl,
			y : hw
		});

		vertices.push({
			x : nl,
			y : -hw
		});

		return vertices;
	}
};

var Gun  = {
	angle   : 0,
	theta   : 0.05,
	width   : 5,
	length  : 40,
	spread  : 0,
	color   : null,
	player  : null,
	bullets : null,

	rotatingLeft  : false,
	rotatingRight : false,
	shooting      : false,

	create : function(p, c){
		var newGun = Object.create(this);

		newGun.player  = p;
		newGun.color   = c;
		newGun.bullets = [];

		return newGun;
	},

	draw : function(ctx){
		var bullets = this.bullets;

		for(var i = 0; i < bullets.length; i++)
			bullets[i].draw(ctx);

		var fx = this.player.x,
				fy = this.player.y,

				tx = fx + this.length * Math.cos(this.angle),
				ty = fy + this.length * Math.sin(this.angle);

		ctx.lineWidth   = this.width;
		ctx.strokeStyle = this.color;

		ctx.beginPath();
		ctx.moveTo(fx, fy);
		ctx.lineTo(tx, ty);
		ctx.stroke();
	},

	update : function(bounds){
		if(this.rotatingLeft)
			this.angle -= this.theta;

		if(this.rotatingRight)
			this.angle += this.theta;

		if(this.shooting){
			var hl = this.length / 2,
					bx = this.player.x + hl * Math.cos(this.angle),
					by = this.player.y + hl * Math.sin(this.angle),
					ba = this.angle + Utils.randomRange(-this.spread, this.spread);

			this.bullets.push(Bullet.create(bx, by, ba));
		}

		var bullets = this.bullets;
		for (var i = bullets.length - 1; i >= 0; i--) {
			var cb = bullets[i];

			// bullet has hit, remove from list
			if(cb.hasHit)
				bullets.splice(i, 1);
			else
				bullets[i].update(bounds);		
		}
	}
};


var Player = {
	x      : 0,
	y      : 0,
	dx     : 0,
	dy     : 0,
	mass   : 20,
	radius : 20,
	color  : null,

	max_dx       : 10,
	max_dy       : 10,
	acceleration : 0.4,
	friction     : 0.95,
	bounce       : 0.8,

	movingLeft  : false,
	movingRight : false,
	movingUp    : false,
	movingDown  : false,

	gun : undefined,

	create : function(x, y, r, m, c){
		var newPlayer = Object.create(this);

		newPlayer.x = x;
		newPlayer.y = y;

		newPlayer.radius = r;
		newPlayer.mass   = m;
		newPlayer.color  = c;

		return newPlayer;
	},

	equipt : function(gun){
		this.gun = gun;
	},

	draw : function(ctx){
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(this.x, this.y, this.radius,  0, Math.PI * 2, false);
		ctx.fill();

		if(this.gun)
			this.gun.draw(ctx);
	},

	update : function(bounds){
		var abs_dx = Math.abs(this.dx),
				abs_dy = Math.abs(this.dy);

		if(abs_dx < this.max_dx){
			if(this.movingLeft)
				this.dx -= this.acceleration;

			if(this.movingRight)
				this.dx += this.acceleration;
		}

		if(abs_dy < this.max_dy){
			if(this.movingUp)
				this.dy -= this.acceleration;

			if(this.movingDown)
				this.dy += this.acceleration;
		}

		this.dx *= this.friction;
		this.dy *= this.friction;

		this.x += this.dx;
		this.y += this.dy;

		this.boundTo(bounds);

		if(this.gun)
			this.gun.update(bounds);
	},

	boundTo : function(bounds){
		this.boundX(bounds.lx, bounds.rx);
		this.boundY(bounds.ty, bounds.by);
	},

	boundX : function(lx, rx){
		if(this.x < lx + this.radius){
			this.x = lx + this.radius;
			this.dx *= -this.bounce;
		}

		else if(this.x > rx - this.radius){ 
			this.x = rx - this.radius;
			this.dx *= -this.bounce;
		}

	},

	boundY : function(ty, by){
		if(this.y < ty + this.radius){
			this.y = ty + this.radius;
			this.dy *= -this.bounce;
		}

		else if(this.y > by - this.radius){
			this.y = by - this.radius;
			this.dy *= -this.bounce;
		}
	}
};

var BoundingBox = {
	lx : null,
	rx : null,
	ty : null,
	by : null,

	create : function(lx, rx, ty, by){
		var newBoundingBox = Object.create(this);

		newBoundingBox.lx = lx;
		newBoundingBox.rx = rx;
		newBoundingBox.ty = ty;
		newBoundingBox.by = by;

		return newBoundingBox;
	}
};

var Controller = {
	player      : null,
	shoot       : 32,
	moveLeft    : 65,
	moveRight   : 68,
	moveUp      : 87,
	moveDown    : 83,
	rotateLeft  : 37,
	rotateRight : 39,

	takeControl : function(player){
		this.player = player;
	}
};

var Utils = {
	randomRange: function(min, max) {
		return min + Math.random() * (max - min);
	},

	distance: function(p0, p1) {
		var dx = p1.x - p0.x,
				dy = p1.y - p0.y;

		return Math.sqrt(dx * dx + dy * dy);
	},

	distanceXY: function(x0, y0, x1, y1) {
		var dx = x1 - x0,
				dy = y1 - y0;

		return Math.sqrt(dx * dx + dy * dy);
	},

	circleCollision: function(c0, c1) {
		return Utils.distance(c0, c1) <= c0.radius + c1.radius;
	},

	circlePointCollision: function(x, y, circle) {
		return Utils.distanceXY(x, y, circle.x, circle.y) < circle.radius;
	}
};

// event handlers
function handleKeyDown(event){
	onKeyEvent(event.keyCode, true);
}

function handleKeyUp(event){
	onKeyEvent(event.keyCode, false);
}

function onKeyEvent(keyCode, value){
	switch(keyCode){
		case Controller.moveLeft:
			Controller.player.movingLeft = value;
			break;

		case Controller.moveRight:
			Controller.player.movingRight = value;
			break;

		case Controller.moveUp:
			Controller.player.movingUp = value;
			break;

		case Controller.moveDown:
			Controller.player.movingDown = value;
			break;

		case Controller.rotateLeft:
			Controller.player.gun.rotatingLeft = value;
			break;

		case Controller.rotateRight:
			Controller.player.gun.rotatingRight = value;
			break;

		case Controller.shoot:
			Controller.player.gun.shooting = value;
			break;
	}
}
