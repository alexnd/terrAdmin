// terrAdmin 3-d party (Terraria [tm]) server installation script
// (c) 2020 Alexnd

var urlDist = 'https://github.com/Pryaxis/TShock/releases/download/v4.4.0-pre8/TShock_4.4.0_Pre8_Terraria1.4.0.4.zip';
var dest = 'TShock_4.4.0_Pre8_Terraria1.4.0.4.zip';
var installDir = 'TerrariaServer/TShock';

var fs = require('fs');
var path = require('path');
var https = require('https');
var unzipper = require('unzipper');

var pathDest = path.join(__dirname, dest);
var pathInstall = path.join(__dirname, installDir);

if (fs.existsSync(pathDest)) {
  console.log('*', dest);
  unpackDist();
} else {
  var file = fs.createWriteStream(pathDest);
  console.log('*', urlDist);
  console.log('Downloading...');
  var request = https.get(urlDist, function(res) {
    res.pipe(file);
    file.on('finish', function() {
      file.close(unpackDist);
    });
  }).on('error', function(err) {
    fs.unlink(pathDest);
    console.log(err.message);
    process.exit(1);
  });
}

function unpackDist() {
  console.log('Unpacking...');
  if (!fs.existsSync(pathInstall)) {
    fs.mkdirSync(pathInstall);
  }
  fs.createReadStream(pathDest).pipe(unzipper.Extract({ path: pathInstall }));
  console.log('Done.');
}