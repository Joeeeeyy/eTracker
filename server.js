const express = require('express')
const app = express()
require('dotenv').config()
const mongoose = require('mongoose')

const cors = require('cors');
const { mongoose } = require('mongoose');
const { request } = require('express');

// Connect Database
let uri = process.env.DB;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

// Create User Model
let sessionSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
});

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [sessionSchema]
});

let User = mongoose.model('User', userSchema);
let Session = mongoose.model('Session', sessionSchema);

app.post('/api/exercise/new-user', bodyParser.urlencoded({ extended:false }), (req, res) => {
  let newUser = new User({username: request.body.username})
  newUser.save((err, savedUser) => {
    if(!err) {
      let userObj = {};
      userObj['username'] = savedUser.username
      userObj['_id'] = savedUser._id
      res.json(userObj)
    }
  })
})

app.get('/api/exercise/users', (req, res) => {

  User.find({}, (err, arrayOfUsers) => {
    if(!err) {
      res.json(arrayOfUsers)
    }
  })
});

app.post('/api/exercise/add', bodyParser.urlencoded({ extended: false}), (req, res) => {

  let newSession = new Session({
    description: request.body.description,
    duration: parseInt(request.body.duration),
    date: request.body.date
  })

  if(newSession.date === '') {
    newSession.date = new Date().toISOString().substring(0, 10)
  }

  User.findByIdAndUpdate(
    request.body.userId,
    {$push: {log: newSession}},
    {new: true},
    (err, updatedUser) => {
      if(!err) {
        let userObj ={};
        userObj['_id'] = updatedUser.id
        userObj['username'] = updatedUser.username
        userObj['date'] = new Date(newSession.date).toDateString()
        userObj['description'] = newSession.description
        userObj['duration'] = newSession.duration
        res.json(userObj)
      }
    })
});

app.get('/api/exercise/log', (req, res) => {

  User.findById(request.query.userId, (err, result) => {
    if(!err) {
      let userObj = result

      if(request.query.from || request.query.to) {

        let fromDate = new Date(0)
        let toDate = new Date()

        if(request.query.from) {
          fromDate = new Date(request.query.from)
        }

        if(request.query.to) {
          toDate = new Date(request.query.to)
        }

        fromDate = fromDate.getTime()
        toDate = toDate.getTime()

        userObj.log = userObj.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime()

          return sessionDate >= fromDate && sessionDate <= toDate
        })
      }

      if(request.query.limit) {
        userObj.log = userObj.log.slice(0, request.query.limit)
      }

      userObj = userObj.toJSON()
      userObj['count'] = result.log.length
      res.json(userObj)
    }
  })
})