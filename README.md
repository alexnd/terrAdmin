# terrAdmin

This application expose Terraria/tShock things to user allowing control game server over web GUI

## Setup

- Get [nodejs with npm](https://nodejs.org/en/download/)
- Clone [this](https://github.com/alexnd/terrAdmin) repo
- `npm install`
- `npm run install-terraria-server` or `npm run install-tshock`
- Review and make corrections to `config.js` and `server.cfg`, you may need to change *default credentials* (**admin**, **123456**), set ports, world file, etc
- You should place existsing `.wld` files in `Worlds` directory or set configfile `autocreate` directive to generate new world

## Run

- Type in terminal `npm start`
- Open in web browser [127.0.0.1:7878](http://127.0.0.1:7878)
- Login credentials stored in `config.js` file in `users[]` array

## Links

- [Terraria.org](https://terraria.org)
- [Terraria Server](https://terraria.gamepedia.com/Server)
- [TShock](https://github.com/Pryaxis/TShock)
- [TShock Releases](https://github.com/Pryaxis/TShock/releases)
- [Installing Tshock on Mac](https://tshock.co/xf/index.php?threads/installing-tshock-on-mac-os-x-its-possible.2110)
- [TShock command line parameters](https://tshock.readme.io/docs/command-line-parameters)

## Barebone scenario to run Terraria server

### Linux

Setup .net runtime:
```
sudo apt install mono-runtime -y
```

Crearte shell script `server.sh`:
```
#!/bin/sh
mono ./TerrariaServer/1405/Linux/TerrariaServer.exe -config ./server.cfg
```

Add execute privilegies to script:
```
chmod +x ./server.sh
```

### Mac

[Install Mono for Mac](https://www.mono-project.com/docs/getting-started/install/mac/)

Shell script `server.sh`
```
#!/bin/sh
mono ./TerrariaServer/1405/Mac/Terraria\ Server.app/Contents/MacOS/TerrariaServer.exe -config ./server.cfg
```

### Windows

Create runnable `.bat` file with next content:

```
TerrariaServer\1405\Windows\TerrariaServer.exe -config server.cfg
```

## Docker way (under construction)

```
docker build -t terradmin .
docker run terradmin
```

## TODO

- Separate dockers for terrAdmin and game server, resolve admin-server control
