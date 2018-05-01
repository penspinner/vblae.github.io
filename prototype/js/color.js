let colors = [
  "rgba(24,124,81,1)",
  "rgba(246,242,107,1)",

  "rgba(9,82,76,1)",
  "rgba(210,213,55,1)",

  "rgba(6,81,204,1)",
  "rgba(176,184,179,1)",

  "rgba(61,43,57,1)",
  "rgba(183,175,211,1)",

  "rgba(73,69,70,1)",
  "rgba(10,217,200,1)",

  "rgba(174,206,244,1)",
  "rgba(6,101,246,1)",

  "rgba(255,138,7,1)",
  "rgba(29,69,168,1)",

  "rgba(58,164,65,1)",
  "rgba(113,75,76,1)",

  "rgba(122,229,87,1)",
  "rgba(99,83,111,1)",

  "rgba(57,77,83,1)",
  "rgba(0,185,137,1)",

  "rgba(76,187,112,1)",
  "rgba(55,70,89,1)",

  "rgba(43,67,101,1)",
  "rgba(150,44,35,1)",

  "rgba(255,96,80,1)",
  "rgba(29,80,162,1)",

  "rgba(104,107,113,1)",
  "rgba(15,132,220,1)",

  "rgba(71,245,212,1)",
  "rgba(224,138,175,1)",

  "rgba(45,196,170,1)",
  "rgba(100,113,148,1)",

  "rgba(255,3,4,1)",
  "rgba(11,68,57,1)",

  "rgba(140,142,176,1)",
  "rgba(164,244,233,1)",

  "rgba(211,255,55,1)",
  "rgba(30,130,123,1)",

  "rgba(15,190,135,1)",
  "rgba(198,242,32,1)",

  "rgba(59,189,124,1)",
  "rgba(165,60,81,1)",

  "rgba(175,69,10,1)",
  "rgba(68,177,239,1)",

  "rgba(68,133,57,1)",
  "rgba(58,76,116,1)",

  "rgba(157,226,145,1)",
  "rgba(58,63,96,1)",

  "rgba(13,248,127,1)",
  "rgba(128,87,114,1)",

  "rgba(40,38,39,1)",
  "rgba(45,157,254,1)",

  "rgba(18,82,149,1)",
  "rgba(254,221,229,1)",

  "rgba(73,91,107,1)",
  "rgba(167,199,171,1)",

  "rgba(110,118,177,1)",
  "rgba(1,196,245,1)",

  "rgba(14,254,158,1)",
  "rgba(137,160,154,1)",

  "rgba(121,79,110,1)",
  "rgba(43,204,151,1)",

  "rgba(225,101,52,1)",
  "rgba(37,26,23,1)"
];

let cnvs = document.createElement("canvas"),
    ctx = cnvs.getContext("2d");

let w = window.innerWidth,
    h = window.innerHeight;

cnvs.setAttribute("width",  w * 2);
cnvs.setAttribute("height", h * 2);
cnvs.style.width = w + "px";
cnvs.style.height = h + "px";
ctx.setTransform(2, 0, 0, 2, 0, 0);

document.body.appendChild(cnvs);

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

cnvs.addEventListener("click", (e) => {
  shuffle(colors);
  drawColors(colors);
});

drawColors();

function drawColors() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);
  let x = 0,
    y = 10,
    _w = w / 8,
    _h = h / 4,
    r = parseInt(w / _w),
    c = parseInt(h / _h);

  for(let i = 0, j = 1; i < colors.length; i += 2, j++){
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, y, _w - 10, _h - 10);
    ctx.fillStyle = colors[i + 1];
    ctx.fillRect(x + 20, y, _w - 30, _h - 10);

    ctx.fillStyle = "white";
    ctx.font = "15px menlo";
    ctx.fillText(colors[i], x + 25, y + 25);
    ctx.fillText(colors[i + 1], x + 25, y + 50);

    x += _w;
    if(j % r == 0){
      y += _h;
      x = 0;
    }
  }
}
