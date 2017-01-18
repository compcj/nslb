const net = require('net');
const EventEmitter = require('events');

class NslbSocket extends EventEmitter {
    constructor(socket) {
        super();
        this._resetConnectionStatus();
        this._socket = null;
        this._currentActiveUpstream = null;

        if (socket != null) { //socket wrapper
            this._connected = true;
            this._socket = socket;
            socket.setNoDelay();
            this._setupCloseHandler();
        }
    }

    pipe(nslbSocket, options) {
        this._socket.pipe(nslbSocket._socket, options);
    }

    unpipe(nslbSocket) {
        this._socket.unpipe(nslbSocket._socket);
    }
    _resetConnectionStatus() {
        this._connected = false;
        this._connecting = false;
    }
    _onConnectionBroken() {
        this.emit('broken');
        this._resetConnectionStatus();
        this._socket = null;
    }
    _setupCloseHandler(connectCb) {
        this._socket.on('error', () => {}); //do nothing
        this._socket.on('close', () => {
            if (this._connecting == true) {
                this._connecting = false;
                this._connected = false;
                connectCb('connection closed');
            } else {
                this._onConnectionBroken();
            }
        });
    }

    tryConnect(port, host, connectCb) {
        this._connecting = true;
        this._socket = net.createConnection(port, host, () => {
            this._connecting = false;
            this._connected = true;
            connectCb(null);
        });
        this._socket.setNoDelay();
        this._setupCloseHandler(connectCb);
    }

    isConnected() {
        return this._connected;
    }

    endConnection() {
        if (this.isConnected()) {
            this._connected = false;
            this._socket.end();
            this._socket = null;
        }
    }

}

module.exports = NslbSocket;
