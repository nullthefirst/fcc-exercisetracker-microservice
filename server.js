const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// database setup
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.MONGO_DBNAME,
});

const db = mongoose.connection;

if (!db) {
  console.log('Error connecting MongoDB');
} else {
  console.log('Successfully connected MongoDB');
}

const athleteSchema = mongoose.Schema({
  username: {
    type: String,
  },
  logs: [
    mongoose.Schema({
      description: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now(),
      },
    }),
  ],
  count: {
    type: Number,
    default: 0,
  },
});

const Athlete = mongoose.model('Athlete', athleteSchema);

// middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// api routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'Hello API' });
});

// server mount
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
