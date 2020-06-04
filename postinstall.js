// prepare terrAdmin instance
// (c) 2020 Alexnd

var fs = require('fs');

if (!fs.existsSync('./config.js')) fs.copyFileSync('./config-example.js', './config.js');
if (!fs.existsSync('./server.cfg')) fs.copyFileSync('./server-example.cfg', './server.cfg');
if (!fs.existsSync('./Worlds')) fs.mkdirSync('./Worlds');
if (!fs.existsSync('./Worlds/Stash')) fs.mkdirSync('./Worlds/Stash');