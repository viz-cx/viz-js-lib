import api from './api/index.js';
import auth from './auth/index.js';
import * as broadcast from './broadcast/index.js';
import formatter from './formatter.js';
import * as memo from './auth/memo.js';
import * as aes from './auth/ecc/src/aes.js';
import config from './config.js';
import * as utils from './utils.js';

const viz = {
  api,
  auth,
  broadcast,
  config,
  formatter,
  memo,
  aes,
  utils
};

if (typeof window !== 'undefined') {
  window.viz = viz;
}

if (typeof global !== 'undefined') {
  global.viz = viz;
}

export default viz;
