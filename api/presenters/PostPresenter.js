var postRelations = (userId, opts) => _.filter([
  {creator: qb => qb.column('id', 'name', 'avatar_url')},
  {communities: qb => qb.column('community.id', 'name', 'slug', 'avatar_url')},
  'contributions',
  {'contributions.user': qb => qb.column('id', 'name', 'avatar_url')},
  'followers',
  {'followers.user': qb => qb.column('id', 'name', 'avatar_url')},
  'media',
  (opts && opts.fromProject ? null : {projects: qb => qb.column('projects.id', 'title', 'slug')}),
  {votes: qb => { // only the user's own vote
    qb.column('id', 'post_id')
    qb.where('user_id', userId)
  }},
  {relatedUsers: qb => qb.column('users.id', 'name', 'avatar_url')}
], x => !!x)

var postAttributes = post => {
  var creator = post.relations.creator

  return _.extend(
    _.pick(post.toJSON(), [
      'id',
      'name',
      'description',
      'fulfilled_at',
      'type',
      'created_at',
      'updated_at',
      'projects',
      'similarity',
      'start_time',
      'end_time'
    ]),
    {
      communities: post.relations.communities.map(c => c.pick('id', 'name', 'slug', 'avatar_url')),
      contributors: post.relations.contributions.map(c => c.relations.user.pick('id', 'name', 'avatar_url')),
      followers: post.relations.followers.map(f => f.relations.user.pick('id', 'name', 'avatar_url')),
      media: post.relations.media.map(m => m.pick('name', 'type', 'url', 'thumbnail_url')),
      myVote: post.relations.votes.length > 0,
      numComments: post.get('num_comments'),
      votes: post.get('num_votes'),
      user: creator && creator.pick('id', 'name', 'avatar_url'),
      relatedUsers: post.relations.relatedUsers.map(u => u.pick('id', 'name', 'avatar_url')),
      public: post.get('visibility') === Post.Visibility.PUBLIC_READABLE
    }
  )
}

// this supports a pattern we're using for infinite scrolling.
// we just keep reporting how many posts there are in total,
// and the front-end keeps track of how many posts it has so far
// so that it knows when to stop expecting more.
// we can't always use a naive approach to pagination, because
// the order of results could shift while searching.
var mapPresentWithTotal = function (posts) {
  return {
    posts_total: (posts.first() ? Number(posts.first().get('total')) : 0),
    posts: posts.map(PostPresenter.present)
  }
}

var PostPresenter = module.exports = {
  relations: postRelations,
  present: postAttributes,
  mapPresentWithTotal: mapPresentWithTotal
}
