const config = require('./config.json');
const NslbServer = require('./nslbServer');

const serverList = config.serverList;
const listenPort = config.listenPort;

process.setMaxListeners(0);
let nslbServer = new NslbServer(listenPort, serverList);

nslbServer.start();

