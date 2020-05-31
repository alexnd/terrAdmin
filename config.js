module.exports = {
  httpPort: 7878,
  httpAddr: '0.0.0.0',

  // mac
  // terrariaDir: './TerrariaServer/1404/Mac/Terraria Server.app/Contents/MacOS',

  // linux
  terrariaDir: './TerrariaServer/1404/Linux',

  // windows
  // terrariaDir: 'TerrariaServer/1404/Windows',

  // tshock
  // terrariaDir: './TerrariaServer/tshock',

  terrariaExe: 'TerrariaServer.exe',

  sessionSecret: 'fooBar42',
  staticPath: 'pub',
  worldFile: 'NewWorld.wld',
  users: [
    {login: 'admin', password: '123456'}
  ]
}