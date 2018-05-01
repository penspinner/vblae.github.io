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
	var container = document.getElementById("planets-container"),
			cnvs      = document.getElementById("planets-canvas"),
			ctx       = cnvs.getContext("2d"),

			// canvas width & height
      w = container.clientWidth,
      h = 600,

      // canvas context translations
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

	GlobalContext.setRelativeTo(cnvs, tx, ty);
	document.addEventListener("scroll", GlobalContext.onScroll);
	
	var environment = Environment.create();
	// example set up
	var _sun = Planet.create(0, 0, 100, 50, 100000, "yellow");
	var p2 = Planet.create(-200, 0, 100, 10, 100, "cyan");
	var p3 = Planet.create(400, 0, 100, 20, 200, "rgba(34,176,123,1)");
	p2.setSpeed(16);
	p2.setDirection(90);
	p3.setSpeed(14);
	p3.setDirection(-90);

	environment.addPlanet(_sun);
	environment.addPlanet(p2);
	environment.addPlanet(p3);

	var physics = false,
			drawPlaceHolder = false;

	var placeHolder = {
		x : 0, 
		y : 0,
		r : 50,
		c : "grey",
	};
	var colors = [
		"#FF4E4E","#FF8F2C", "#F0F70D", "#2FF917", "#6CFF7A", "#1DEAFA", "#00B2FF", "#A298FF",
		"#FC57FF", "#0DDAAC"
	];

	var menu = DropDown.create(-tx, -ty, 200, 30, "Menu")
			.addOption("create planet", function(){})
			.addOption("create random planet", function(){
				var x = Utils.randomInt(-tx, tx) / GlobalContext.scale + GlobalContext.offx,
						y = Utils.randomInt(-ty, ty) / GlobalContext.scale + GlobalContext.offy,
						r = Utils.randomInt(10, 100),
						m = Utils.randomInt(100, 10000),
						c = colors[Utils.randomInt(0, colors.length -1)];
				environment.addPlanet(Planet.create(x, y, 1, r, m, c));
			})
			.addOption("toggle details", function(){
				environment.showInfo = ! environment.showInfo;
			})
			.addOption("clear all", function(){
				environment.planets = [];
			});

	var editor = PlanetEditor.create(tx - 300, -ty, 300, 30)
			.addSlider("Speed", 0, 10, 0)
			.addSlider("Angle", 0, 360, 0)
			.addSlider("Mass", 10, 10000, 0)
			.addSlider("Radius",10, 100, 10)
			.addButton("Cancel")
			.addButton("Create");
	editor.hide = true;

	var playButton = Button.create(-tx + 20, ty - 100, 100, 30, "play");
	playButton.alt = "pause";
	playButton.action = function(){
		physics = !physics;
	};

	var scaleSlider = Slider.create(-tx + 20, ty - 20, 300, "Scale");
	scaleSlider.setValueRange(Range.create(0.1, 1));
	scaleSlider.setControledValue(GlobalContext, "scale");


	var startingControl = ControlContext.create();
	startingControl.onMouseMove = function(x, y){
		if(startingControl.mouseDown && startingControl.selectedItem && startingControl.selectedItem.onMouseDrag){
			startingControl.selectedItem.onMouseDrag(x, y);
			return;
		}
		
		environment.onMouseMove(x, y);
		scaleSlider.onMouseMove(x, y);
		playButton.onMouseMove(x, y);
		menu.onMouseMove(x, y);
		// editor.onMouseMove(x, y);
	};

	startingControl.onMouseDown = function(x, y){
		startingControl.selectedItem = menu.onMouseDown(x, y);
		if(playButton.onMouseDown(x, y)) return;
		// if(!startingControl.selectedItem)
		// 	startingControl.selectedItem = editor.onMouseDown(x, y);

		if(!startingControl.selectedItem)
			startingControl.selectedItem = scaleSlider.onMouseDown(x, y);

		if(!startingControl.selectedItem)
			startingControl.selectedItem = environment.onMouseDown(x, y);


		startingControl.mouseDown = true;
	};

	startingControl.onMouseUp = function(x, y){
		
		environment.onMouseUp(x, y);
		scaleSlider.onMouseUp(x, y);
		menu.onMouseUp(x, y);
		// editor.onMouseUp(x, y);

		startingControl.mouseDown = false;
		startingControl.selectedItem = undefined;
		document.body.style.cursor = 'default';
	};

	var editingControl = ControlContext.create();
	editingControl.onMouseMove = function(x, y){
		
		if(drawPlaceHolder){
			placeHolder.x = x;
			placeHolder.y = y;
			return;
		}
		
		if(editingControl.selectedItem && editingControl.selectedItem.onMouseDrag)
			editingControl.selectedItem.onMouseDrag(x, y);

		editor.onMouseMove(x, y);
		scaleSlider.onMouseMove(x, y);
		playButton.onMouseMove(x, y);

	};

	editingControl.onMouseDown = function(x, y){
		editingControl.mouseDown = true;
		if(drawPlaceHolder){
			var scale = GlobalContext.scale,
					offx = GlobalContext.offx,
					offy = GlobalContext.offy;

			editor.planet = Planet.create(x / scale + offx, y / scale + offy, 0, 10, 0, colors[Utils.randomInt(0 , colors.length - 1)]);
			editor.editPlanet(editor.planet);
			drawPlaceHolder = false;
		}else{
			if(playButton.onMouseDown(x, y)) return;

			if(!editingControl.selectedItem)
				editingControl.selectedItem = editor.onMouseDown(x, y);

			if(!editingControl.selectedItem)
				editingControl.selectedItem = scaleSlider.onMouseDown(x, y);

			if(!editingControl.selectedItem)
				editingControl.selectedItem = environment;

		}
	};

	editingControl.onMouseUp = function(x, y){
		editor.onMouseUp(x, y);
		scaleSlider.onMouseUp(x, y);
		environment.dragging = false;
		editingControl.mouseDown = false;
		editingControl.selectedItem = undefined;
		document.body.style.cursor = 'default';
	};

	menu.mapFunction("create planet", function(){
		EventDispatcher.setControlContext(editingControl);
		editor.hide = false;
		menu.disabled = true;
		drawPlaceHolder = true;
		placeHolder.x = GlobalContext.mousex;
		placeHolder.y = GlobalContext.mousey;
	});

	editor.mapFunction("Cancel", function(){
		EventDispatcher.setControlContext(startingControl);
		editor.reset();
		editor.hide = true;
		editor.planet = undefined;
		menu.disabled = false;
	});

	editor.mapFunction("Create", function(){
		EventDispatcher.setControlContext(startingControl);
		editor.applyChanges();
		editor.hide = true;
		environment.addPlanet(editor.planet);
		editor.planet = undefined;
		menu.disabled = false;
	});

	EventDispatcher.setControlContext(startingControl);
	document.addEventListener("mousemove", EventDispatcher.onMouseMove);
	document.addEventListener("mouseup", EventDispatcher.onMouseUp);
	document.addEventListener("mousedown", EventDispatcher.onMouseDown);

	draw();
	function draw() {
		ctx.fillRect(-tx, -ty, w, h);
		ctx.save();

		if(drawPlaceHolder){
			ctx.beginPath();
			ctx.fillStyle = placeHolder.c;
			ctx.arc(placeHolder.x, placeHolder.y, placeHolder.r, 0, Math.PI * 2, false);
			ctx.fill();
		}
		
		if(physics)
			environment.update();

		environment.project(ctx);
		scaleSlider.draw(ctx);
		playButton.draw(ctx);
		editor.draw(ctx);
		menu.draw(ctx);

		ctx.restore();
		requestAnimationFrame(draw);
	}
}

var GlobalContext = {
	mx            : 0,
	my            : 0,
	tx            : 0,
	ty            : 0,
	offx          : 0,
	offy          : 0,
	scale         : 0.5,
	bounds        : null,
	scrollOffsets : null,
	screenOffsets : null,

	setRelativeTo : function(cnvs, tx, ty){
		this.tx = tx || 0;
		this.ty = ty || 0;
		this.bounds = BoundingBox.create(-tx, tx, -ty, ty);
		this.scrollOffsets = this.getScrollOffSets();
		this.screenOffsets = this.getScreenOffsets(cnvs);
	},

	getRelativePosition : function(x, y){
		return {
			x: x - this.screenOffsets.x - this.tx + this.scrollOffsets.x,
			y: y - this.screenOffsets.y - this.ty + this.scrollOffsets.y
		};
	},

	getScreenOffsets : function(el) {
	var bounds = el.getBoundingClientRect();

		return {
			x : bounds.left + window.scrollX, 
			y : bounds.top  + window.scrollY
		};
	},

	getScrollOffSets : function(){
		return {
			x : (window.pageXOffset !== undefined) 
			? window.pageXOffset : (document.documentElement || document.body.parentNode
			|| document.body).scrollLeft,

			y : (window.pageYOffset !== undefined) 
			? window.pageYOffset : (document.documentElement || document.body.parentNode
			|| document.body).scrollTop
		};
	},

	onScroll : function(){
		GlobalContext.scrollOffsets = GlobalContext.getScrollOffSets();
	}
};

var ControlContext = {
	mouseDown    : false,
	selectedItem : undefined,

	create : function(){
		return Object.create(this);
	},

	onMouseMove : function(x, y){
		console.log("default action for mouse move");
	},

	onMouseUp : function(x, y){
		console.log("default action for mouse up");
	},

	onMouseDown : function(x, y){
		console.log("default action for mouse down");
	}
};

var EventDispatcher = {
	controllingContext : undefined,

	setControlContext : function(controllingContext){
		EventDispatcher.controllingContext = controllingContext
	},

	onMouseUp : function(event){
		var {x, y} = GlobalContext.getRelativePosition(event.clientX, event.clientY);
		EventDispatcher.controllingContext.onMouseUp(x, y);
	},

	onMouseDown : function(event){
		var {x, y} = GlobalContext.getRelativePosition(event.clientX, event.clientY);

		EventDispatcher.controllingContext.onMouseDown(x, y);
	},

	onMouseMove : function(event){
		var {x, y} = GlobalContext.getRelativePosition(event.clientX, event.clientY);
		GlobalContext.mx = x;
		GlobalContext.my = y;
		EventDispatcher.controllingContext.onMouseMove(x, y);
	}
};

var Planet = {
	x      : 0,
	y      : 0,
	dx     : 0,
	dy     : 0,
	mass   : 0,
	radius : 10,
	color  : null,
	hover  : false,

	create: function(x, y, z, radius, mass, color){
		var obj = Object.create(this);
		obj.x = x;
		obj.y = y;
		obj.z = z;
		obj.radius = radius;
		obj.mass = mass;
		obj.color = color || "rgba(255,255,255,1)"

		return obj;
	},

	draw: function(ctx){
		ctx.beginPath();
		ctx.fillStyle = "rgba(255,255,255,1)";
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI  * 2, false);
		ctx.fill();

		if(this.hover)
			this.drawHover(ctx);
	},

	drawHover : function(ctx){
		ctx.beginPath();
		ctx.strokeStyle = this.color;
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI  * 2, false);
		ctx.stroke();
	},

	project: function(ctx, showInfo){
		var scale = GlobalContext.scale,
				offx = GlobalContext.offx || 0,
				offy = GlobalContext.offy || 0;

		var sx = scale * (this.x - offx),
 				sy = scale * (this.y - offy),
 				sr = scale * this.radius;

		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(sx, sy, sr, 0, Math.PI  * 2, false);
		ctx.fill();

		if(this.hover){
			ctx.beginPath();
			ctx.strokeStyle = "rgba(155,155,155,1)";
			ctx.lineWidth = 5;
			ctx.arc(sx, sy, sr, 0, Math.PI  * 2, false);
			ctx.stroke();
			this.drawInfo(ctx, sx, sy, sr);
		}
		else if(showInfo){
			this.drawInfo(ctx, sx, sy, sr);
		}
	},

	drawInfo: function(ctx, x, y, r){
		var info;
		ctx.fillStyle = this.color;
		ctx.font = "16px Jura";
		info = "Speed: " + this.getSpeed().toFixed(3) + " Direction: " + Utils.radsToDegrees(this.getDirection()).toFixed(3);
		ctx.fillText(info, x + r + 5, y);
		info = "Mass: " + this.mass.toFixed(2) + " Radius: " + this.radius.toFixed(2);
		ctx.fillText(info, x + r + 5, y + 20);

		var length = this.getSpeed();
		if(length != 0)
			length += 10;

		var endx = x + length * Math.cos(this.getDirection()),
				endy = y + length * Math.sin(this.getDirection());

		ctx.beginPath()
		ctx.strokeStyle = "red";
		ctx.lineWidth = 3;
		ctx.moveTo(x, y);
		ctx.lineTo(endx, endy);
		ctx.stroke();
		ctx.lineWidth = 1;
	},

	collidingWithPoint: function(x, y){
		return Utils.pointInCircle(x, y, this.getScaledModel());
	},

	update: function() {
		this.x += this.dx;
		this.y += this.dy;
	},

	accelerate: function(ax, ay) {
		this.dx += ax;
		this.dy += ay;
	},

	angleTo: function(p) {
		return Math.atan2(p.y - this.y, p.x - this.x);
	},

	distanceTo: function(p) {
		var dx = p.x - this.x,
				dy = p.y - this.y;

		return Math.sqrt(dx * dx + dy * dy);
	},

	gravitateTo: function(p) {
		var dx = p.x - this.x,
				dy = p.y - this.y,
				dist = dx * dx + dy * dy,
				raw_dist = Math.sqrt(dist),
				force = p.mass / dist,
				ax = dx / raw_dist * force,
				ay = dy / raw_dist * force;

		this.dx += ax;
		this.dy += ay;
	},

	getSpeed: function() {
		return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
	},

	setSpeed: function(speed) {
		var direction = this.getDirection();
		this.dx = Math.cos(direction) * speed;
		this.dy = Math.sin(direction) * speed;
	},

	getDirection: function() {
		return Math.atan2(this.dy, this.dx);
	},

	setDirection: function(direction) {
		direction = Utils.degreesToRads(direction);
		var speed = this.getSpeed();
		this.dx = Math.cos(direction) * speed;
		this.dy = Math.sin(direction) * speed;
	},

	getScaledModel : function(){
		var sx = (this.x - GlobalContext.offx) * GlobalContext.scale,
				sy = (this.y - GlobalContext.offy) * GlobalContext.scale,
				sr = this.radius * GlobalContext.scale;

		return {
			x      : sx,
			y      : sy,
			radius : sr,
		};
	},

	onMouseDown : function(x, y){
		if(Utils.pointInCircle(x, y, this.getScaledModel()))
			return this;
	},

	onMouseUp : function(x, y){
		if(Utils.pointInCircle(x, y, this.getScaledModel()))
			return this;
	},

	onMouseDrag : function(x, y){
		this.x = x / GlobalContext.scale + GlobalContext.offx;
		this.y = y / GlobalContext.scale + GlobalContext.offy;
	},

	onMouseMove : function(x, y){
		if(Utils.pointInCircle(x, y, this.getScaledModel()))
			return this.onMouseEnter();
		else
			return this.onMouseExit();
	},

	onMouseEnter : function(){
		return this.hover = true;
	},

	onMouseExit : function(){
		return this.hover = false;
	}

};

var Environment = {
	width    : 0,
	height   : 0,
	drag_x   : 0,
	drag_y   : 0,
	planets  : null,
	context  : null,
	dragging : false,
	showInfo : false,

	create: function(w, h, p, c){
		var obj = Object.create(this);
		obj.width = w;
		obj.height = h;
		obj.planets = p || new Array();
		obj.context = c || null;
		return obj;
	},

	addPlanet: function(newPlanet){
		this.planets.push(newPlanet);
	},

	update : function(){
		for(var i = 0; i < this.planets.length ; i++){
			var currPlanet = this.planets[i];

			for(var j = 0; j < this.planets.length; j++){
				if(i != j)
					currPlanet.gravitateTo(this.planets[j]);
			}
				currPlanet.update();
		}
	},

	draw: function(ctx){
		for (var i = this.planets.length - 1; i >= 0; i--) {
			var currPlanet = this.planets[i];
			currPlanet.draw(ctx);
		}
	},

	project: function(ctx, fl){
		for (var i = this.planets.length - 1; i >= 0; i--) {
			var currPlanet = this.planets[i];
			currPlanet.project(ctx, this.showInfo);
		}
	},

	drawInfo: function(ctx){
		for (var i = this.planets.length - 1; i >= 0; i--) {
			var currPlanet = this.planets[i];
			currPlanet.drawInfo(ctx);
		}
	},

	translate : function(tx, ty){
		this.planets.forEach(function(planet){
			planet.x -= tx;
			planet.y -= ty;
		});
	},

	onMouseDown : function(x, y){
		var selectedPlanet = this.planets.find(function(planet){
			return planet.onMouseDown(x, y);
		});

		if(selectedPlanet)
			return selectedPlanet;

		return this;
	},

	onMouseUp : function(x, y){
		if(this.dragging){
			this.drag_x = 0;
			this.drag_y = 0;
			this.dragging = false;
		}
	},

	onMouseMove : function(x, y){
		var mouseIsOver = false;
		this.planets.forEach(function(planet){
			if(!mouseIsOver)
			 mouseIsOver = planet.onMouseMove(x, y);
			else
				planet.onMouseExit();
		});
	},

	onMouseDrag : function(x, y){
		if(!this.dragging){
			this.drag_x = x;
			this.drag_y = y;
			this.dragging = true;
			document.body.style.cursor = 'move';
			return;
		}

		var offx = Math.floor((this.drag_x - x) / GlobalContext.scale),
				offy = Math.floor((this.drag_y - y) / GlobalContext.scale);

		// this.translate(offx, offy);
		GlobalContext.offx += offx;
		GlobalContext.offy += offy;
		this.drag_x = x;
		this.drag_y = y;
	},
};

var PlanetEditor = {
	x           : 0,
	y           : 0,
	w           : 0,
	h           : 0,
	drag_x      : 0,
	drag_y      : 0,
	offset      : 60,
	spacing     : 50,
	sliders     : null,
	buttons     : null,
	color       : null,
	bounds      : null,
	callMap     : null,
	show        : true,
	selected    : false,
	hide        : false,
	planet      : undefined,

	create : function(x, y, w, h){
		var newEditor = Object.create(this);

		newEditor.x       = x;
		newEditor.y       = y;
		newEditor.w       = w;
		newEditor.h       = h;
		newEditor.color   = "rgba(0,190,112,.6)";
		newEditor.sliders = [];
		newEditor.buttons = [];
		newEditor.callMap = {};
		newEditor.bounds  = BoundingBox.create(x, x + w, y, y + h);

		return newEditor;
	},

	addSlider : function(text, minValue, maxValue, defaultValue){
		var numSliders = this.sliders.length,
				x = this.x + 20,
				y = this.y + this.offset + (numSliders * this.spacing),
				w = this.w - 52;

		var newSlider = Slider.create(x, y, w, text);
		newSlider.setValueRange(Range.create(minValue, maxValue));

		if(defaultValue >= 0){
			newSlider.setValue(defaultValue);
		}
		
		this.sliders.push(newSlider);
		return this;
	},

	editPlanet : function(planet){
		this.sliders[0].setControledValue(planet, "setSpeed");
		this.sliders[1].setControledValue(planet, "setDirection");
		this.sliders[2].setControledValue(planet, "mass");
		this.sliders[3].setControledValue(planet, "radius");
		planet.hover = true;
	},

	applyChanges : function(){
		this.planet.setSpeed(this.sliders[0].value);
		this.planet.setDirection(this.sliders[1].value);
		this.planet.mass = this.sliders[2].value;
		this.planet.radius = this.sliders[3].value;
		this.planet.hover = false;

		this.reset();
	},

	reset : function(){
		this.sliders[0].setValue(0);
		this.sliders[1].setValue(0);
		this.sliders[2].setValue(0);
		this.sliders[3].setValue(10);

		this.buttons.forEach(function(button){
			button.onMouseExit();
		});
	},

	draw : function(ctx){
		if(this.hide)
			return;

		if(this.planet)
			this.planet.project(ctx);

		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.w, this.h);

		ctx.font = "20px Jura";
		ctx.fillStyle = "rgba(255,255,255,1)";
		ctx.fillText("Planet Editor", this.x + 20, this.y + 20);

		if(this.show)
			this.drawDropDown(ctx);
	},

	drawDropDown : function(ctx){
		ctx.fillStyle = "rgba(51,51,51,.7)";
		ctx.fillRect(this.x, this.y + 30, this.w, 250);
		
		for (var i = 0; i < this.sliders.length; i++) {
			this.sliders[i].draw(ctx);
		}

		for (var i = 0; i < this.buttons.length; i++) {
			this.buttons[i].draw(ctx);
		}
	},

	addButton : function(text, callBack){
		var numButtons = this.buttons.length,
				x = this.x + 20 + (numButtons * 120),
				y = this.y + ((this.sliders.length + 1) * this.spacing) - 10,
				w = 100,
				h = 30;

		var newButton = Button.create(x, y, w, h, text);

		this.callMap[text] = callBack;

		this.buttons.push(newButton);
		return this;
	},

	mapFunction : function(buttonName, callBack){
			this.callMap[buttonName] = callBack;
	},
	// shameful code ahead
	// nothing can be more lasily done than this
	makeSuperHardCodedButtons: function(){
		var button1 = Button.create(this.x + 20, this.y + (5 * this.spacing) - 10, 100, 30, "Cancel"),
				button2 = Button.create(this.x + 140, this.y + (5 * this.spacing) - 10, 100, 30, "Create");

		this.buttons.push(button1, button2);
		return this;
	},

	snapTo : function(bounds){
		if(this.x <= bounds.lx || Math.abs(this.x - bounds.lx) < 10)
			this.x = bounds.lx;
		else if(this.x + this.w >= bounds.rx || Math.abs(this.x + this.w - bounds.rx) < 10)
			this.x = bounds.rx - this.w;

		if(this.y <= bounds.ty || Math.abs(this.y - bounds.ty) < 10)
			this.y = bounds.ty;
		else if(this.y + this.h >= bounds.by || Math.abs(this.y + this.h - bounds.by) < 10)
			this.y = bounds.by - this.h;
	},

	onMouseDown : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			return this;

		var selected = this.sliders.find(function(slider){
			return slider.onMouseDown(x, y);
		});

		if(!selected)
			selected = this.planet.onMouseDown(x, y);

		return selected;
	},

	onMouseUp : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds) && !this.selected)
			this.show = !this.show;

		if(this.show){
			for (var i = 0; i < this.sliders.length; i++)
				this.sliders[i].onMouseUp(x, y);
			
			var button = this.buttons.find(function(button){
				return button.onMouseUp(x, y);
			});

			if(button && this.callMap[button.text])
				this.callMap[button.text]();
		}

			this.drag_x = 0;
			this.drag_y = 0;
			this.selected = false;
	},

	onMouseDrag : function(x, y){
		if(!this.selected){
			this.drag_x = this.x - x;
			this.drag_y = this.y - y;
			this.selected = true;
		}

		this.x = x + this.drag_x;
		this.y = y + this.drag_y;
		this.snapTo(GlobalContext.bounds);
		this.bounds = BoundingBox.create(this.x, this.x + this.w, this.y, this.y + this.h);

		for (var i = 0; i < this.sliders.length; i++) {
			var slider = this.sliders[i],
					xdif = slider.sx - slider.x,
					ydif = slider.sy - slider.y;

			slider.x = this.x + 20;
			slider.y = this.y + this.offset + (i * this.spacing);
			slider.sx = slider.x + xdif;
			slider.sy = slider.y + ydif;

			var lx = slider.sx,
					rx = lx + slider.sw,
					ty = slider.sy,
					by = ty + slider.sh;

			slider.bounds = BoundingBox.create(lx, rx, ty, by);
			slider.slideRange = Range.create(slider.x, slider.x + slider.w);
		}

		for (var i = 0; i < this.buttons.length; i++){
			var button = this.buttons[i];
			button.x = this.x + 20 + (i * 120);
			button.y = this.y + (5 * this.spacing) - 10;

			var lx = button.x,
					rx = lx + button.w,
					ty = button.y,
					by = ty + button.h;

			button.bounds = BoundingBox.create(lx, rx, ty, by);
		}
	},

	onMouseMove : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			this.onMouseEnter();
		else
			this.onMouseExit();

		if(this.show){
			for (var i = 0; i < this.sliders.length; i++)
				this.sliders[i].onMouseMove(x, y);

			for (var i = 0; i < this.buttons.length; i++)
				this.buttons[i].onMouseMove(x, y);
		}
	},

	onMouseEnter : function(){
		this.color = "rgba(73,109,137,.6)";
	},

	onMouseExit : function(){
		this.color = "rgba(0,190,112,.6)";
	},
};

var Button = {
	x      : 0,
	y      : 0,
	w      : 0,
	h      : 0,
	color  : null,
	text   : null,
	bounds : null,
	alt    : undefined,

	create : function(x, y, w, h, t){
		var newButton = Object.create(this);

		newButton.x     = x;
		newButton.y     = y;
		newButton.w     = w;
		newButton.h     = h;
		newButton.text  = t;
		newButton.color = "rgba(0,190,112,.6)";

		var lx = x;
				rx = x + w;
				ty = y,
				by = y + h;

		newButton.bounds = BoundingBox.create(lx, rx, ty, by);
		return newButton;
	},

	draw : function(ctx){
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.w, this.h);

		ctx.font = "20px Jura";
		ctx.fillStyle = "rgba(255,255,255,1)";
		ctx.fillText(this.text, this.x + 20, this.y + 20);
	},

	action : function(){
		console.log("default action");
	},

	onMouseDown : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds)){
			var temp = this.text;
			this.text = this.alt;
			this.alt = temp;
			this.action();
			return true;
		}
	},

	onMouseUp : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			return this;
	},

	onMouseMove : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			this.onMouseEnter();
		else
			this.onMouseExit();
	},

	onMouseEnter : function(){
		this.color = "rgba(73,109,137,.6)";
	},

	onMouseExit : function(){
		this.color = "rgba(0,190,112,.6)";
	},

};

var Slider = {
	x          : 0,
	y          : 0,
	w          : 0,
	sx         : 0,
	sy         : 0,
	sw         : 0,
	sh         : 0,
	value      : 0,
	color      : null,
	bounds     : null,
	text       : null,
	slideRange : null,
	valueRange : null,
	controled  : null,
	property   : null,
	selected   : false,

	create : function(x, y, w, text){
		var newSlider = Object.create(this);

		newSlider.x          = x;
		newSlider.y          = y;
		newSlider.w          = w;
		newSlider.sx         = Math.floor(x + (w / 2));
		newSlider.sy         = y;
		newSlider.sw         = 15;
		newSlider.sh         = 15;
		newSlider.text       = text;
		newSlider.color      = "rgba(0,190,112,1)";
		newSlider.slideRange = Range.create(x + 2, x + w - 2);
		newSlider.valueRange = Range.create(0, 1);

		var sr = newSlider.slideRange,
				vr = newSlider.valueRange;

		newSlider.value = Utils.map(newSlider.sx, sr.min, sr.max, vr.min, vr.max);

		var lx = newSlider.sx,
				rx = lx + newSlider.sw,
				ty = newSlider.sy,
				by = ty + newSlider.sh;

		newSlider.bounds = BoundingBox.create(lx, rx, ty, by);

		return newSlider;
	},

	setValueRange : function(valueRange){
		this.valueRange = valueRange;

		var sr = this.slideRange,
				vr = this.valueRange;

		this.value = Utils.map(this.sx, sr.min, sr.max, vr.min, vr.max);

	},

	setValue : function(value){
		var sr = this.slideRange,
				vr = this.valueRange;
		
		this.value = Utils.clampToRange(value, vr);
		this.sx = Utils.map(this.value, vr.min, vr.max, sr.min, sr.max);

		var lx = this.sx,
				rx = lx + this.sw,
				ty = this.sy,
				by = ty + this.sh;

		this.bounds = BoundingBox.create(lx, rx, ty, by);
	},

	setControledValue : function(obj, prop){
		this.controled = obj;
		this.property = prop;
	},

	draw : function(ctx){
		ctx.strokeStyle = "rgba(255,255,255,1)";
		ctx.beginPath();
		ctx.moveTo(this.x, this.y + 7);
		ctx.lineTo(this.x + this.w + this.sw, this.y + 7);
		ctx.stroke();

		ctx.fillStyle = this.color;
		ctx.fillRect(this.sx, this.sy, this.sw, this.sh);

		ctx.font = "16px Jura";
		ctx.fillStyle = "rgba(255,255,255,1)";
		ctx.fillText(this.text + ": " + this.value.toFixed(2), this.x, this.y - 10);
	},

	onMouseDrag : function(x, y){
		if(!this.selected){
			this.selected = true;
		}
		
		this.sx = Utils.clampToRange(x, this.slideRange);
		var lx = this.sx,
				rx = lx + this.sw,
				ty = this.sy,
				by = ty + this.sh;

		var sr = this.slideRange,
				vr = this.valueRange;

		this.value = Utils.map(this.sx, sr.min, sr.max, vr.min, vr.max);

		if(this.controled && this.property)
			if(typeof this.controled[this.property] == 'function')
				this.controled[this.property](this.value);
			else
				this.controled[this.property] = this.value;

		this.bounds = BoundingBox.create(lx, rx, ty, by);
	},

	onMouseMove : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			this.onMouseEnter();
		else
			this.onMouseExit();
	},

	onMouseDown : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			return this;
	},

	onMouseUp : function(x, y){
		this.selected = false;
	},

	onMouseEnter : function(){
		this.color = "rgba(73,109,137,1)";
	},

	onMouseExit : function(){
		if(!this.selected){
			this.color = "rgba(0,190,112,1)";
		}
	},
};

var MenuOption = {
	x      : 0,
	y      : 0,
	w      : 0,
	h      : 0,
	text   : null,
	bounds : null,
	hover  : false,

	create : function(x, y, w, h, text){
		var newOption = Object.create(this);

		newOption.x      = x;
		newOption.y      = y;
		newOption.w      = w;
		newOption.h      = h;
		newOption.text   = text;
		newOption.bounds = BoundingBox.create(x, x + w, y, y + h);

		return newOption;
	},

	draw : function(ctx){
		if(this.hover)
			this.drawBounds(ctx);

		ctx.font = "16px Jura";
		ctx.fillStyle = "rgba(255,255,255,1)";
		ctx.fillText(this.text, this.x + 20, this.y + 20);
	},

	drawBounds : function(ctx){
		ctx.fillStyle = "rgba(80,80,80,1)";
		ctx.fillRect(this.x, this.y, this.w, this.h);
	},

	onMouseDown : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			return true;
	},

	onMouseMove : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			this.onMouseEnter();
		else
			this.onMouseExit();
	},

	onMouseEnter : function(){
		this.hover = true;
	},

	onMouseExit : function(){
		this.hover = false;
	},
};

var DropDown = {
	x        : 0,
	y        : 0,
	w        : 0,
	h        : 0,
	drop_x   : 0,
	drop_y   : 0,
	drop_w   : 0,
	drop_h   : 0,
	drag_x   : 0,
	drag_y   : 0,
	bounds   : null,
	title    : null,
	options  : null,
	callMap  : null,
	color    : null,
	disabled : false,
	show     : false,
	hide     : false,
	hover    : false,
	selected : false,

	create : function(x, y, w, h, title){
		var newDropDown = Object.create(this);

		newDropDown.x       = x;
		newDropDown.y       = y;
		newDropDown.w       = w;
		newDropDown.h       = h;

		newDropDown.drop_x  = x;
		newDropDown.drop_y  = y + h;
		newDropDown.drop_w  = w;

		newDropDown.title   = title;
		newDropDown.options = [];
		newDropDown.callMap = {};
		newDropDown.bounds  = BoundingBox.create(x, x + w, y, y + h);
		newDropDown.color   = "rgba(0,190,112,.6)";

		return newDropDown;
	},

	draw : function(ctx){
		ctx.fillStyle = !this.disabled ? this.color : "rgba(51,51,51,.7)";
		ctx.fillRect(this.x, this.y, this.w, this.h);

		ctx.font = "20px Jura"
		ctx.fillStyle = "rgba(255,255,255,1)";
		ctx.fillText(this.title, this.x + 20, this.y + 20);

		if(this.show)
			this.drawDropDown(ctx);

		// this.drawBounds(ctx);
	},

	drawDropDown : function(ctx){
		ctx.fillStyle = "rgba(51,51,51,.7)";
		ctx.fillRect(this.drop_x, this.drop_y, this.drop_w, this.drop_h);

		this.options.forEach(function(option){
			option.draw(ctx);
		});
	},

	drawBounds : function(ctx){
		ctx.strokeStyle = "rgba(255,255,255,1)";
		ctx.strokeRect(this.bounds.lx, this.bounds.ty, this.w, this.h);
	},

	addOption : function(optionName, callBack){
		var numOptions = this.options.length + 1,
			w = this.w,
			h = this.h,
			x = this.x,	
			y = this.y + (h * numOptions);

		this.options.push(MenuOption.create(x, y, w, h, optionName));
		this.drop_h = y - this.y;

		this.callMap[optionName] = callBack;
		return this;
	},

	mapFunction : function(optionName, callBack){
		this.callMap[optionName] = callBack;
	},

	snapTo : function(bounds){
		if(this.x <= bounds.lx || Math.abs(this.x - bounds.lx) < 10)
			this.x = bounds.lx;
		else if(this.x + this.w >= bounds.rx || Math.abs(this.x + this.w - bounds.rx) < 10)
			this.x = bounds.rx - this.w;

		if(this.y <= bounds.ty || Math.abs(this.y - bounds.ty) < 10)
			this.y = bounds.ty;
		else if(this.y + this.h >= bounds.by || Math.abs(this.y + this.h - bounds.by) < 10)
			this.y = bounds.by - this.h;
	},

	onMouseDown : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds))
			return this;
	},

	onMouseUp : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds) && !this.selected)
			this.show = !this.show;
		
		if(this.show){
			var takeAction = this.options.find(function(option){
				return option.onMouseDown(x, y);
			});

			if(takeAction){
				this.show = false;

			if(this.callMap[takeAction.text])
				this.callMap[takeAction.text]();
			}
		}

		this.drag_x = 0;
		this.drag_y = 0;
		this.selected = false;
	},

	onMouseDrag : function(x, y){
		if(!this.selected){
			this.drag_x = this.x - x;
			this.drag_y = this.y - y;
			this.selected = true;
		}

		this.x = x + this.drag_x;
		this.y = y + this.drag_y;
		this.snapTo(GlobalContext.bounds);
		this.bounds = BoundingBox.create(this.x, this.x + this.w, this.y, this.y + this.h);
		
		var option;
		for (var i = 0; i < this.options.length; i++) {
			option = this.options[i];
			option.x = this.x;
			option.y = this.y + (this.h * (i + 1));
			option.bounds = BoundingBox.create(option.x, option.x + option.w, option.y, option.y + option.h);
		}

		this.drop_x = this.x;
		this.drop_y = this.y + this.h;
 		this.drop_h = this.options.length * this.h;
	},

	onMouseMove : function(x, y){
		if(Utils.pointInBounds(x, y, this.bounds)){
			this.onMouseEnter();
		}
		else{
			this.onMouseExit();
		}
		
		if(this.show)
			this.options.forEach(function(option){
				option.onMouseMove(x, y);
			});
	},

	onMouseEnter : function(){
		this.color = "rgba(73,109,137,.6)";
	},

	onMouseExit : function(){
		this.color = "rgba(0,190,112,.6)";
	},
};

var Range = {
	min : 0,
	max : 0,

	create : function(min, max){
		var newRange = Object.create(this);

		newRange.min = min;
		newRange.max = max;

		return newRange;
	}
};

var BoundingBox = {
	lx : 0,
	rx : 0,
	ty : 0,
	by : 0,

	create : function(lx, rx, ty, by){
		var newBoundingBox = Object.create(this);

		newBoundingBox.lx = lx;
		newBoundingBox.rx = rx;
		newBoundingBox.ty = ty;
		newBoundingBox.by = by;

		return newBoundingBox;
	}
};

var Utils = {
	norm: function(value, min, max) {
		return (value - min) / (max - min);
	},

	lerp: function(norm, min, max) {
		return (max - min) * norm + min;
	},

	map: function(value, sourceMin, sourceMax, destMin, destMax) {
		return Utils.lerp(Utils.norm(value, sourceMin, sourceMax), destMin, destMax);
	},

	distanceXY: function(x0, y0, x1, y1) {
		var dx = x1 - x0,
		    dy = y1 - y0;
		return Math.sqrt(dx * dx + dy * dy);
	},

	pointInBounds: function(x, y, bounds) {
		return Utils.inRange(x, bounds.lx, bounds.rx) && 
		       Utils.inRange(y, bounds.ty, bounds.by);
	},

	pointInCircle : function(x, y, circle) {
		return Utils.distanceXY(x, y, circle.x, circle.y) < circle.radius;
	},

	inRange: function(value, min, max) {
		return value >= Math.min(min, max) && value <= Math.max(min, max);
	},

	clampToRange: function(value, range){
		return Math.min(Math.max(value, range.min),range.max);
	},

	randomInt: function(min, max) {
		return Math.floor(min + Math.random() * (max - min + 1));
	},

	degreesToRads: function(degrees) {
		return degrees / 180 * Math.PI;
	},

	radsToDegrees: function(radians) {
		return radians * 180 / Math.PI;
	},
};
