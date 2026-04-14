const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getPosts, toggleLike, addComment, getComments } = require('../controllers/socialController');

// All social routes are protected
router.use(authMiddleware);

router.get('/posts', getPosts);
router.post('/like', toggleLike);
router.post('/comment', addComment);
router.get('/posts/:id/comments', getComments);


module.exports = router;
