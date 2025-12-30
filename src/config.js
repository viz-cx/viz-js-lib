import config from '../config.json' with { type: 'json' };

export default (function () {
  const get = (key) => config[key];
  const set = (key, value) => {
    config[key] = value;
  };
  return { get, set };
})();
