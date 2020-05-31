// terrAdmin control panel public bundle build script
// (c) 2020 Alexnd

var fs = require('fs');
var path = require('path');
var nodeModulesDir = 'node_modules';
var pubDir = 'pub';

// check if node_modules exists
if (!fs.existsSync(path.join(__dirname, nodeModulesDir))) {
  console.log('Dir ' + nodeModulesDir + ' not exist');
  process.exit(1);
}

// copy bootstrap from node_modules
var deps = [
  {
    path: 'jquery/dist/',
    files: [
      'jquery.js',
      'jquery.min.js',
      'jquery.min.map'
    ]
  },
  {
    path: 'bootstrap/dist/js',
    files: [
      'bootstrap.js',
      'bootstrap.min.js',
      'bootstrap.js.map',
      'bootstrap.min.js.map'
    ]
  },
  {
    path: 'bootstrap/dist/css',
    files: [
      'bootstrap.css',
      'bootstrap.css.map',
      'bootstrap.min.css'
    ]
  }
];

var pubPath = path.join(__dirname, pubDir);
deps.forEach(function(dep) {
  var depPath = path.join(__dirname, nodeModulesDir, dep.path);
  dep.files.forEach(function(file) {
    console.log('*', file);
    fs.copyFileSync(path.join(depPath, file), path.join(pubPath, file));
  });
});

console.log('done.');