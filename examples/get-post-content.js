import { api } from '../lib';

const resultP = api.getContentAsync('pal', '2scmtp-test');
resultP.then(result => console.log(result));
