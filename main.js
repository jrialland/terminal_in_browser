const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const winston = require('winston');
const spawn = require('node-pty').spawn;

//------------------------------------------------------------------------------
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'green'
});

const logger = winston.createLogger({
  level: 'debug',
  format : winston.format.combine( winston.format.colorize(), winston.format.simple()),
  transports : [
  	new winston.transports.Console(),
  ]
});

//------------------------------------------------------------------------------
app.get('/', function(req, res, next){
  res.redirect('/index.html');
});

//------------------------------------------------------------------------------
app.ws('/term', function(ws, req) {
  logger.debug('starting session');
  
  const child = spawn('/bin/bash', ['-i'], {
  	name: 'xterm-color',
  	cols:80,
  	rows:30,
  	cwd: process.env.HOME,
  	env:process.env
  });
  
  child.on('error', (err) => {
    logger.error('error', err);
  });

  child.on('data', function(data) {
	ws.send(data.toString('utf-8'));
  });

  child.on('close', function(code) {
      logger.debug('close');
      ws.close();
  });

  ws.on('message', function(msg) {
    const m = JSON.parse(msg);
    if(m.data) {
        child.write(m.data);
    } else if(m.set_xy) {        
    	logger.debug(msg);
	child.resize(m.set_xy.cols, m.set_xy.rows);
    }
  });
  logger.debug('waiting for messages');
});

//------------------------------------------------------------------------------
app.use(express.static('public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

//------------------------------------------------------------------------------
app.listen(3000);
logger.debug('http://localhost/3000')

