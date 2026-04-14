const { prisma } = require('../prisma/client');

/**
 * Social Controller - Handles Posts, Likes, and Comments
 */

// GET /social/posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
        likes: {
          where: { userId: req.user?.id || '' },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedPosts = posts.map(p => ({
      ...p,
      isLiked: p.likes.length > 0,
      likeCount: p._count.likes,
      commentCount: p._count.comments
    }));

    res.json(formattedPosts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts', details: err.message });
  }
};

// POST /social/like
exports.toggleLike = async (req, res) => {
  const { postId } = req.body;
  const userId = req.user.id;

  try {
    // Unique constraint on model handles duplicates
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } }
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.like.create({ data: { userId, postId } });
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like', details: err.message });
  }
};

// POST /social/comment
exports.addComment = async (req, res) => {
  const { postId, content } = req.body;
  const userId = req.user.id;

  if (!content) return res.status(400).json({ error: 'Comment content is required' });

  try {
    const comment = await prisma.comment.create({
      data: { userId, postId, content },
      include: { user: { select: { name: true } } }
    });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment', details: err.message });
  }
};

// GET /social/posts/:id/comments
exports.getComments = async (req, res) => {
  const { id } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};
