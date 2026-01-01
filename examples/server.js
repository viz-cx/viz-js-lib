import { api } from '../lib';

api.getAccountCount((err, result) => {
  console.log(err, result);
});

api.getAccounts(['dan'], (err, result) => {
  console.log(err, result);
});

api.getState('trending/viz', (err, result) => {
  console.log(err, result);
});

api.getFollowing('ned', 0, 'blog', 10, (err, result) => {
  console.log(err, result);
});

api.getFollowers('dan', 0, 'blog', 10, (err, result) => {
  console.log(err, result);
});

api.streamOperations((err, result) => {
  console.log(err, result);
});

api.getDiscussionsByActive({
  limit: 10,
  start_author: 'thecastle',
  start_permlink: 'this-week-in-level-design-1-22-2017'
}, (err, result) => {
  console.log(err, result);
});
