import { auth, broadcast } from '../lib';

const username = process.env.VIZ_USERNAME;
const password = process.env.VIZ_PASSWORD;
const wif = auth.toWif(username, password, 'posting');

broadcast
  .upvote(
    wif,
    username,
    'pal',
    '2scmtp-test',
    null,
    (err, result) => {
      console.log(err, result);
    }
  );
