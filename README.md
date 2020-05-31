# terrAdmin

This application expose Terraria/tShock things to user allowing control game server with web GUI

## Setup

- get [nodejs with npm](https://nodejs.org/en/download/)
- clone [this](https://github.com/alexnd/terrAdmin) repo
- `npm install`
- `npm run install-terraria-server` or `npm run install-tshock`

Review and make corrections to `config.js` and `server.cfg`

You may need to change default credetials (admin, 123456), set ports, world file

You should place existsing `.wld` files in `Worlds` directory or set configfile `autocreate` directive to generate new world

## Run

- in terminal `npm start`
- open in web browser [127.0.0.1:7878](http://127.0.0.1:7878)
- login credentials are in `config.js` in `users[]`

## Links

- [Terraria.org](https://terraria.org)
- [Terraria Server](https://terraria.gamepedia.com/Server)
- [Installing Tshock on Mac](https://tshock.co/xf/index.php?threads/installing-tshock-on-mac-os-x-its-possible.2110)
- [TShock](https://github.com/Pryaxis/TShock/releases/tag/v4.4.0-pre8)
- [TShock command line parameters](https://tshock.readme.io/docs/command-line-parameters)

## Barebone scenario to run Terraria server

### Linux

```
sudo apt install mono-runtime -y
mono ./TerrariaServer/1404/Linux/TerrariaServer.exe -config ./server.cfg
```

### Mac

[Install Mono for Mac](https://www.mono-project.com/docs/getting-started/install/mac/)

```
mono ./TerrariaServer/1404/Mac/Terraria\ Server.app/Contents/MacOS/TerrariaServer.exe -config ./server.cfg
```

### Windows

Create runnable `.bat` file with next content:

```
TerrariaServer\1404\Windows\TerrariaServer.exe -config server.cfg
```

## Docker way (under construction)

```
docker build -t terradmin .
docker run terradmin
```
