function start(){
	var cnvs = document.getElementById("canvas"),
		ctx = cnvs.getContext("2d"),

		w = window.innerWidth,
		h = window.innerHeight,

		mid_x = Math.round(h / 2),
		mid_y = Math.round(h / 2);

	cnvs.setAttribute("width", w);
	cnvs.setAttribute("height", h);

	ctx.fillStyle = "rgba(0,0,0,1)";
	ctx.fillRect(0, 0, w, h);

	window.onresize = function(e) {
		w = window.innerWidth,
		h = window.innerHeight;

		cnvs.setAttribute("width", w);
		cnvs.setAttribute("height", h);

		mid_x = Math.round(h / 2),
		mid_y = Math.round(h / 2);

		drawText();
		drawBox();
	};

	var Link = {
		list : [],

		add : function(t, x, y){
			this.list.push({
				t : t,
				x : x,
				y : y,
			});
		},

		draw : function(){
			var list = this.list;
			for(var i = 0; i < list.length; i++){
				var curr = list[i];
				ctx.fillText(curr.t, curr.x, curr.y);
			}
		},
	};

	var Animation = {
		text     : null,
		from     : null,
		to       : null,
		duration : null,
		next     : null,

		create : function(t){
			var na = Object.create(this);
			na.text = t;

			return na;
		},

		from : function(f){
			this.from = f;
			return this;
		},

		to : function(t){
			this.to = t;
			return this;
		},

		lasting : function(d){
			this.duration = d;
			return this;
		},

		next : function(n){
			this.next = n;
			return this;
		},

		play : function(){
			var fx       = this.to.x,
			    fy       = this.to.y,
			    sx       = this.to.x,
			    sy       = this.to.y,
			    text     = this.text,
			    next     = this.next,
			    duration = this.duration,
			    start    = Date.now();

	   	 	anim();
	    	function anim(){
		    	var curr = Date.now(),
		    	    pass = curr - start;

		    	if(pass < duration){
		    		var scale = pass / duration;

		    		sy = fy * scale;
		    		drawText(text, sx, sy);
		    		requestAnimationFrame(anim);
		    	}
		    	else{
		    		Link.add(text, fx, fy);
		    		drawText();
		    		if(next && next.play)
		    			next.play();
		    		else
		    			after();
		    	}
	    	}
		},
	};

	var ChainedAnimation = {
		text     : null,
		from     : null,
		to       : null,
		duration : null,

		create : function(t){
			var nca = Object.create(this);
			nca.text = t;

			return nca;
		},

		from : function(f){
			this.from = f;
			return this;
		},

		to : function(f){
			this.to = f;
			return this;
		},

		lasting : function(d){
			this.duration = d;
			return this;
		},

		play : function(){
			var numAnimations = this.text.length,
			    x_offset      = 60;
			    duration      = this.duration / numAnimations,
			    from          = this.from,
			    to            = this.to;

		    var start = undefined;
			for(var i = numAnimations - 1; i >= 0; i--){
				var na = Animation.create(this.text.charAt(i))
					.from({x : from.x + (i * x_offset), y : from.y})
					.to({x : to.x + (i * x_offset), y : to.y})
					.lasting(duration)
					.next(start);

				start = na;
			}
			start.play();
		},
	};

	var Button = {
		x  : 50,
		y  : mid_y - 80,
		w  : 530,
		h  : 100,
		c  : "rgba(0,190,112,1)",
		lx : null,
		rx : null,
		ty : null,
		by : null,

		init : function(){
			this.lx = this.x,
			this.rx = this.x + this.w,
			this.ty = this.y,
			this.by = this.y + this.h,
			console.log(this.lx, this.rx, this.ty, this.by);
		}
	};

	// begin start commence go
	Button.init();
	var textAnim = ChainedAnimation.create("Advance")
		.from({x : 0, y : 0})
		.to({x : 100, y : mid_y})
		.lasting(500)
		.play();

	function drawText(t, x, y){
		ctx.fillStyle = "rgba(0,0,0,1)";
		ctx.fillRect(0, 0, w, h);

		ctx.font = "90px Jura"
		ctx.fillStyle = "rgba(255,255,255,1)";
		ctx.fillText(t, x, y);

		Link.draw();
	}

	function drawBox(){
		ctx.fillStyle = Button.c;
		ctx.fillRect(Button.x, Button.y, Button.w, Button.h);

		ctx.font = "90px Jura"
		ctx.fillStyle = "rgba(255,255,255,1)";

		Link.draw();
	}

	function after(){
		var fa       = 1,
		    duration = 500,
		    start    = Date.now();

   	 	anim();
    	function anim(){
	    	var curr = Date.now(),
	    	    pass = curr - start;

	    	if(pass < duration){
	    		var scale = pass / duration;

	    		Button.c = "rgba(0,190,112," + fa * scale + ")";
	    		drawBox();
	    		requestAnimationFrame(anim);
	    	}
	    	else{
	    		Button.c = "rgba(0,190,112,1)";
	    		drawBox();
	    		the_after_the_first_after();
	    	}
    	}
	}

	function the_after_the_first_after(){
		document.addEventListener("click", function(e){
			var x = e.clientX,
			    y = e.clientY;

			if(inButton(x, y))
				window.location = "./about.html";
		});

		document.addEventListener("touchstart", function(e){
			var x = e.changedTouches[0].pageX,
			    y = e.changedTouches[0].pageY;

			if(inButton(x, y))
				window.location = "./about.html";
		});

		document.addEventListener("mousemove", function(e){
			var x = e.clientX,
			    y = e.clientY;

			if(inButton(x, y)){
				Button.c = "rgba(73,109,137,1)";
				document.body.style.cursor = 'pointer';
				drawBox();
			}
			else{
				Button.c = "rgba(0,190,112,1)";
				document.body.style.cursor = 'default';
				drawBox();
			}

		});
	}

	function inButton(x, y){
		return inRange(x, Button.lx, Button.rx) && 
		       inRange(y, Button.ty, Button.by);
	}

	function inRange(value, min, max) {
		return value >= Math.min(min, max) && value <= Math.max(min, max);
	}

}
