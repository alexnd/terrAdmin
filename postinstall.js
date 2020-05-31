// prepare terrAdmin instance
// (c) 2020 Alexnd

var fs = require('fs');
// var path = require('path');

if (!fs.existsSync('./config-local.js')) fs.copyFileSync('./config.js', './config-local.js');
if (!fs.existsSync('./server.cfg')) fs.copyFileSync('./server-example.cfg', './server.cfg');