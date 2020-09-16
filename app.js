// terrAdmin control panel server (by default on 7878 port),
// to control 3-d party (Terraria [tm]) game server instance

"use strict";

const process = require('process')
const childProcess = require('child_process')
const os = require('os') 
const path = require('path')
const fs = require('fs')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const exhbs  = require('express-handlebars')
const session = require('express-session')
const zip = require('express-zip')
const bcrypt = require('bcrypt')
const markdown = require('markdown').markdown
const configExist = fs.existsSync('./config.js')
const cfg = require(configExist ? './config' : './config-example')
const packageConfig = require('./package.json')

const terrariaDir = process.env.WORKDIR || cfg.terrariaDir
const terrariaExe = process.env.EXEFILE || cfg.terrariaExe
const sessionSecret = process.env.SESSECRET || cfg.sessionSecret
const staticPath = process.env.STATICPATH || cfg.staticPath
const configFile = process.env.CONFIGFILE || 'server.cfg'

var worldFile = ''
var authCode = ''
var tPs = null // Terraria child process
var exitState = false
var logTimestamp = null
var authorizations = {}
var configFileData = ''
var logFile = ''

const isWin = /^win/i.test(os.platform())
const isMac = /^dar/i.test(os.platform())

process.title = 'terrAdmin'

// clean Terraria logs
const logsPath = path.join(__dirname, 'logs')
const files = fs.readdirSync(logsPath)
if (files) {
  files.forEach(file => {
    if (file !== '.gitkeep') {
      fs.unlinkSync(path.join(logsPath, file))
    }
  })
}

const ex = express()

ex.use(bodyParser.urlencoded({extended: false}))
ex.use(bodyParser.json())
// ex.use(bodyParser.raw(options))
// ex.use(bodyParser.text(options))
// ex.use(cookieParser())
ex.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false
}))
ex.engine('.html', exhbs({extname: '.html'}))
ex.set('view engine', '.html');

// logging
ex.use((req, res, next) => {
  console.log(dtFormat(), req.connection.remoteAddress, req.method, req.url)
  next()
})

ex.use(express.static(staticPath))

// authorization middleware

const checkAuth = (req, res, next) => {
  console.log('*sid', req.session.id)
  if (req.session.user) {
    next(null)
    return
  }
  let k
  if (req.headers['authorization'] !== undefined) {
    let h = req.headers['authorization'].split(' ')
    if (h.length > 1 && !!(typeof h[1] === 'string' && h[1].match(/^[a-zA-Z0-9\-]{3,}$/))) {
      k = h[1]
    }
  } else if (req.query.authkey) {
    k = req.query.authkey
  } else if (req.method == 'POST' && (req.body.authkey && req.body.authkey.length > 2)) {
    k = req.body.authkey
  }
  if (k && authorizations[k] !== undefined) {
    next(null)
    return
  } else if (req.method == 'POST' && (
    req.body.username && req.body.username.length > 2 &&
    req.body.password && req.body.password.length > 2 ))
  {
    console.log('*username', req.body.username)
    console.log('*password', req.body.password)
    let auth = cfg.users.find(u => {
      const r = u.login === req.body.username && u.password === req.body.password
      console.log('*user match', u, r)
      return r
    })
    if (auth) {
      authorizations[req.session.id] = auth
      req.session.user = req.body.username
      next(null)
      return
    }
  }
  console.log('*not auth')
  res.redirect(301, '/login')
}

// routes

ex.get('/', checkAuth, (req, res) => {
  res.render('main', {
    title: process.title,
    online: tPs,
    offline: !tPs,
    authCode,
    initData: JSON.stringify({
      user: !!req.session.user
    })
  })
})

ex.post('/', checkAuth, (req, res) => {
  res.redirect(301, '/')
})

ex.get('/login', (req, res) => {
  res.render('login', { title: process.title })
})

ex.get('/auth', (req, res) => {
  res.json({ user: !!req.session.user })
})

ex.get('/logout', checkAuth, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err)
      res.send('error')
    } else {
      res.redirect(301, '/login')
    }
  })
})

ex.get('/restartapp', (req, res) => {
  res.send('bye')
  setTimeout(() => {
    process.on('exit', () => {
      childProcess.spawn(process.argv.shift(), process.argv, {
        cwd: process.cwd(),
        detached: true,
        stdio: 'inherit'
      })
    })
    process.exit()
  }, 2600)
})

ex.get('/start', checkAuth, (req, res) => {
  if (tPs) {
    res.send('Terraria server already running.')
  } else {
    tPs = spawnTerraria()
    exitState = false
    if (tPs) res.send('Terraria server started.')
    else res.send('Error spawning Terraria server.')
  }
})

ex.get('/stop', checkAuth, (req, res) => {
  if (tPs) {
    // tPs.stdin.write('exit\r\n')
    // tPs.stdin.end()
    exitState = true
    tPs.kill('SIGHUP')
    // tPs.kill('SIGINT')
    res.send('Terraria server stopped.')
  } else {
    res.send('Terraria server not running.')
  }
})

ex.get('/restart', checkAuth, (req, res) => {
  restartTerraria()
  res.send('done.')
})

ex.get('/changeworld', checkAuth, (req, res) => {
  if (req.query.world) {
    worldFile = req.query.world
    updateTerrariaWorldConfig(err => {
      if (!err) restartTerraria()
      res.send(err ? 'error' : 'done')
    })
  } else {
    res.send('error: no world')
  }
})

ex.post('/changeworld', checkAuth, (req, res) => {
  if (req.body.world) {
    worldFile = req.body.world
    updateTerrariaWorldConfig(err => {
      if (!err) restartTerraria()
      res.send(err ? 'error' : 'done')
    })
  } else {
    res.send('error: no world')
  }
})

ex.get('/backup', checkAuth, (req, res) => {
  const path1 = path.join(__dirname, worldFile)
  const isExist = fs.existsSync(path1)
  if (isExist) {
    res.zip(
      [
        { path: path1, name: worldFile }
        // , { path: path.join(__dirname, `${worldFile}.bak`), name: `${worldFile}.bak` }
      ],
      `${path.basename(worldFile)}.zip`
    )
  } else {
    res.send('Error reading worldfile.')
  }
})

ex.get('/stats', checkAuth, (req, res) => {
  listTerrariaWorlds((err, worlds) => {
    if (err) {
      res.json({error: err})
    } else {
      res.json({
        version: packageConfig.version,
        status: tPs,
        authCode: authCode,
        world: worldFile,
        worldPath: path.join(__dirname, terrariaDir),
        worlds: worlds,
        configFile: configFileData
      })
    }
  })
})

ex.get('/logs', checkAuth, (req, res) => {
  if (tPs) {
    const logsPath = path.join(__dirname, 'logs')
    fs.readdir(logsPath, (err, files) => {
      let logPath = ''
      files.forEach(file => {
        if (file !== '.gitkeep') {
          if (!logPath) {
            logFile = file
            logPath = path.join(logsPath, file)
          }
        }
      })
      if (logPath) {
        fs.readFile(logPath, 'utf8', (err, data) => {
          if (err) {
            console.log('*error read logfile', logPath)
            res.send('cannot read logfile')
          } else {
            res.send(data)
          }
        })
      } else {
        res.send('no logfile found')
      }
    })
  } else {
    res.send('no running server')
  }
})

ex.get('/logfiles', checkAuth, (req, res) => {
  const logsPath = path.join(__dirname, 'logs')
  fs.readdir(logsPath, (err, files) => {
    if (err) {
      res.json({current: logFile, error: err.message || 'unknown error'})
      return
    }
    res.json({
      current: logFile,
      logdir: files.filter(f => f.match(/\.log$/i) && f !== logFile)
    })
  })
})

ex.get('/configapp', checkAuth, (req, res) => {
  res.set('Content-Type', 'text/plain')
  res.sendFile(path.join(__dirname, configExist ? 'config.js' : 'config-example.js'))
})

ex.post('/configapp', checkAuth, (req, res) => {
  if (req.body.configapp) {
    fs.writeFileSync(
      path.join(__dirname, configExist ? 'config.js' : 'config-example.js'),
      req.body.configapp
    )
    res.send('DONE')
  } else {
    res.send('FAIL')
  }
})

ex.get('/config', checkAuth, (req, res) => {
  res.set('Content-Type', 'text/plain')
  res.sendFile(path.join(__dirname, configFile))
})

ex.post('/config', checkAuth, (req, res) => {
  if (req.body.config) {
    fs.writeFileSync(
      path.join(__dirname, configFile),
      req.body.config
    )
    parseTerrariaConfig()
    res.send('DONE')
  } else {
    res.send('FAIL')
  }
})

ex.get('/help', (req, res) => {
  fs.readFile(path.join(__dirname, 'README.md'), 'utf8', (err, data) => {
    if (err) {
      res.send('cannot read README.md')
    } else {
      res.send(markdown.toHTML(data))
    }
  })
})

console.log(`Started ${process.title} in ${__dirname}`)

const httpServer = http.createServer(ex)
const port = process.env.PORT || cfg.httpPort
const addr = process.env.ADDR || cfg.httpAddr

parseTerrariaConfig()
// update()

httpServer.listen(port, addr, () => {
  console.log(`Listening on ${addr}:${port}`)
})

// Core functions

function spawnTerraria() {
  // relative path: path.relative(path.join(__dirname, terrariaDir), path.join(__dirname, configFile))
  const exePath = path.relative(__dirname, path.join(__dirname, terrariaDir, terrariaExe))
  console.log('*exePath', exePath)
  const args = [
    terrariaExe,
    '-config',
    `./${configFile}`,
    '-logfile',
    './logs',
    '-logclear',
    'true',
    '-logerrors'
  ]
  if (!isWin) args.splice(0, 0, exePath)
  var ch = childProcess.execFile(
    isWin ? exePath : 'mono',
    args,
    {
      cwd: __dirname
    }
  )
  const ts = tsToSqldate(Date.now() + 1001)
  logTimestamp = ts.replace(/:/g, '-').replace(' ', '_') // 'YYYY-MM-DD_hh-mm-ss'
  // console.log('***', ts, logTimestamp)
  process.stdin.pipe(ch.stdin)
  ch.unref()
  ch.stdout.on('data', data => {
    const s = data.toString()
    const m = s.match(/join the game and type \/auth (\d+)/i)
    if (m) {
      authCode = m[1]
    }
    console.log(s)
  })
  ch.on('close', code => {
    console.log(`${terrariaExe} exited with code ${code}`)
    authCode = ''
    if (code !== 0 && !exitState) {
      // uninential exit, restart needed
      tPs = spawnTerraria()
    } else {
      tPs = null
    }
  })
  return ch
}

function restartTerraria() {
  if (tPs) {
    // tPs.stdin.write('exit\r\n')
    // tPs.stdin.end()
    exitState = true
    tPs.kill('SIGHUP')
    // tPs.kill('SIGINT')
    setTimeout(() => {
      tPs = spawnTerraria()
    }, 2000)
  } else {
    tPs = spawnTerraria()
  }
}

function parseTerrariaConfig() {
  fs.readFile(path.join(__dirname, configFile), 'utf8', (err, data) => {
    configFileData = data
    if (err) {
      console.log('*[config read error]')
    } else {
      // const re = RegExp('^world=(.*)', 'm');
      const m = data.match(/^world=(.*)/m)
      if (m && m.length) {
        const i = m[0].indexOf('world=')
        worldFile = m[0].substr(m[0].indexOf('world=') + 6)
        console.log('*[world]', worldFile)
      }
    }
  })
}

function listTerrariaWorlds(cb) {
  fs.readdir(path.join(__dirname, 'Worlds'), (err, files) => {
    if (err) {
      console.log('*err', err)
      cb('Cannot read dir')
      return
    }
    cb(null, files.filter(file => file.match(/\.wld$/)))
  })
}

function listTerrariaLogs(cb) {
  fs.readdir(path.join(__dirname, 'logs'), (err, files) => {
    if (err) {
      console.log('*err', err)
      cb('Cannot read dir')
      return
    }
    cb(null, files.filter(file => file.match(/\.log$/)))
  })
}

function updateTerrariaWorldConfig(cb) {
  const configPath = path.join(__dirname, configFile)
  fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
      cb(err)
    } else {
      let newData
      if (data.match(/^world=.*/m)) {
        newData = data.replace(/^world=.*$/m, `world=${worldFile}`)
      } else {
        newData = `\r\nworld=${worldFile}`
      }
      fs.writeFile(configPath, newData, cb)
    }
  })
}

// main loop
function update() {
// check ps list for existing game server process
// settimeout
}

const testRes = (req, res) => {
  res.sendFile(app.path.join(__dirname, 'login.html'))
}

const dtFormat = (t, hmonth, format) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (undefined === t) var t = Date.now()
  if (undefined === hmonth) var hmonth = false
  var d = new Date(t), s = ((d.getDate() < 10) ? ('0' + d.getDate()) : d.getDate()) + '.' +
    ((hmonth) ?
      months[d.getMonth()] :
      ((d.getMonth() + 1 < 10) ? ('0' + (d.getMonth() + 1)) : (d.getMonth() + 1))) + '.' +
    d.getFullYear() + '/' +
    ((d.getHours() < 10) ? ('0' + d.getHours()) : d.getHours()) + ':' +
    ((d.getMinutes() < 10) ? ('0' + d.getMinutes()) : d.getMinutes()) + ':' +
    ((d.getSeconds() < 10) ? ('0' + d.getSeconds()) : d.getSeconds())
  return s
}

const tsToSqldate = _v => {
  var v = _v || Date.now()
  var d = new Date(v)
  var m = d.getMonth() - 1
  return d.getFullYear() + '-' + 
  ((d.getMonth() + 1 < 10) ? ('0' + (d.getMonth() + 1)) : (d.getMonth() + 1)) + '-' +
  ((d.getDate() < 10) ? ('0' + d.getDate()) : d.getDate()) + ' ' +
  ((d.getHours() < 10) ? ('0' + d.getHours()) : d.getHours()) + ':' +
  ((d.getMinutes() < 10) ? ('0' + d.getMinutes()) : d.getMinutes()) + ':' + 
  ((d.getSeconds() < 10) ? ('0' + d.getSeconds()) : d.getSeconds())
}
