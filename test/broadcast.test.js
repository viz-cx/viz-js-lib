import should from 'should';
import viz from '../src/index.js';
import process from 'process';

const username = process.env.VIZ_USERNAME || 'tester3';
const password = process.env.VIZ_PASSWORD;
const postingWif = password
  ? viz.auth.toWif(username, password, 'posting')
  : '5HzkZFcvG9Gwdu2GDU2pTCmFPCg948T3kMiYBwR9jdq9xvdY4r4';

describe('viz.broadcast:', () => {
  it('exists', () => {
    should.exist(viz.broadcast);
  });

  it('has generated methods', () => {
    should.exist(viz.broadcast.award);
    should.exist(viz.broadcast.custom);
    should.exist(viz.broadcast.committeeWorkerCreateRequest);
    should.exist(viz.broadcast.committeeWorkerCancelRequest);
    should.exist(viz.broadcast.committeeVoteRequest);
    should.exist(viz.broadcast.createInvite);
    should.exist(viz.broadcast.claimInviteBalance);
    should.exist(viz.broadcast.useInviteBalance);
    should.exist(viz.broadcast.inviteRegistration);
    should.exist(viz.broadcast.setPaidSubscription);
    should.exist(viz.broadcast.paidSubscribe);
    should.exist(viz.broadcast.accountCreate);
    should.exist(viz.broadcast.delegateVestingShares);
    should.exist(viz.broadcast.accountUpdate);
  });

  it('has backing methods', () => {
    should.exist(viz.broadcast.send);
  });

  it('has promise methods', () => {
    should.exist(viz.broadcast.sendAsync);
    should.exist(viz.broadcast.customAsync);
    should.exist(viz.broadcast.transferAsync);
  });

  describe('custom operation', () => {
    it('prepare transaction', async () => {
      const tx = await viz.broadcast._prepareTransaction({
        extensions: [],
        operations: [['custom', {
          id: 'test',
          json: '{}',
        }]],
      });

      tx.should.have.properties([
        'expiration',
        'ref_block_num',
        'ref_block_prefix',
        'extensions',
        'operations',
      ]);
    });
  });

  describe('award', () => {
    it('works', async () => {
      const tx = await viz.broadcast.awardAsync(
        postingWif,
        username,
        username,
        100,
        0,
        'test js lib',
        []
      );

      tx.should.have.properties([
        'expiration',
        'ref_block_num',
        'ref_block_prefix',
        'extensions',
        'operations',
        'signatures',
      ]);
    });
  });

  it('award with callback', (done) => {
    viz.broadcast.award(
      postingWif,
      username,
      username,
      100,
      0,
      'test js lib with callback',
      [],
      (err, tx) => {
        if (err) return done(err);
        tx.should.have.properties([
          'expiration',
          'ref_block_num',
          'ref_block_prefix',
          'extensions',
          'operations',
          'signatures',
        ]);
        done();
      }
    );
  });
});
