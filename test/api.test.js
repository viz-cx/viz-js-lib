import assert from 'assert';
import makeStub from 'mocha-make-stub';
import should from 'should';

import viz, { VIZ } from '../src/api/index.js';
import config from '../src/config.js';
import testPost from './test-post.json'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('viz.api:', function () {
  this.timeout(30 * 1000);

  describe('new VIZ', () => {
    it('doesn’t open a connection until required', () => {
      assert(!viz.ws);
      assert(!new VIZ().ws);
    });

    it('opens a connection on demand', async () => {
      const s = new VIZ();
      assert(!s.ws);
      s.start();
      await Promise.resolve();
      assert(s.ws);
    });
  });

  describe('setWebSocket', () => {
    it('works', () => {
      viz.setWebSocket('ws://localhost');
      config.get('websocket').should.eql('ws://localhost');
    });
  });

  beforeEach(async () => {
    await viz.apiIdsP;
  });

  describe('getFollowers', () => {
    it('works', async () => {
      const result = await viz.getFollowersAsync('viz', 0, 'blog', 1);
      result.should.have.length(1);
    });
  });

  describe('getContent', () => {
    it('works', async () => {
      const result = await viz.getContentAsync('pal', '2scmtp-test');
      result.should.have.properties(testPost);
    });
  });

  describe('streamBlockNumber', () => {
    it('streams blocks', (done) => {
      let i = 0;
      const release = viz.streamBlockNumber((_, block) => {
        should.exist(block);
        block.should.be.a.Number();
        if (++i === 2) {
          release();
          done();
        }
      });
    });
  });

  describe('reconnect on ws close', () => {
    const originalStart = VIZ.prototype.start;
    makeStub(VIZ.prototype, 'start', function () {
      return originalStart.apply(this, arguments);
    });

    const originalStop = VIZ.prototype.stop;
    makeStub(VIZ.prototype, 'stop', function () {
      return originalStop.apply(this, arguments);
    });

    it('reconnects automatically', async () => {
      const api = new VIZ();
      await api.getFollowersAsync('viz', 0, 'blog', 1);
      await delay(1000);

      api.ws.emit('close');

      assert(api.stop.calledOnce);

      await api.getFollowersAsync('viz', 0, 'blog', 1);
      assert(api.ws);
      assert(api.isOpen);
    });
  });
});
