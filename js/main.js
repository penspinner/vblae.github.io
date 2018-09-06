var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

function start() {
  var cnvs = document.getElementById("canvas"),
      ctx = cnvs.getContext("2d");

  var w = window.innerWidth,
      h = window.innerHeight;

  cnvs.width = w * PIXEL_RATIO;
  cnvs.height = h * PIXEL_RATIO;
  cnvs.style.width = w + "px";
  cnvs.style.height = h + "px"; 

  var tx = w / 2.0,
      ty = h / 2.0;

  var particles = new Array(1000);
  for(var i = 0; i < particles.length; i++){
    var x = -tx + Math.random() * 2 * tx,
        y = -ty + Math.random() * 2 * ty,
        r = 1;

    var particle = new Particle(x, y, r, "cyan");
    particle.vel = Vec.random().mul(0);
    particles[i] = particle;
  }

  var walker = new RandomWalker(0, 0, 20, "white"),
      windowBounds = new BoundingBox(-tx, tx, -ty, ty);

  var advanceButton = new Button(-135, -ty + 10, 270, 70, "rgba(0,190,112,.3)")
    .text("Advance");

  cnvs.addEventListener("mousemove", function(event) {
    var x = event.clientX - tx,
        y = event.clientY - ty;

    if(advanceButton.inButton(x, y)){
      advanceButton.c = "rgba(73,109,137,.5)";
      document.body.style.cursor = 'pointer';
    }else {
      advanceButton.c = "rgba(0,190,112,.3)";
      document.body.style.cursor = 'default';
    }
  });

  cnvs.addEventListener("click", function(event) {
    var x = event.clientX - tx,
        y = event.clientY - ty;
    
    if(advanceButton.inButton(x, y))
      window.location = "./about.html";
  });

  document.addEventListener("touchstart", function(event){
    var x = event.changedTouches[0].pageX - tx,
        y = event.changedTouches[0].pageY - ty;

    if(advanceButton.inButton(x, y))
      window.location = "./about.html";
  });
  
  ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
  ctx.translate(tx, ty);
  draw();

  function draw() {
    ctx.fillRect(-tx, -ty, w, h);
    ctx.save();
    
    for(var i = 0; i < particles.length; i++){
      var particle = particles[i];
      particle.update(walker);
      particle.bounceOf(windowBounds);
      particle.draw(ctx);
    }

    walker.update();
    walker.wrapAround(windowBounds);
    walker.draw(ctx);

    advanceButton.draw(ctx);

    ctx.restore();
    requestAnimationFrame(draw);
  }
}

function Particle(x, y, r, c) {
  this.pos = new Vec(x, y);
  this.vel = new Vec(0, 0);
  this.acc = new Vec(0, 0);
  this.r = r;
  this.c = c;
}

Particle.prototype = {
  wrapAround : function(bounds) {
    if(this.pos.x + this.r <= bounds.lx)
      this.pos.x = bounds.rx + this.r;
    else if(this.pos.x - this.r >= bounds.rx)
      this.pos.x = bounds.lx - this.r;

    if(this.pos.y + this.r <= bounds.ty)
      this.pos.y = bounds.by + this.r;
    else if(this.pos.y - this.r >= bounds.by)
      this.pos.y = bounds.ty - this.r;
  },

  bounceOf : function(bounds) {
    if(this.pos.x - this.r <= bounds.lx){
      this.vel.x *= -.9;
      this.pos.x = bounds.lx + this.r;
    }else if(this.pos.x + this.r >= bounds.rx){
      this.vel.x *= -.9;
      this.pos.x = bounds.rx - this.r;
    }
    
    if(this.pos.y - this.r <= bounds.ty){
      this.vel.y *= -.9;
      this.pos.y = bounds.ty + this.r;
    }else if(this.pos.y + this.r >= bounds.by){
      this.vel.y *= -.9;
      this.pos.y = bounds.by - this.r;
    }
  },

  toCenter : function(bounds) {
    if(this.pos.x + this.r <= bounds.lx)
      this.pos = Vec.random().mul(Math.random() * 10);
    else if(this.pos.x - this.r >= bounds.rx)
      this.pos = Vec.random().mul(Math.random() * 10);

    if(this.pos.y + this.r <= bounds.ty)
      this.pos = Vec.random().mul(Math.random() * 10);
    else if(this.pos.y - this.r >= bounds.by)
      this.pos = Vec.random().mul(Math.random() * 10);
  },

  update : function(target) {
    var steer = Vec.diff(Vec.diff(target.pos, this.pos), this.vel).clamp(.2);
    this.acc.add(steer);
    this.vel.add(this.acc).clamp(10);
    this.pos.add(this.vel);
    this.acc.mul(0);
  },

  draw : function(ctx) {
    ctx.fillStyle = this.c;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI, false);
    ctx.fill();
  }
};

function RandomWalker(x, y, r, c) {
  Particle.call(this, x, y, r, c);
}

RandomWalker.prototype = Object.create(Particle.prototype);
RandomWalker.prototype.constructor = RandomWalker;

RandomWalker.prototype.draw = function(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = this.c;
  ctx.lineWidth = 3;
  ctx.fillStyle = "rgba(100,100,100, .5)";
  ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI, false);
  ctx.stroke();
  ctx.fill();
  ctx.restore();
};

RandomWalker.prototype.update = function() {
  if(Math.random() < .1)
    this.vel = Vec.random().mul(Math.random() * 10);

  this.pos.add(this.vel);
}

function Button(x, y, w, h, c) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.c = c;
  this.btnText = "";
  this.bounds = new BoundingBox(x, x + w, y, y + h);
}

Button.prototype = {
  text : function(text) {
    if(text == undefined)
      return this.btnText;

    this.btnText = text;
    return this;
  },

  draw : function(ctx) {
    ctx.save();
    ctx.fillStyle = this.c;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.font = "60px Jura";
    ctx.fillStyle = "white";
    ctx.fillText(this.btnText, this.x + 10, this.y + 55);
    ctx.restore();
  },

  inButton : function(x, y) {
    var minx = this.bounds.lx,
        maxx = this.bounds.rx;

    var miny = this.bounds.ty,
        maxy = this.bounds.by;

    return x >= Math.min(minx, maxx) && x <= Math.max(minx, maxx) &&
           y >= Math.min(miny, maxy) && y <= Math.max(miny, maxy);
  }
};

function Vec(x, y) {
  this.x = x;
  this.y = y;

  this.cachedAngle = null;
  this.cachedMagnitude = null;
}

Vec.random = function() {
  var angle = Math.random() * 2 * Math.PI,
      magnitude = Math.random();

  var vec = new Vec(0, 0);
  vec.angle(angle);
  vec.magnitude(magnitude);
  return vec;
};

Vec.dot = function(vec0, vec1) {
  return vec0.x * vec1.x + vec0.y * vec1.y;
};

Vec.norm = function(vec) {
  var magnitude = vec.magnitude();
  return new Vec(vec.x / magnitude, vec.y / magnitude);
}

Vec.diff = function(vec0, vec1) {
  var xdiff = vec0.x - vec1.x,
      ydiff = vec0.y - vec1.y;

  return new Vec(xdiff, ydiff);
};

Vec.sum = function(vec0, vec1) {
  var xsum = vec0.x + vec1.x,
      ysum = vec0.y + vec1.y;

  return new Vec(xsum, ysum);
};

Vec.prototype = {
  angle : function(angle) {
    if(angle == undefined && this.cachedAngle == null)
      return this.cachedAngle = Math.atan2(this.y, this.x);

    if(angle == undefined && this.cachedAngle != null)
      return this.cachedAngle;

    var magnitude = this.magnitude();
    this.x = magnitude * Math.cos(angle);
    this.y = magnitude * Math.sin(angle);
    this.cachedAngle = angle;

    return this;
  },

  magnitude : function(magnitude) {
    if(magnitude == undefined && this.cachedMagnitude == null)
      return this.cachedMagnitude = Math.sqrt(this.x * this.x + this.y * this.y);

    if(magnitude == undefined && this.cachedMagnitude != null)
      return this.cachedMagnitude;

    if(magnitude < 0)
      magnitude *= -1;

    var angle = this.angle();
    this.x = magnitude * Math.cos(angle);
    this.y = magnitude * Math.sin(angle);
    this.cachedMagnitude = magnitude;

    return this;
  },

  clamp : function(magnitude) {
    if(Math.abs(this.magnitude()) > magnitude)
      this.magnitude(magnitude);

    return this;
  },

  add : function(vec) {
    this.x += vec.x;
    this.y += vec.y;

    this.cachedAngle = null;
    this.cachedMagnitude = null;
    return this;
  },

  sub : function(vec) {
    this.x -= vec.x;
    this.y -= vec.y;

    this.cachedAngle = null;
    this.cachedMagnitude = null;
    return this;
  },

  mul : function(scalar) {
    this.x *= scalar;
    this.y *= scalar;

    this.cachedAngle = null;
    this.cachedMagnitude = null;
    return this;
  },

  div : function(scalar) {
    this.x /= scalar;
    this.y /= scalar;

    this.cachedAngle = null;
    this.cachedMagnitude = null;
    return this;
  }
};

function BoundingBox(lx, rx, ty, by) {
  this.lx = lx;
  this.rx = rx;
  this.ty = ty;
  this.by = by;
}
