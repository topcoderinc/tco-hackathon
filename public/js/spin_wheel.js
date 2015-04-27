var spinWheel = (function (io) {

  var spinWheel = {};
  var socket = io();
  var APIs, arc, colors, ctx;
  var startAngle = 0;

  /**
   * Draws the spin wheel to canvas.
   */
  function drawRouletteWheel() {
    var canvas = document.getElementById("wheelcanvas");
    if (canvas.getContext) {
      var outsideRadius = 200;
      var textRadius = 160;
      var insideRadius = 5;

      ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 500, 500);


      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;

      ctx.font = 'bold 12px sans-serif';

      for (var i = 0; i < APIs.length; i++) {
        var angle = startAngle + i * arc;
        ctx.fillStyle = colors[i];

        ctx.beginPath();
        ctx.arc(250, 250, outsideRadius, angle, angle + arc, false);
        ctx.arc(250, 250, insideRadius, angle + arc, angle, true);
        ctx.stroke();
        ctx.fill();

        ctx.save();
        ctx.shadowOffsetX = -1;
        ctx.shadowOffsetY = -1;
        ctx.shadowBlur = 0;
        ctx.shadowColor = "rgb(220,220,220)";
        ctx.fillStyle = "white";
        ctx.translate(250 + Math.cos(angle + arc / 2) * textRadius, 250 + Math.sin(angle + arc / 2) * textRadius);
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        var text = APIs[i];
        ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
        ctx.restore();
      }

      //Arrow
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.moveTo(250 - 4, 250 - (outsideRadius + 5));
      ctx.lineTo(250 + 4, 250 - (outsideRadius + 5));
      ctx.lineTo(250 + 4, 250 - (outsideRadius - 5));
      ctx.lineTo(250 + 9, 250 - (outsideRadius - 5));
      ctx.lineTo(250 + 0, 250 - (outsideRadius - 13));
      ctx.lineTo(250 - 9, 250 - (outsideRadius - 5));
      ctx.lineTo(250 - 4, 250 - (outsideRadius - 5));
      ctx.lineTo(250 - 4, 250 - (outsideRadius + 5));
      ctx.fill();
    }
  }

  // Send the uri details to the API so it could
  // extract eventId and teamId from uri path.
  socket.emit('getAPIs', location.pathname);

  // Error handler.
  socket.on('_error_', function (err) {
    console.error(err);
  });

  // Listen for `APIs` event and draw the wheel.
  socket.on('APIs', function (_APIs) {
    console.log('APIs', _APIs);
    arc = Math.PI / (_APIs.length / 2);
    colors = _APIs.map(function () {
      // Generate random colors...
      return '#' + Math.floor(Math.random() * 16777215).toString(16);
    });
    APIs = _APIs;
    drawRouletteWheel();
  });

  // Spin button click
  spinWheel.spin = function (el) {
    el.disabled = true;
    socket.emit('spin', location.pathname);
  };

  // Listen for `spinning` event to rotate the wheel.
  socket.on('spinning', function (_startAngle) {
    startAngle = _startAngle;
    drawRouletteWheel();
  });

  socket.on('spin result', function (msg) {
    console.log('spin result', msg);
    if (msg === 'present') {
      alert("Oops, already have that API! Spin Again.");
      document.getElementById('spin-button').disabled = false;
    } else {
      ctx.save();
      ctx.font = 'bold 40px sans-serif';
      ctx.strokeStyle = "black";
      ctx.fillStyle = "white";
      ctx.fillText(msg, 250 - ctx.measureText(msg).width / 2, 250 + 10);
      ctx.restore();
      setTimeout(function () {
        location.reload();
      }, 200);
    }
  });

  // Return some API.
  return spinWheel;
})(io);
