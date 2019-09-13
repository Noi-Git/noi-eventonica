const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

/* ======= GET CURRENT USER PROFILE ======= */
// @route		GET api/profile/me
// @desc		Get current users profile
// @access	Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      'name'
    );

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

/* ======= CREATE OR UPDATE USER PROFILE ======= */
// @route		POST api/profile
// @desc		Create or update user profile
// @access	Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('date', ' Date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // if it is error
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, image, location, date, time } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (title) profileFields.title = title;
    if (description) profileFields.description = description;
    if (image) profileFields.image = image;
    if (location) profileFields.location = location;
    if (date) profileFields.date = date;
    if (time) profileFields.time = time;

    try {
      let profile = await Profile.findOneAndDelete({ user: req.user.id });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // Create
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/* ======= GET ALL USERS PROFILES ======= */
// @route		GET api/profile
// @desc		Get all profile
// @access	Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(`Server Error`);
  }
});

/* ======= GET USER PROFILE BY USING USER ID ======= */
// @route		GET api/profile/user/:user_id
// @desc		Get profile by user ID
// @access	Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', 'name');

    // check if there is a profile for this user
    if (!profile) return res.status(400).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    res.status(500).send(`Server Error`);
  }
});

/* ======= DELETE USER PROFILE ======= */
// @route		DELETE api/profile
// @desc		Delete profile, user & posts
// @access	Private
router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove users posts

    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'User Deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(`Server Error`);
  }
});

/* ======= CONNECT TO GITHUB ======= */
// @route		GETapi/profile/github/:username
// @desc		Get user repos from Github
// @access	Public
router.get('./github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' });
      }

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
