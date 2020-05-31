// terrAdmin 3-d party (Terraria [tm]) server installation script
// (c) 2020 Alexnd

var urlDist = 'https://terraria.org/system/dedicated_servers/archives/000/000/038/original/terraria-server-1404.zip?1590407239';
var dest = 'TerrariaServer.zip';
var installDir = 'TerrariaServer';

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
  fs.createReadStream(pathDest).pipe(unzipper.Extract({ path: pathInstall }));
  console.log('Done.');
}