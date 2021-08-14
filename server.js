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
  log: {
    type: [
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
          type: Date,
          default: Date.now(),
        },
      },
    ],
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
  console.log('TEST BODY >> ' + JSON.stringify(req.body));
  console.log('TEST PARAMS >> ' + JSON.stringify(req.params));

  const userId = req.params['_id'];

  const data = await Athlete.findById(userId);

  try {
    const dateArray = req.body.date.split('-');

    data.log.push({
      description:
        req.body.description !== '' ? req.body.description : 'description',
      duration: req.body.duration !== '' ? parseInt(req.body.duration) : 1,
      date:
        req.body.date !== '' ||
        req.body.date !== undefined ||
        req.body.date !== null
          ? dateArray[0] !== ''
            ? new Date(
                parseInt(dateArray[0]), // year
                parseInt(dateArray[1]), // month
                parseInt(dateArray[2]), // day
              ).toDateString()
            : new Date().toDateString()
          : new Date().toDateString(),
    });

    data.count = data.log.length;

    data.save();

    res.json({
      username: data.username,
      description:
        req.body.description !== '' ? req.body.description : 'description',
      duration: req.body.duration !== '' ? parseInt(req.body.duration) : 1,
      _id: data._id,
      date:
        req.body.date !== '' ||
        req.body.date !== undefined ||
        req.body.date !== null
          ? dateArray[0] !== ''
            ? new Date(
                parseInt(dateArray[0]), // year
                parseInt(dateArray[1]), // month
                parseInt(dateArray[2]), // day
              ).toDateString()
            : new Date().toDateString()
          : new Date().toDateString(),
    });
  } catch (err) {
    res.json({ error: err });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  console.log('TEST BODY >> ' + JSON.stringify(req.body));
  console.log('TEST PARAMS >> ' + JSON.stringify(req.params));

  const userId = req.params['_id'];

  const data = await Athlete.findById(userId);

  try {
    res.json({
      username: data.username,
      _id: data._id,
      log: data.log,
      count: data.count,
    });
  } catch (err) {
    res.json({ error: err });
  }
});

// server mount
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
