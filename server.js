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
  logs: {
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

// TODO: <start> correct implementation
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.body[':_id'];

  const data = await Athlete.findById(userId);

  try {
    data.logs.push({
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date !== '' ? req.body.date : Date.now(),
    });

    data.count = data.logs.length;

    data.save();

    res.json(data);
  } catch (error) {
    res.json({ error: error });
  }
});
// TODO: <end>

app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params['_id'];

  const data = await Athlete.findById(userId);

  try {
    res.json({
      logs: data.logs,
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
