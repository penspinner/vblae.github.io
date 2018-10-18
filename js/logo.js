function _logo() {  
  var cnvs = document.getElementById("canvas"),
      ctx  = cnvs.getContext("2d"),

  // width & height
      w = window.innerWidth,
      h = window.innerHeight;

      cnvs.setAttribute("width", w);
      cnvs.setAttribute("height", h);

  // canvas translations
  var tx = w * 0.5,
      ty = h * 0.5;

  window.onresize = function(e) {
    w = window.innerWidth,
    h = window.innerHeight;

    cnvs.setAttribute("width", w);
    cnvs.setAttribute("height", h);

    tx = w * 0.5,
    ty = h * 0.5;

    ctx.translate(tx,ty);
  };

  cnvs.addEventListener("mouseenter", function(event){
    ctx.lineWidth   = 15;
    ctx.strokeStyle = "rgba(0,190,112,1)";
  });

  cnvs.addEventListener("mouseout", function(event){
    ctx.lineWidth   = 10;
    ctx.strokeStyle = "white";
  });

  cnvs.addEventListener("click", function(event){
    window.location = "http://vblae.github.io";
  });

  function rotate(logo, angle, prop){
    var cos = Math.cos(angle),
        sin = Math.sin(angle),

        vertices = logo.vertices;

    for (var i = 0; i < vertices.length; i++) {
      var v = vertices[i],
          f = v[prop.f],
          s = v[prop.s],
          a = f * cos - s * sin,
          b = s * cos + f * sin;

      v[prop.f] = a;
      v[prop.s] = b;
    }
  }

  var Vertex = {
    x : 0,
    y : 0,
    z : 0,

    create: function(x, y, z){
      var obj = Object.create(this);

      obj.x = x;
      obj.y = y;
      obj.z = z;

      return obj;
    }
  };

  var Logo = {
    vertices : [],

    create: function(){
      var obj = Object.create(this);
      this.createVerticies();

      return obj;
    },

    createVerticies: function(){
      var v0 = Vertex.create( 0   , -400 ,  0  ),
          v1 = Vertex.create( 250 ,  0   , -250),
          v2 = Vertex.create(-250 ,  0   , -250),
          v3 = Vertex.create(-250 ,  0   ,  250),
          v4 = Vertex.create( 250 ,  0   ,  250);

      this.vertices.push(v0, v1, v2, v3, v4);
    },

    draw: function(ctx, fl){
       var v = this.vertices;

       ctx.beginPath();
       ctx.moveTo(v[0].x, v[0].y);
       ctx.lineTo(v[1].x, v[1].y);
       ctx.moveTo(v[0].x, v[0].y);
       ctx.lineTo(v[2].x, v[2].y);
       ctx.moveTo(v[0].x, v[0].y);
       ctx.lineTo(v[3].x, v[3].y);
       ctx.moveTo(v[0].x, v[0].y);
       ctx.lineTo(v[4].x, v[4].y);
       ctx.lineTo(v[3].x, v[3].y);
       ctx.lineTo(v[2].x, v[2].y);
       ctx.lineTo(v[1].x, v[1].y);
       ctx.lineTo(v[4].x, v[4].y);
       ctx.stroke();
    }
  };

  var logo = Logo.create(0,0),
      rotx = {f : "y", s : "z"},
      roty = {f : "x", s : "z"};

  ctx.fillStyle   = "rgba(0,0,0,0)";
  ctx.lineWidth   = 10;
  ctx.strokeStyle = "white";

  ctx.translate(tx, ty);
  draw();

  function draw() {
    ctx.clearRect(-tx, -ty, w, h);
    logo.draw(ctx, 100);
    rotate(logo, 0.01, rotx);
    rotate(logo, -0.03, roty)
    requestAnimationFrame(draw);
  }
};
