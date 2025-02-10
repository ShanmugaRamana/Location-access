import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 1
  }
});

const Location = mongoose.model('Location', locationSchema);

export default Location;
