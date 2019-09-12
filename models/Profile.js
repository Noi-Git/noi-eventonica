const mongoose = require('mongoose');

const ProfileSchema = new nongoose.Schema({
  user: {
    type: mongosse.Schema.Types.ObjectId,
    ref: 'user'
  },
  event: [
    {
      title: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      location: {
        type: String
      },
      date: {
        type: Date
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});
