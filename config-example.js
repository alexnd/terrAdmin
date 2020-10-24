module.exports = {
  httpPort: 7878,
  httpAddr: '0.0.0.0',

  // mac
  // terrariaDir: './TerrariaServer/1411/Mac/Terraria Server.app/Contents/MacOS',

  // linux
  terrariaDir: './TerrariaServer/1411/Linux',

  // windows
  // terrariaDir: 'TerrariaServer/1411/Windows',

  // tshock
  // terrariaDir: './TerrariaServer/tshock',

  terrariaExe: 'TerrariaServer.exe',

  sessionSecret: 'fooBar42',
  staticPath: 'pub',
  users: [
    {login: 'admin', password: '123456'}
  ]
}