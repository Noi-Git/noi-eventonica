const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
// const Profile = require('../../models/Profile');
const User = require('../../models/User');

/* ======= CREATE POST ======= */
// @route		POST api/posts
// @desc		Create a post
// @access	Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/* ======= GET ALL POSTS ======= */
// @route		GET api/posts
// @desc		Get all post
// @access	Private
router.get('/', auth, async (req, res) => {
  try {
    // date: -1 means get from the resent post
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/* ======= GET POST BY POST ID ======= */
// @route		GET api/posts/:id
// @desc		Get post by ID
// @access	Private
router.get('/:id', auth, async (req, res) => {
  try {
    // date: -1 means get from the resent post
    const post = await Post.findById(req.params.id);

    // check if there a post with that ID
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

/* ======= DELETE POST ======= */
// @route		DELETE api/posts/:id
// @desc		Delete a post
// @access	Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    /* check if the user has permision to delete the post 
        - user can only delete their own post
        - need .toString because req.user.id is string
        - we have to turn post.user to string too
    */
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
