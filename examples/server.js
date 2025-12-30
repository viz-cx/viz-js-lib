const viz = require('../lib');

viz.api.getAccountCount((err, result) => {
	console.log(err, result);
});

viz.api.getAccounts(['dan'], (err, result) => {
	console.log(err, result);
});

viz.api.getState('trending/viz', (err, result) => {
	console.log(err, result);
});

viz.api.getFollowing('ned', 0, 'blog', 10, (err, result) => {
	console.log(err, result);
});

viz.api.getFollowers('dan', 0, 'blog', 10, (err, result) => {
	console.log(err, result);
});

viz.api.streamOperations((err, result) => {
	console.log(err, result);
});

viz.api.getDiscussionsByActive({
  limit: 10,
  start_author: 'thecastle',
  start_permlink: 'this-week-in-level-design-1-22-2017'
}, (err, result) => {
	console.log(err, result);
});
