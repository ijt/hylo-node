var striptags = require('striptags'),
  truncate = require('html-truncate');

module.exports = (req, res, next) => {
  var url = require('url').parse(req.url, true);
  if (!isBot(url, req.headers['user-agent'])) return next();

  matchingProject(url)
  .then(project =>
    project && renderProject(project, res))
  .then(done => done || matchingPost(url).then(post =>
    post && renderPost(post, res)))
  .then(done => done || next());
};

var isBot = function(url, userAgent) {
  if (!userAgent) return false;
  if (_.has(url.query, '_escaped_fragment_')) return true;

  userAgent = userAgent.toLowerCase();
  return crawlerUserAgents.some(u => userAgent.contains(u));
};

var crawlerUserAgents = [
  'facebookexternalhit',
  'slackbot',
  'twitterbot'
];

var matchingProject = Promise.method(url => {
  var match = url.pathname.match(projectPathPattern);
  if (!match) return;
  return Project.find(match[1]).then(project =>
    project && project.isPublic() && project);
});

var matchingPost = Promise.method(url => {
  var match = url.pathname.match(postPathPattern);
  if (!match) return;
  return Post.find(match[1]).then(post =>
    post && post.isPublic() && post);
});

var renderProject = function(project, res) {
  res.render('openGraphTags', {
    title: project.get('title'),
    description: project.get('intention'),
    image: project.get('image_url') || project.get('thumbnail_url')
  });
  return true;
};

var renderPost = function(post, res) {
  res.render('openGraphTags', {
    title: post.get('name'),
    description: truncate(striptags(post.description || ''), 140),
    image: post.get('image_url')
  });
  return true;
};

var projectPathPattern = new RegExp("^/project/([^/]+)"),
  postPathPattern = new RegExp("^/c/[^/]+/s/([^/]+)");
