const EventEmitter = require('events');

class NslbBridge extends EventEmitter {
    constructor(nslbSocket1, nslbSocket2) {
        super();

        this._nSocket1 = nslbSocket1;
        this._nSocket2 = nslbSocket2;

        let _destroyBridge;

        let selfOnBrokenClient = function() {
            _destroyBridge();
            this._nSocket1.removeListener('broken', selfOnBrokenClient);
            this.emit('brokenClient');
        }.bind(this);

        let selfOnBrokenUpstream = function() {
            _destroyBridge();
            this._nSocket2.removeListener('broken', selfOnBrokenUpstream);
            this.emit('brokenUpstream');
        }.bind(this);

        _destroyBridge = function() {

            if (this._nSocket1.isConnected()) this._nSocket1.unpipe(this._nSocket2);
            if (this._nSocket2.isConnected()) this._nSocket2.unpipe(this._nSocket1);
        }.bind(this);

        if (nslbSocket1.isConnected() && nslbSocket2.isConnected()) {
            nslbSocket1.pipe(nslbSocket2);
            nslbSocket2.pipe(nslbSocket1);
            nslbSocket1.on('broken', selfOnBrokenClient);
            nslbSocket2.on('broken', selfOnBrokenUpstream);
        }
    }
}

module.exports = NslbBridge;