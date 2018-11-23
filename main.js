var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);


var spawn = require('child_pty').spawn;

app.get('/', function(req, res, next){
  res.redirect('/index.html');
});

app.ws('/term', function(ws, req) {

  const child = spawn('/bin/bash', ['-i']);
  child.stdin.write('export TERM=xterm-256color\n');
  child.stdin.write('clear\n');

  child.on('error', (err) => {
    console.log(err);
  });

  child.stdout.on('data', function(data) {
	ws.send(data.toString('utf-8'));
  });

  child.stderr.on('data', function(data) {
	ws.send(data.toString('utf-8'));
  });

  child.on('close', function(code) {
      ws.close();
  });

  ws.on('message', function(msg) {
    msg = JSON.parse(msg);
    if(msg.data) {
        s = child.stdin;
        s.cork();
        s.write(msg.data);
        s.uncork();
        return;
    }

    else if(msg.set_xy) {
        console.log(msg);
	child.pty.resize({columns:msg.set_xy.cols, rows:msg.set_xy.rows});
    }

  });


});

app.use(express.static('public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.listen(3000);

