// get pixel ratio for device
// eliminate pesky blurry test
// from https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas 
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

// gr=spooluyaey2@i
function start() {
  var container = document.getElementById("rockets-container"),
      cnvs      = document.getElementById("rockets-canvas"),
      ctx       = cnvs.getContext("2d"),

      // canvas width & height
      w = container.clientWidth,
      h = 600,

      // canvas context translations
      tx = w / 2.0,
      ty = h / 2.0;

  cnvs.setAttribute("width"  , w * PIXEL_RATIO);
  cnvs.setAttribute("height" , h * PIXEL_RATIO);
  cnvs.style.width  = w + "px";
  cnvs.style.height = h + "px";

  ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
  ctx.translate(tx, ty);

  GlobalContext.setRelativeTo(cnvs, tx, ty);
  document.addEventListener("scroll", GlobalContext.onScroll);

  document.addEventListener("keypress"  , EventDispatcher.onKeyPress);
  document.addEventListener("keydown"   , EventDispatcher.onKeyDown);
  document.addEventListener("mousemove" , EventDispatcher.onMouseMove);
  document.addEventListener("mouseup"   , EventDispatcher.onMouseUp);
  EventDispatcher.giveFocusTo(Terminal);

  Terminal.initialize(-tx, -ty, 300, h - 30, 8, 16);
  TextEditor.initialize(tx - 500, -ty, 400, 400, 8, 16);

  var rocket = Rocket.create(0, 0, 10000, 20, 20);
  RocketController.takeControl(rocket);

  // main loop
  update();
  function update(){
    ctx.fillRect(-tx, -ty, w, h);
    ctx.save();

    RocketController.update();
    rocket.draw(ctx);
    Terminal.draw(ctx);
    TextEditor.draw(ctx);

    if(!Utils.pointInBounds(rocket.x, rocket.y, GlobalContext.bounds)){
      ctx.font = "15px Jura";
      ctx.fillStyle = "white";
      ctx.fillText("use 'reset' command to bring the rocket back", 0 - 40, ty - 20);
      ctx.fill();
    }

    ctx.restore();
    requestAnimationFrame(update)
  }
}

var Vertex = {
  x : 0,
  y : 0,
  z : 0,

  create : function(x, y, z){
    var newVertex = Object.create(this);

    newVertex.x = x;
    newVertex.y = y;
    newVertex.z = z;

    return newVertex;
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
  radsToDegrees: function(radians) {
    return radians * 180 / Math.PI;
  },

  degreesToRads: function(degrees) {
    return degrees / 180 * Math.PI;
  },

  randomRange: function(min, max) {
    return min + Math.random() * (max - min);
  },

  pointInBounds: function(x, y, bounds) {
    return Utils.inRange(x, bounds.lx, bounds.rx) && 
           Utils.inRange(y, bounds.ty, bounds.by);
  },

  inRange: function(value, min, max) {
    return value >= Math.min(min, max) && value <= Math.max(min, max);
  }
};

// nown properly named queue
var Queue = {
  head : null,
  tail : null,
  size : 0,

  create : function(){
    return Object.create(this);
  },

  push : function(obj){
    if(!this.head){
      this.head = obj;
      this.tail = obj
    }else {
      this.tail.next  = obj;
      this.tail = obj;
    }

    this.size++;
  },

  pop : function(){
    if(!this.head)
      return undefined;

    var obj = this.head;
    this.head = this.head.next;
    this.size--;
    return obj;
  },

  peek : function(){
    return this.head;
  },

  isEmpty : function(){
    return this.size == 0;
  },

  notEmpty : function(){
    return !this.isEmpty();
  }
};

var GlobalContext = {
  mx            : 0,
  my            : 0,
  tx            : 0,
  ty            : 0,
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

// ---------------------------------------------
// EventDispatcher
var EventDispatcher = {
  inFocus : null,

  giveFocusTo : function(o) {
    if(EventDispatcher.inFocus)
      EventDispatcher.inFocus.inFocus = false;

    EventDispatcher.inFocus = o;
    o.inFocus = true;

    console.log(Terminal.inFocus, TextEditor.inFocus);
  },

  onKeyPress :function(event) {
    if(EventDispatcher.inFocus)
      EventDispatcher.inFocus.onKeyPress(event);
  },

  onKeyDown : function(event) {
    if(EventDispatcher.inFocus)
      EventDispatcher.inFocus.onKeyDown(event);
  },

  onMouseUp : function(event) {
    var {x, y} = GlobalContext.getRelativePosition(event.clientX, event.clientY);
    console.log(x, y);
    if(Terminal.isMouseOver(x, y))
      EventDispatcher.giveFocusTo(Terminal);

    else if(TextEditor.visible && TextEditor.isMouseOver(x, y))
      EventDispatcher.giveFocusTo(TextEditor);
  },
};

// ---------------------------------------------
// Rocket related constructs
// Rocket, RocketModel, ModelView

var RocketController = {
  thrust : 5,
  angle  : -90,
  burn   : 300,

  burnTime  : 0,
  startTime : 0,
  burning   : false,
  finished  : true,

  rocket        : null,
  sequence      : null,
  sequenceQueue : Queue.create(),

  takeControl : function(rocket){
    this.rocket = rocket;
  },

  isMutableProperty : function(name){
    return name === "thrust" || name === "angle" || name === "burn";
  },

  set : function(name, value){
    if(this.isMutableProperty(name))
      this.setProperty(name, value)
    else
      Terminal.printString("error: unknown property '" + name + "'")
  },

  setProperty : function(name, value, suppress){
    if(!value){
      Terminal.printString("error: no value given");
      return;
    }

    value = parseFloat(value);
    if(isNaN(value)){
      Terminal.printString("error: invalid value given");
      return;
    }

    this[name] = value;

    if(!suppress)
      Terminal.printString("rocket: " + name + " set to " + value);
  },

  update : function(){
    if(this.finished && this.sequenceQueue.notEmpty())
      this.startSequence();
    else
      this.executeSequence();

    this.rocket.update();
  },

  resetRocket : function(){
    this.rocket.setPos(0, 0);
    this.rocket.setSpeed(0, 0);
    Terminal.printString("rocket: rocket was reset");
  },

  queueSequence : function(suppress) {
    if(this.sequenceQueue.isEmpty() && !suppress)
      Terminal.printString("rocket: running sequence");
    else if(!suppress)
      Terminal.printString("rocket: sequence queued");

    this.sequenceQueue.push({
      thrust : this.thrust,
      angle  : this.angle,
      burn   : this.burn,
    });
  },

  executeSequence : function() {
    if(!this.burning) return;
    
    if(Date.now() - this.startTime >= this.burnTime){
      this.finishSequence();
      return;
    }

    var angle = Utils.degreesToRads(this.sequence.angle);
    var ax = (this.sequence.thrust * Math.cos(angle)) / this.rocket.mass,
        ay = (this.sequence.thrust * Math.sin(angle)) / this.rocket.mass;                                        

    this.rocket.dx += ax;
    this.rocket.dy += ay;

    if(this.thrust > 0)
      this.rocket.model.emitter.emit();
  },

  startSequence : function(){
    this.sequence  = this.sequenceQueue.peek();
    this.setAngle();

    this.startTime = Date.now();
    this.burnTime  = this.sequence.burn;
    this.burning   = true;
    this.finished  = false;
    // console.log("sequence started");
  },

  finishSequence : function(){
    this.burning  = false;
    this.finished = true;
    this.sequnce  = undefined;
    this.sequenceQueue.pop();
    // console.log("sequence finished");
  },

  setAngle : function(){
    ModelView.translate(this.rocket.model, -this.rocket.x, -this.rocket.y);
    ModelView.rotate(this.rocket.model, this.sequence.angle - this.rocket.angle);
    ModelView.translate(this.rocket.model, this.rocket.x, this.rocket.y);
    this.rocket.angle = this.sequence.angle;
    this.rocket.model.emitter.angle = this.sequence.angle + 180;
  },
};

var Rocket = {
  x : 0,
  y : 0,
  w : 0,
  h : 0,

  dx : 0,
  dy : 0,

  mass  : 0,
  angle : -90,
  model : null,
  
  create : function(x, y, m, w, h){
    var newRocket = Object.create(this);

    newRocket.x    = x;
    newRocket.y    = y;
    newRocket.w    = w;
    newRocket.h    = h;
    newRocket.mass = m;

    newRocket.model = RocketModel.create(w, h, "rgba(255,255,255,1)");
    newRocket.model.emitter.angle = newRocket.angle + 180;
    ModelView.rotate(newRocket.model, newRocket.angle);
    ModelView.translate(newRocket.model, x, y);
    return newRocket;
  },

  update : function(){
    this.x += this.dx;
    this.y += this.dy;
    ModelView.translate(this.model, this.dx, this.dy);
  },

  setPos : function(x, y){
    this.x = x;
    this.y = y;
    this.model = RocketModel.create(this.w, this.h, "rgba(255,255,255,1)");
    this.model.emitter.angle = parseFloat(this.angle) + 180;
    ModelView.rotate(this.model, this.angle);
    ModelView.translate(this.model, x, y);
  },

  setSpeed : function(dx, dy){
    this.dx = 0;
    this.dy = 0;
  },

  getSpeed : function(){
    return Math.sqrt(this.dx * this.dx  + this.dy * this.dy);
  },

  getAngle : function(){
    return Utils.radsToDegrees(Math.atan2(this.dy ,this.dx));
  },

  draw : function(ctx){
    ModelView.draw(this.model, ctx);
  },
};

var RocketModel = {

  create : function(w, h, color){
    var hw = w / 2,
        hh = h / 2;

    return {
        w        : w,
        h        : h,
        color    : color,
        emitter  : ParticleEmitter.create(-hh, 0, 5, "rgba(230, 102, 34, 1)"),
        vertices : [
          Vertex.create(  0 ,  0),
          Vertex.create( -h , hw),
          Vertex.create(-hh ,  0),
          Vertex.create( -h ,-hw)
        ]
    };
  }
};

var ModelView = {

  draw : function(model, ctx){
    var v = model.vertices[0];

    ctx.fillStyle = model.color;
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    for(var i = 1; i < model.vertices.length + 1; i++){
      v = model.vertices[i % model.vertices.length];
      ctx.lineTo(v.x, v.y)
    }
    ctx.fill();

    model.emitter.draw(ctx);
  },

  translate : function(model, dx, dy){
    for(var i = 0; i < model.vertices.length; i++){
      var v = model.vertices[i];

      v.x += dx;
      v.y += dy;
    }

    model.emitter.x += dx;
    model.emitter.y += dy;
    model.emitter.update();
  },

  rotate : function(model, angle){
    var angle = Utils.degreesToRads(angle),
        cos   = Math.cos(angle),
        sin   = Math.sin(angle);

    var vertices = model.vertices;
    for(var i = 0; i < vertices.length; i++) {
      var v = vertices[i],
          x = v.x * cos - v.y * sin,
          y = v.y * cos + v.x * sin;

      v.x = x;
      v.y = y;
    }

    model.emitter.x = vertices[2].x;
    model.emitter.y = vertices[2].y;
  }
};

var ParticleEmitter = {
  x : 0,
  y : 0,

  speed       : 5,
  angle       : 0,
  numParicles : 0,
  particles   : [],
  color       : null,

   create : function(x, y, n, c){
    var newEmitter = Object.create(this);

    newEmitter.x           = x;
    newEmitter.y           = y;
    newEmitter.numParicles = n;
    newEmitter.color       = c;

    return newEmitter;
   },

   emit : function(){
    for(var i = 0; i < this.numParicles; i++)
      this.particles.push(this.randomParticle());
   },

   randomParticle : function(){
    return {
        x     : this.x,
        y     : this.y,
        angle : this.angle + Utils.randomRange(-30, 30),
        dist  : 0,
        maxDist : Utils.randomRange(10, 60),
      };
   },

   updateParticle : function(p, dx, dy){
    p.x += dx;
    p.y += dy;
   },

   update : function(){
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];

      var angle = Utils.degreesToRads(p.angle)
      var dx = this.speed * Math.cos(angle),
          dy = this.speed * Math.sin(angle);

      p.dist += Math.sqrt(dx * dx + dy * dy);
      if(p.dist > p.maxDist)
        this.particles.splice(i, 1);
      else
        this.updateParticle(p, dx, dy);
    }
   },

   draw : function(ctx){
    var two_pi = Math.PI * 2;
    ctx.fillStyle = this.color;
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, two_pi, false);
      ctx.fill();    
    }
   }
};

// ---------------------------------------------
// Terminal related constructs
// TerminalBuffer, BufferView, BufferController, Termninal

var TerminalBuffer = {
  lines : null,
  name  : null,

  create : function(name) {
    var newBuff = Object.create(this);

    newBuff.name  = name;
    newBuff.lines = [""];
    return newBuff;
  },

  addLine : function(i, j) {
    if(i == undefined && j == undefined)
      this.lines.push("");
    else
      this.insertLine(i, j);
  },

  insertLine : function(i, j) {
    var front = this.lines.slice(0, j),
        back = this.lines.slice(j + 1);

    var lineFront = this.lines[j].slice(0, i),
        lineBack = this.lines[j].slice(i)

    this.lines = front.concat([lineFront]).concat([lineBack]).concat(back);
  },

  removeLine : function(j) {
    var front = this.lines.slice(0, j),
        back = this.lines.slice(j + 1);

    var line = this.lines[j];
    front[j - 1] += line;
    this.lines = front.concat(back);
  },

  lineLength : function(j) {
    return this.lines[j].length;
  },

  insertChar : function(c, i, j) {
    var front = this.lines[j].slice(0, i).concat(c),
        end   = this.lines[j].slice(i);

    this.lines[j] = front.concat(end);
  },

  removeChar : function(i, j) {
   var front = this.lines[j].slice(0, i),
       end   = this.lines[j].slice(i + 1);

    this.lines[j] = front.concat(end);
  },

  flatten : function(){
    return this.lines.reduce(function(p, c){
      return p += " " + c;
    });
  },

  clear : function(){
    this.lines = [""];
  },

  print : function() {
    this.lines.forEach(function(line){
      console.log(line);
    });
  }
};

var BufferView = {
  x : 0,
  y : 0,
  w : 0,
  h : 0,

  cellw : 0,
  cellh : 0,

  rows    : 0,
  columns : 0,

  buff       : null,
  controller : null,

  create : function(x, y, w, h, cellw, cellh, buff) {
    var newView = Object.create(this);

    newView.x     = x;
    newView.y     = y;
    newView.w     = w;
    newView.h     = h;
    newView.cellw = cellw;
    newView.cellh = cellh;
    newView.buff  = buff;

    newView.calcDimension();
    return newView;
  },

  viewBuffer : function(buff) {
    this.buff = buff;
    this.min = 0;
    this.max = 0;
  },

  pairWithController : function(controller){
    this.controller = controller;
    this.controller.viewingWidth = this.columns;
  },

  calcDimension : function(){
    this.columns = Math.floor(this.w / this.cellw) - 1;
    this.rows    = Math.floor(this.h / this.cellh);
    console.log("view initial size: ", this.columns, this.rows);
  },

  draw : function(ctx){
    this.drawBody(ctx);
    this.drawBuffer(ctx);
  },

  drawBody : function(ctx){
    ctx.fillStyle = "rgba(51,51,51,.7)";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  },

  drawCursor : function(ctx, x, y){
    x = this.x + (x * this.cellw);
    y = this.y + (y * this.cellh);

    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.fillRect(x + 2, y + 2, this.cellw - 2, this.cellh);
  },

  drawBuffer : function(ctx){
    if(!this.buff)
      return;

    var x = this.x + 2,
        y = this.y + this.cellh,
        w = this.cellw,
        h = this.cellh;

    var lines   = this.buff.lines,
        min     = Math.max(0, lines.length - this.rows)
        max     = this.controller.cy,
        cursorx = this.controller.cx,
        cursory = max - min;

    this.drawCursor(ctx, cursorx, cursory);

    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(255,255,255,1)";

    for(var i = min; i < max + 1; i++) {
      var line = lines[i];
      for (var j = 0; j < line.length; j++) {
        if(j >= this.columns && ((j % this.columns) === 0)){
          x = this.x + 2;
          y += h;
        }

        ctx.fillText(line[j], x , y);
        x += w;
      }

      x = this.x + 2;
      y += h;
    }
  }
};

var BufferController = {
  cx   : 0,
  cy   : 0,
  buff : null,

  create : function(buff) {
    var newController = Object.create(this);
    
    newController.buff = buff;
    return newController;
  },

  takeControl : function(buff) {
    this.buff = buff;
    this.cx = 0;
    this.cy = 0;
  },

  bufferNewLine : function(overflow) {
    this.buff.addLine();
    this.cx = 0;
    this.cy++;
  },

  bufferChar : function(c) {
    if(typeof c !== "string")
      c = String.fromCharCode(c);

    if(this.viewingWidth && this.cx >= this.viewingWidth)
      this.bufferNewLine();

    this.buff.insertChar(c, this.cx, this.cy);
    this.cx++;
  },

  bufferDelete : function(){
    if(this.cx === 0)
      this.deleteLine(true);
    else
      this.deleteChar();
  },

  bufferArrowKey : function(key){
    if(key === 37)
      this.bufferLeftArrow();
    else if(key === 39)
      this.bufferRightArrow();
    else if(key === 38)
      this.bufferUpArrow();
    else
      this.bufferDownArrow();
  },

  bufferLeftArrow : function(){

  },

  bufferRightArrow : function(){

  },

  bufferUpArrow : function(){

  },

  bufferDownArrow : function(){

  },

  bufferString : function(str){
    for(var i = 0; i < str.length; i++)
      this.bufferChar(str[i]);
  },

  deleteLine : function(overflow) {
    if(this.cy > 0){
      this.buff.removeLine(this.cy);
      this.cy--;
      this.cx = this.buff.lineLength(this.cy);

      if(overflow)
        this.bufferDelete();
    }
  },

  deleteChar : function() {
    if(this.cx > 0){
      this.cx--;
      this.buff.removeChar(this.cx, this.cy);
    }
  },

  flattenBuffer : function(){
    return this.buff.flatten();
  },

  clearBuffer : function() {
    this.cx = 0;
    this.cy = 0;
    this.buff.clear();
  },

  onKeyPress : function(event) {
    var c = event.charCode;

    if(c === 13)
      this.bufferNewLine();
    else
      this.bufferChar(c);
  },

  onKeyDown : function(event) {
    var c = event.keyCode;

    if(c === 8 || c === 46)
      this.bufferDelete();
    else if(Terminal.isArrowKey(c))
      this.bufferArrowKey(c);
  }
};

var HistoryNode = {
  str  : null,
  prev : null,
  next : null,

  create : function(str){
    var newNode = Object.create(this);

    newNode.str = str;
    return newNode;
  }
};

var TerminalHistory = {
  size     : 0,
  MAX_SIZE : 10,

  root : null,
  tail : null,
  curr : null,

  create : function(){
    var newHistory = Object.create(this);

    newHistory.list = [];
    return newHistory;
  },

  clear : function(){
    this.list = [];
  },

  add : function(str){
    if(this.root === null){
      this.root = HistoryNode.create(str);
      this.root.next = this.root;
      this.root.prev = this.root;

      this.curr = this.root;
      this.tail = this.root;
      this.size++
    }else if(this.size < TerminalHistory.MAX_SIZE){
      var newTail = HistoryNode.create(str),
          oldTail = this.tail;

      oldTail.next = newTail;
      newTail.prev = oldTail;

      newTail.next = this.root;
      this.root.prev = newTail

      this.curr = newTail;
      this.tail = newTail;

      this.size++
    }else{
      var newCurr = this.curr.next;

      newCurr.str = str;
      this.curr = newCurr;
    }
  },

  print : function(){
    var iterator = this.root,
        count    = 0;

    while(iterator && count != this.size){
      console.log(iterator.str);
      iterator = iterator.next;
      count++;
    }
  }

};

var Terminal = {
  x : 0,
  y : 0,
  w : 0,
  h : 0,

  barw  : 0,
  barh  : 0,
  
  files      : null,
  inbuff     : null,
  outbuff    : null,
  bufferView : null,
  bounds     : null,

  inController  : null,
  outController : null,

  inFocus : false,
  title   : "Rocket Terminal",
  prompt  : "rocket> ",

  initialize  : function(x, y, w, h, cellw, cellh){
    Terminal.x     = x;
    Terminal.y     = y;
    Terminal.w     = w;
    Terminal.h     = h;
    Terminal.barw  = w;
    Terminal.barh  = 30;
    Terminal.files = [];

    Terminal.inbuff  = TerminalBuffer.create();
    Terminal.outbuff = TerminalBuffer.create();
    Terminal.bounds  = BoundingBox.create(x, x + w, y, y + h);
    Terminal.initializeControllers();
    Terminal.initializeView(x, y, w, h, cellw, cellh);

    Terminal.outController.bufferString(Terminal.prompt);
    Terminal.setUpTestScripts();
  },

  initializeView : function(x, y, w, h, cellw, cellh){
    Terminal.bufferView = 
      BufferView.create(x, y + Terminal.barh, w, h, cellw, cellh, Terminal.outbuff);

    Terminal.bufferView.drawCursor = function(ctx, x, y) {
      if(!Terminal.inFocus) 
        return; 

      x = this.x + (x * this.cellw);
      y = this.y + (y * this.cellh);

      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.fillRect(x + 2, y + 2, this.cellw - 2, this.cellh);
    };

    Terminal.bufferView.pairWithController(Terminal.outController);
  },

  initializeControllers : function(){
    Terminal.inController = BufferController.create(Terminal.inbuff);
    Terminal.inController.onKeyPress = function(event){
      var c = event.charCode;

      if(c === 13)
        Terminal.flushInputBuffer();
      else{
        // disable spacebar scroll
        if(c === 32)
          event.preventDefault();
    
        this.bufferChar(c);
      }
    };

    Terminal.outController = BufferController.create(Terminal.outbuff);
    Terminal.outController.onKeyDown = function(event){
      var c = event.keyCode;

      if(Terminal.inController.cx > 0 && (c ===  8 || c === 46))
        this.bufferDelete();
      else if(Terminal.isArrowKey(c)){
        event.preventDefault();
        this.bufferArrowKey(c);
      }
    };
  },

  flushInputBuffer : function(){
    var cmd = Terminal.inController.flattenBuffer();
    Terminal.inController.clearBuffer();
    Terminal.parsecmd(cmd);
  },

  flushOutputBuffer : function(){
    Terminal.outController.clearBuffer();
  },

  listFiles : function(){
    Terminal.files.forEach(function(buff){
      Terminal.printString("file: " + buff.name);
    });
  },

  changeDirectory : function(){

  },

  testParse : function(src){
    RPLparser.parse(src);
  },

  printenv : function(){
    Terminal.printString("thrust = " + RocketController.thrust);
    Terminal.printString("angle  = " + RocketController.angle);
    Terminal.printString("burn   = " + RocketController.burn);
  },

  printInfo : function(){
    Terminal.printString("Rocket's current state:");
    Terminal.printString("-----------------------");
    Terminal.printString("x     = " + RocketController.rocket.x.toFixed(4));
    Terminal.printString("y     = " + RocketController.rocket.y.toFixed(4));
    Terminal.printString("speed = " + RocketController.rocket.getSpeed().toFixed(4));
    Terminal.printString("angle = " + RocketController.rocket.getAngle().toFixed(4));
    Terminal.printString("mass  = " + RocketController.rocket.mass.toFixed(4));
    Terminal.printString("-----------------------");
  },

  printHelp : function(){
    Terminal.printString("scroll down to view usage");
  },

  createFile : function(name){
    var exists = Terminal.files.find(function(buff) {
      return buff.name === name;
    });

    if(exists)
      Terminal.printString("error: file '" + name  + "' exists");
    else{
      Terminal.files.push(TerminalBuffer.create(name));
      Terminal.printString("create: file '" + name + "' created");
    }
  },

  launchEditor : function(scriptName) {
    if(!scriptName){
      Terminal.printString("error: no file provided");
    }else{
      var buff = Terminal.files.find(function(buff){
        return buff.name === scriptName;
      });

      if(buff){
        TextEditor.show();
        TextEditor.loadBuffer(buff);
        EventDispatcher.giveFocusTo(TextEditor);
      }
      else
        Terminal.printString("error: file '" + scriptName + "' not found");
    }
  },

  run : function(scriptName){
    if(scriptName){
      var buff = Terminal.files.find(function(buff){
        return buff.name === scriptName;
      });

      if(buff)
        Terminal.testParse(buff.flatten());
      else
        Terminal.printString("error: file '" + scriptName + "' not found");
    }
    else
      RocketController.queueSequence();
  },

  setUpTestScripts : function() {
    Terminal.createFile("test.rpl");
    var buff = Terminal.files.find(function(buff){
        return buff.name === "test.rpl";
    });

    buff.lines[0] = ("thrust 10");
    buff.lines.push("burn 100");
    buff.lines.push("");
    buff.lines.push("sequence left {");
    buff.lines.push("  angle 180");
    buff.lines.push("  run");
    buff.lines.push("}");
    buff.lines.push("");
    buff.lines.push("sequence up {");
    buff.lines.push("  angle 270");
    buff.lines.push("  run");
    buff.lines.push("}");
    buff.lines.push("");
    buff.lines.push("sequence right {");
    buff.lines.push("  angle 0");
    buff.lines.push("  run");
    buff.lines.push("}");
    buff.lines.push("");
    buff.lines.push("sequence down {");
    buff.lines.push("  angle 90");
    buff.lines.push("  run");
    buff.lines.push("}");
    buff.lines.push("");
    buff.lines.push("repeat 5 {");
    buff.lines.push("  do left");
    buff.lines.push("  do up");
    buff.lines.push("  do right");
    buff.lines.push("  do down");
    buff.lines.push("");
    buff.lines.push("  repeat 5 {")
    buff.lines.push("    do left")
    buff.lines.push("    do right")
    buff.lines.push("  }")
    buff.lines.push("}");
    Terminal.parsecmd("clear");
  },

  parsecmd : function(cmd){
    cmd = cmd.trim();
    console.log("cmd: ", cmd);
    
    var splitcmd = cmd.split(/\s+/);
    console.log("splitcmd: ", splitcmd);

    switch(splitcmd[0]){
      case "clear":
        Terminal.flushOutputBuffer();
        break;

      case "parse":
         Terminal.testParse(cmd.replace("parse", " "));
         break;

      case "ls":
        Terminal.listFiles();
        break;

      case "cd":
        Terminal.changeDirectory(splitcmd[1]);
        break;

      case "set":
        RocketController.set(splitcmd[1], splitcmd[2])
        break;

      case "run":
        Terminal.run(splitcmd[1]);
        break;

      case "reset":
        RocketController.resetRocket();
        break;

      case "printenv":
        Terminal.printenv();
        break;

      case "info":
        Terminal.printInfo();
        break;

      case "help":
        Terminal.printHelp();
        break;

      case "create":
        Terminal.createFile(splitcmd[1]);
        break;

      case "edit":
        Terminal.launchEditor(splitcmd[1]);
        break;

      case "":
        // Terminal.run("test.rpl");
        break;

      default:
        Terminal.printString("error: " + " unknown command '" + splitcmd[0] + "'");
    };

    Terminal.outController.bufferString(Terminal.prompt);
  },

  printString : function(msg){
    Terminal.outController.bufferString(msg);
    Terminal.outController.bufferNewLine();
  },

  draw : function(ctx){
    Terminal.drawBar(ctx);
    Terminal.bufferView.draw(ctx);
  },

  drawBar: function(ctx){
    ctx.fillStyle = "rgba(0,190,112,.6)";
    ctx.fillRect(Terminal.x, Terminal.y, Terminal.barw, Terminal.barh);

    var title = Terminal.title + ": " + Terminal.bufferView.columns + " x " + Terminal.bufferView.rows;
    ctx.font = "16px Jura";
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fillText(title, Terminal.x + 20 , Terminal.y + 20);
  },

  onKeyPress: function(event){
    Terminal.outController.onKeyPress(event);
    Terminal.inController.onKeyPress(event);
  },

  onKeyDown: function(event){
    Terminal.outController.onKeyDown(event);
    Terminal.inController.onKeyDown(event);
  },

  isMouseOver: function(x, y){
    return Utils.pointInBounds(x, y, this.bounds);
  },

  isArrowKey : function(key){
    return key >= 37 && key <= 40;
  }
};

(function (){
  console.log(this.text);
  return this;
}).bind(new function(){
  this.text = "when will it print";
  return this;
}).call();

// ------------------------------------------------------------
// Text Editor
// Editor

var TextEditor = {
  x : 0,
  y : 0,
  w : 0,
  h : 0,

  barw  : 0,
  barh  : 30,

  bufffer          : null,
  bufferView       : null,
  bufferController : null,
  bounds           : null,

  title   : "Edit",
  inFocus : false,
  visible : false,

  initialize : function(x, y, w, h, cw, ch) {
    TextEditor.x    = x;
    TextEditor.y    = y;
    TextEditor.w    = w;
    TextEditor.h    = h;
    TextEditor.barw = w;

    TextEditor.buffer = null;
    TextEditor.bounds = BoundingBox.create(x, x + w, y, y + h);
    TextEditor.bufferView = BufferView.create(x, y + TextEditor.barh, w, h, cw, ch, TextEditor.buffer);
    TextEditor.bufferController = BufferController.create(TextEditor.buffer);
    TextEditor.bufferView.pairWithController(TextEditor.bufferController);

    TextEditor.applyCustoms();
  },

  show : function() {
    TextEditor.visible = true;
  },

  hide : function() {
    TextEditor.visible = false;
  },

  loadBuffer : function(buff){
    TextEditor.buffer = buff;
    TextEditor.bufferController.takeControl(buff);
    TextEditor.bufferView.viewBuffer(buff);
  },

  applyCustoms : function() {
     TextEditor.bufferController.onKeyPress = function(event){
      var c = event.charCode;

      if(c === 13)
        this.bufferNewLine()
      else{
        // disable spacebar scroll
        if(c === 32)
          event.preventDefault();
    
        this.bufferChar(c);
      }
    };

    TextEditor.bufferController.onKeyDown = function(event){
      var c = event.keyCode;

      if(Terminal.isArrowKey(c)){
        event.preventDefault();
        this.bufferArrowKey(c);
      }else if(c ===  8 || c === 46)
        this.bufferDelete();
    };

    TextEditor.bufferView.drawCursor = function(ctx, x, y){
      if(!TextEditor.inFocus)
        return;

      x = this.x + (x * this.cellw);
      y = this.y + (y * this.cellh);

      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.fillRect(x + 2, y + 2, 1, this.cellh + 2);
    };

    // extend with field
    TextEditor.bufferView.min        = 0;
    TextEditor.bufferView.max        = 0;
    TextEditor.bufferView.drawBuffer = function(ctx){
      if(!this.buff)
        return;

      var x = this.x + 2,
          y = this.y + this.cellh,
          w = this.cellw,
          h = this.cellh;

      var lines   = this.buff.lines,
          min     = this.min,
          max     = this.max = Math.min(lines.length, this.min + this.rows) - 1,
          cursorx = this.controller.cx,
          cursory = this.controller.cy - min;

      this.drawCursor(ctx, cursorx, cursory);
      ctx.font = "12px monospace";
      ctx.fillStyle = "rgba(255,255,255,1)";

      for(var i = min; i < max + 1; i++) {
        var line = lines[i];
        for (var j = 0; j < line.length; j++) {
          if(j >= this.columns && ((j % this.columns) === 0)){
            x = this.x + 2;
            y += h;
          }

          ctx.fillText(line[j], x , y);
          x += w;
        }

        x = this.x + 2;
        y += h;
      }
    };

    TextEditor.bufferController.bufferNewLine = function(overflow) {
      this.buff.addLine(TextEditor.bufferController.cx, TextEditor.bufferController.cy);
      this.cx = 0;
      this.cy++;

      if(this.cy > TextEditor.bufferView.max && this.buff.lines.length > TextEditor.bufferView.rows)
        TextEditor.bufferView.min++;
    },

    TextEditor.bufferController.bufferDelete = function() {
      if(this.cx === 0)
        this.deleteLine();
      else
        this.deleteChar();
    };

    TextEditor.bufferController.deleteLine = function() {
      if(this.cy > 0){
        this.cx = this.buff.lineLength(this.cy - 1);
        this.buff.removeLine(this.cy);
        this.cy--;

        if(this.cy < TextEditor.bufferView.min && TextEditor.bufferView.min > 0)
            TextEditor.bufferView.min--;
      }
    };

    TextEditor.bufferController.bufferLeftArrow = function() {
      if(this.cx === 0 && this.cy === 0) return;

      if(this.cx === 0 && this.cy > 0){
        this.cy--;
        this.cx = this.buff.lineLength(this.cy);

        if(this.cy < TextEditor.bufferView.min)
          TextEditor.bufferView.min--;

      }else{
        this.cx--;
      }
    };

    TextEditor.bufferController.bufferRightArrow = function() {
      if(this.cx === this.buff.lines[this.cy].length && this.cy === this.buff.lines.length - 1) return;

      if(this.cx === this.buff.lines[this.cy].length && this.cy < this.buff.lines.length - 1){
        this.cx = 0;
        this.cy++;

        if(this.cy > TextEditor.bufferView.max && this.buff.lines.length > TextEditor.bufferView.rows)
          TextEditor.bufferView.min++;
      }else{
        this.cx++;
      }
    };

    TextEditor.bufferController.bufferUpArrow = function() {
      if(this.cy === 0) return;
      else{
        this.cy--;
        this.cx = Math.min(this.cx, this.buff.lineLength(this.cy));

        if(this.cy < TextEditor.bufferView.min)
          TextEditor.bufferView.min--;
      }
    };

    TextEditor.bufferController.bufferDownArrow = function() {
      if(this.cy === this.buff.lines.length - 1) return;
      else{
        this.cy++;
        this.cx = Math.min(this.cx, this.buff.lineLength(this.cy));

         if(this.cy > TextEditor.bufferView.max && this.buff.lines.length > TextEditor.bufferView.rows)
          TextEditor.bufferView.min++;
      }
    };
  },

  draw : function(ctx) {
    if(!TextEditor.visible)
      return;

    TextEditor.drawBar(ctx);
    TextEditor.bufferView.draw(ctx);
  },

  drawBar: function(ctx) {
    ctx.fillStyle = "rgba(0,190,112,.6)";
    ctx.fillRect(TextEditor.x, TextEditor.y, TextEditor.barw, TextEditor.barh);

    var title = TextEditor.title + (TextEditor.buffer ? " - " + TextEditor.buffer.name : "");
    ctx.font = "16px Jura";
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fillText(title, TextEditor.x + 20 , TextEditor.y + 20)
  },

  onKeyPress : function(event) {
    if(TextEditor.buffer)
      TextEditor.bufferController.onKeyPress(event);
  },

  onKeyDown : function(event) {
    if(TextEditor.buffer)
      TextEditor.bufferController.onKeyDown(event);
  },

  isMouseOver: function(x, y){
    return Utils.pointInBounds(x, y, this.bounds);
  },
};
  
// ------------------------------------------------------------
// RPL contructs (rocket programming language)
// RPLparser, Token
// Sequence, Repeat, Do, Assignment => {thrust, angle, burn}

var Token = {
  text : null,
  next : null,
  prev : null,

  create : function(text){
    var newToken = Object.create(this);

    newToken.text = text;
    return newToken;
  }
};

/**
 * RPL Grammar ------------------------------------------
 * Program :- (Statement)*;
 *
 * Statement :- AssingmentStatement 
 *            | ReapeatStatement
 *            | DoStatement
 *            | RunStatement
 *            | SequenceStatement
 *            ;
 *
 * AssingmentStatement :- ThrustStatement 
 *                      | AngleStatement
 *                      | BurnStatement
 *                      ;
 *
 * ThrustStatement :- 'thrust' int;
 *
 * AngleStatement :- 'angle' int;
 *
 * BurnStatement :- 'burn' int;
 *
 * ReapeatStatement :- 'repeat' int Block;
 *
 * DoStatement :- 'do' name;
 * 
 * RunStatement :- 'run';
 * 
 * SequenceStatement :- 'sequence' name Block;
 *
 * Block :- '{' (statement)* '}'
 */

var RPLparser = {
  tokens  : null,
  srcstr  : null,
  program : null,

  parse : function(srcstr){
    // seed this parse 
    RPLparser.srcstr  = srcstr;
    RPLparser.tokens  = Queue.create();

    RPLparser.tokenize(srcstr);
    RPLparser.recursiveDecentTest();

    // forget this parse
    RPLparser.tokens = null;
    RPLparser.srcstr = null;
    return RPLparser.program;
  },

  tokenize : function(){
    var token    = "",
        strIndex = 0;

    while(strIndex < RPLparser.srcstr.length){
      var c = RPLparser.srcstr[strIndex];

      if(RPLparser.isAlpha(c))
        lexName();
      else if(RPLparser.isDigit(c))
        lexNumber();
      else if(RPLparser.isWhiteSpace(c))
        lexWhiteSpace();
      else
        lexSymbol();

      function lexName(){
        token += c;
        strIndex++;
        while(strIndex < RPLparser.srcstr.length){
          c = RPLparser.srcstr[strIndex];

          if(RPLparser.isAlpha(c) || RPLparser.isDigit(c)){
            token += c;
            strIndex++;
          }
          else{
            break;
          }
        }

        RPLparser.tokens.push(Token.create(token));
        token = "";
      }

      function lexNumber(){
        token += c;
        strIndex++;
        while(strIndex < RPLparser.srcstr.length){
          c = RPLparser.srcstr[strIndex];

          if(RPLparser.isDigit(c)){
            token += c;
            strIndex++;
          }
          else{
            break;
          }
        }

        RPLparser.tokens.push(Token.create(token));
        token = "";
      }

      function lexWhiteSpace(){
        strIndex++;
        while(strIndex < RPLparser.srcstr.length){
          c = RPLparser.srcstr[strIndex];

          if(RPLparser.isWhiteSpace(c)){
            strIndex++;
          }
          else{
            break;
          }
        }
      }

      function lexSymbol(){
        if(RPLparser.isSymbol(c)){
          token += c;
          RPLparser.tokens.push(Token.create(token));
          strIndex++;
          token = "";
        }else{
          Terminal.printString("lex: error unxpected token '" + c  + "'");
          strIndex++;
        }
      }

    }
  },

  isAlpha : function(c){
    c = c.charCodeAt(0);
    var upperBoundUpper = "Z".charCodeAt(0),
        lowerBoundUpper = "A".charCodeAt(0),
        upperBoundLower = "z".charCodeAt(0),
        lowerBoundLower = "a".charCodeAt(0);

    return c <= upperBoundUpper && c >= lowerBoundUpper
        || c <= upperBoundLower && c >= lowerBoundLower
  },

  isDigit : function(c){
    return c >= "0" && c <= "9" || c == "-";
  },

  isWhiteSpace : function(c){
    return c === " " || c === "\t"  || c === "\n";
  },

  isSymbol : function(c){
    return c === "{" || c === "}";
  },

  recursiveDecentTest : function() {
    var next    = RPLparser.tokens.peek(),
        program = RPLparser.program = [],
        sequenceMap = {};

    function Program(program) {
      var result = true;
      while(next != null && result)
        result = result && Statement_(program);

      return result;
    }

    function Statement_(program) {
      var saved = next;
      if(AssignmentStatement_(program))
        return true;

      next = saved; 
      if(RepeatStatement_(program))
        return true;

      next = saved;
      if(DoStatement_(program))
        return true;

      next = saved;
      if(RunStatement_(program))
        return true;

      next = saved;
      if(SequenceStatement_(program))
        return true;

      return false;
    }

    function AssignmentStatement_(program) {
      var saved = next;
      if(ThrustStatement_(program))
        return true;

      next = saved;
      if(AngleStatement_(program))
        return true;

      next = saved;
      if(BurnStatement_(program))
        return true;

      return false;
    }

    function ThrustStatement_(program) {
      var saved = next,
          result = keyword("thrust") && int();

      if(result){
        var attribute = saved.text,
            value     = saved.next.text;
        // RocketController.setProperty(attribute, value);
        program.push(AssignmentStatement.create(attribute, value));
      }

      return result;
    }

    function AngleStatement_(program) {
      var saved = next,
          result = keyword("angle") && int();

      if(result){
        var attribute = saved.text,
            value     = saved.next.text;
        // RocketController.setProperty(attribute, value);
        program.push(AssignmentStatement.create(attribute, value));
      }

      return result;
    }

    function BurnStatement_(program) {
      var saved = next,
          result = keyword("burn") && int();

      if(result){
        var attribute = saved.text,
            value     = saved.next.text;
        // RocketController.setProperty(attribute, value);
        program.push(AssignmentStatement.create(attribute, value));
      }

      return result;
    }

    function RepeatStatement_(program) {
      var saved = next,
          result = keyword("repeat") && int();

          if(result){
            var repeat = RepeatStatement.create(saved.next.text, []);
            result = Block(repeat.block);
            if(result)
              program.push(repeat);
          }

      return result;
    }

    function DoStatement_(program) {
      var saved = next,
          result = keyword("do") && name();

      if(result && sequenceMap[saved.next.text])
        program.push(sequenceMap[saved.next.text])

      return result;
    }

    function SequenceStatement_(program) {
      var saved = next,
          result = keyword("sequence") && name();

      if(result){
        var sequence = SequenceStatement.create(saved.next.text, []);
        result = Block(sequence.block);

        if(result)
          sequenceMap[sequence.name] = sequence;
      }

      return result
    }

    function RunStatement_(program) {
      var result = keyword("run");

      if(result){
        // RocketController.queueSequence();
        program.push(RunStatement.create());
      }

      return result;
    }

    function Block(program) {
      return keyword("{") && BlockBody(program) && keyword("}");
    }

    function BlockBody(program) {
      var result = true;
      while(next != null && next.text != "}" && result)
       result = result && Statement_(program);

      return result;
    }

    function keyword(word){
      if(next == null)
        return false;

      var curr = next;
      next = next.next;

      if(curr.text === word)
        return true;

      return false;
    }

    function name() {
      if(next == null)
        return false;

      var curr = next;
      if(int())
        return false;

      next = curr;
      next = next.next;

      return notReserved(curr.text);
    }

    function notReserved(name) {
      return name != "thrust" && name != "angle" && name != "burn" && name != "repeat"
          && name != "do" && name != "sequence" && name != "run" && name != "{" && name != "}";
    }

    function int(){
      if(next == null)
        return false;

      var curr = next;
      next = next.next;

      for (var i = curr.text.length - 1; i >= 0; i--) {
        if(!RPLparser.isDigit(curr.text[i]))
          return false;
      }

      return true;
    }

    var result = Program(program);
    Terminal.printString("Parse result: " + (result ? "accept" : "reject"));
    if(result)
      program.forEach(function(statement) {
        statement.evaluate();
      });
  }

};            

var AssignmentStatement = {
  name  : null,
  value : null,

  create : function(name, value){
    var newas = Object.create(this);

    newas.name = name;
    newas.value = value;
    return newas;
  },

  evaluate : function() {
    RocketController.setProperty(this.name, this.value, true);
  }
};

var RepeatStatement = {
  n     : 0,
  block : null,

  create : function(n, block){
    var newrs = Object.create(this);

    newrs.n = parseInt(n);
    newrs.block = block;
    return newrs;
  },

  evaluate : function() {
    for(var i = 0; i < this.n; ++i){
      for(var j = 0; j < this.block.length; ++j){
        this.block[j].evaluate();
      }
    }
  }
};

var SequenceStatement = {
  name  : null,
  block : null,

  create : function(name, block) {
    var newss = Object.create(this);

    newss.name = name;
    newss.block = block;
    return newss;
  },

  evaluate : function() {
    for(var i = 0; i < this.block.length; ++i){
      this.block[i].evaluate();
    }
  }
};

var RunStatement = {
  create : function() {
    return Object.create(this);
  },

  evaluate : function() {
    RocketController.queueSequence(true);
  }
};
