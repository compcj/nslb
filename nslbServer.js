const net = require('net');
const async = require('async');
const NslbSocket = require('./nslbSocket');
const NslbBridge = require('./nslbBridge');
const CronJob = require('cron').CronJob;

class NslbServer {
    constructor(listenPort, serverList) {
        this.listenPort = listenPort;
        this.originalServerList = this.serverList = serverList;

        this._server = null;
    }

    _tryCreateConnection(server, connectionCb) {
        let nSocket = new NslbSocket();
        nSocket.tryConnect(server.port, server.host, (err) => {
            if (err == null) {
                connectionCb(null, nSocket);
            } else {
                connectionCb(err);
            }
        })
    }

    _reorderServerList(server) {
        for (let i = 0; i < this.serverList.length; i++) {
            if (server.host == this.serverList[i].host &&
                server.port == this.serverList[i].port) {
                this.serverList.splice(i, 1);
                this.serverList.unshift(server);
            }
        }
    }

    _getActiveSocket(nSocket, activeSocketCb) {
        if (nSocket._currentActive != null)
            activeSocketCb(null, nSocket._currentActive);
        async.reduce(this.serverList, null, (activeSocket, server, cb) => {
            if (activeSocket != null) return cb(null, activeSocket);
            this._tryCreateConnection(server, (err, activeNsocket) => {
                if (err == null && activeNsocket != null) {
                    this._reorderServerList(server);
                    nSocket._currentActive = activeNsocket;
                    activeNsocket.on('broken', () => { nSocket._currentActive = null; });
                    cb(null, activeNsocket);
                } else {
                    cb();
                }
            });
        }, function(err, activeSocket) {
            if (err != null) {
                activeSocketCb(err);
            } else {
                activeSocketCb(null, activeSocket);
            }
        });
    }

    _bindActive(nSocket) {
        this._getActiveSocket(nSocket, (err, activeNsocket) => {
            if (err == null && activeNsocket != null) {

                let nslbBridge = new NslbBridge(nSocket, activeNsocket);
                nslbBridge.on('brokenUpstream', () => {

                    this._bindActive(nSocket);
                });
            } else {
                nSocket.endConnection();
            }
        });
    }

    start() {
        this._server = net.createServer((socket) => {
            this._bindActive(new NslbSocket(socket));
        });

        this._server.listen(this.listenPort, () => {
            console.log('Server ' + this.listenPort, ' started.');
        });

        new CronJob('0 30 * * * *', function() {
            this.serverList = this.originalServerList;
        }.bind(this), null, true, 'Asia/Shanghai');
    }
}

module.exports = NslbServer;