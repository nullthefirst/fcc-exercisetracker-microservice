const querystring = require('querystring');
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');

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

const logSchema = mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      default: new Date().toDateString(),
    },
  },
  { _id: false },
);

const athleteSchema = mongoose.Schema({
  username: {
    type: String,
  },
  log: {
    type: [logSchema],
  },
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

// utility functions

const queryCheck = (queryValue) => {
  return (
    !queryValue ||
    queryValue === '' ||
    queryValue === '0' ||
    queryValue === 'undefined'
  );
};

// api routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'Hello API' });
});

app.post('/api/users', (req, res) => {
  if (req.body.username !== undefined) {
    const newUser = new Athlete({ username: req.body.username });

    try {
      newUser.save();
      res.json({ username: newUser.username, _id: newUser._id });
    } catch (err) {
      res.json({ error: err });
    }
  } else {
    res.json({ error: 'username value is undefined' });
  }
});

app.get('/api/users', (req, res) => {
  Athlete.find({}, (err, data) => {
    if (err) res.json({ error: err });

    const users = [...data];

    let parsedUserObj = [];

    for (let user of users) {
      let userObj = {};
      for (let info in user) {
        if (info === 'username' || info === '_id') {
          userObj[info] = user[info];
        }
      }
      parsedUserObj.push(userObj);
    }

    res.send(parsedUserObj);
  });
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params['_id'];

  const data = await Athlete.findById(userId);

  try {
    const dateArray = req.body.date
      ? req.body.date.split('-')
      : req.params.date
      ? req.params.date.split('-')
      : moment().format('YYYY-MM-DD').split('-');
    const [year, month, day] = dateArray;

    data.log.push({
      description:
        req.body.description !== '' ? req.body.description : 'description',
      duration: req.body.duration !== '' ? parseInt(req.body.duration) : 1,
      date:
        dateArray[0] !== ''
          ? new Date(
              parseInt(year),
              parseInt(month - 1),
              parseInt(day),
            ).toDateString()
          : new Date().toDateString(),
    });

    data.count = data.log.length;

    data.save();

    res.json({
      username: data.username,
      description:
        req.body.description !== '' ? req.body.description : 'description',
      duration: req.body.duration !== '' ? parseInt(req.body.duration) : 1,
      date:
        req.body.date !== '' ||
        req.body.date !== undefined ||
        req.body.date !== null
          ? dateArray[0] !== ''
            ? new Date(
                parseInt(year),
                parseInt(month - 1),
                parseInt(day),
              ).toDateString()
            : new Date().toDateString()
          : new Date().toDateString(),
      _id: data._id,
    });
  } catch (err) {
    res.json({ error: err });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params['_id'];

  const data = await Athlete.findById(userId);

  try {
    let logData;

    if (queryCheck(req.query.limit)) {
      logData = [...data.log];
    } else {
      logData = [...data.log].slice(0, parseInt(req.query.limit));
    }

    res.json({
      username: data.username,
      count: data.count,
      _id: data._id,
      log: logData,
    });
  } catch (err) {
    res.json({ error: err });
  }
});

// server mount
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
