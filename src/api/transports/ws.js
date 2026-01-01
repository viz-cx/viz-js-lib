import Promise from 'bluebird';
import isNode from 'detect-node';
import newDebug from 'debug';
import config from '../../config.js';
import Transport from './base.js';

const debug = newDebug('viz:ws');

let WebSocket;
async function getWebSocket() {
  if (WebSocket) return WebSocket;
  if (isNode) {
    const { default: ws } = await import('ws');
    WebSocket = ws;
  } else if (typeof window !== 'undefined') {
    const { WebSocket: WS } = window;
    WebSocket = WS;
  } else {
    throw new Error("Couldn't decide on a `WebSocket` class");
  }
  return WebSocket;
}

export default class WsTransport extends Transport {
  constructor(options = {}) {
    super(Object.assign({id: 0}, options));
    this._requests = new Map();
    this.inFlight = 0;
    this.isOpen = false;
  }

  async start() {
    if (this.startPromise) {
      return this.startPromise;
    }

    const WS = await getWebSocket();

    this.startPromise = new Promise((resolve, reject) => {
      this.ws = new WS(config.get('websocket'));
      this.ws.onerror = (err) => {
        this.startPromise = null;
        reject(err);
      };
      this.ws.onopen = () => {
        this.isOpen = true;
        this.ws.onerror = this.onError.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        resolve();
      };
    });
    return this.startPromise;
  }

  stop() {
    debug('Stopping...');
    this.startPromise = null;
    this.isOpen = false;
    this._requests.clear();
    if (this.ws) {
      this.ws.onerror = this.ws.onmessage = this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  async send(api, data, callback) {
    debug('VIZ::send', api, data);
    await this.start();
    const deferral = {};
    new Promise((resolve, reject) => {
      deferral.resolve = (val) => {
        resolve(val);
        callback(null, val);
      };
      deferral.reject = (val_1) => {
        reject(val_1);
        callback(val_1);
      };
    });
    const _request = {
      deferral,
      startedAt: Date.now(),
      message: {
        id: data.id || this.id++,
        method: 'call',
        jsonrpc: '2.0',
        params: [api, data.method, data.params]
      }
    };
    this.inFlight++;
    this._requests.set(_request.message.id, _request);
    this.ws.send(JSON.stringify(_request.message));
    return deferral;
  }

  onError(error) {
    for (const _request of this._requests.values()) {
      _request.deferral.reject(error);
    }
    this.stop();
  }

  onClose() {
    const error = new Error('Connection was closed');
    for (const _request of this._requests.values()) {
      _request.deferral.reject(error);
    }
    this._requests.clear();
  }

  onMessage(websocketMessage) {
    const message = JSON.parse(websocketMessage.data);
    debug('-- VIZ.onMessage -->', message.id);
    if (!this._requests.has(message.id)) {
      throw new Error(`Panic: no request in queue for message id ${message.id}`);
    }
    const _request = this._requests.get(message.id);
    this._requests.delete(message.id);
    const errorCause = message.error;
    if (errorCause) {
      const err = new Error(
        `${errorCause.message || 'Failed to complete operation'
        } (see err.payload for the full error payload)`
      );
      err.payload = message;
      _request.deferral.reject(err);
    } else {
      this.emit('track-performance', _request.message.method, Date.now() - _request.startedAt);
      _request.deferral.resolve(message.result);
    }
  }
}
