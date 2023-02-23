const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const ObjectId = require('mongodb').ObjectId;
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 8080;
const API_KEY = '72b74d24f48c5a44bf55dc1c9d87072d';
const CITY_NAME = 'Astana';
const uri = process.env.MONGO_URI;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/static'));
app.set('view engine', 'ejs');

MongoClient.connect(uri, { useNewUrlParser: true }, function(err, client) {
    if (err) {
        console.log("Error connecting to MongoDB Atlas:", err);
        return;
    }

    console.log("Connected to MongoDB Atlas");

    // use the client to access the database
    const kettik = client.db("kettik");

    app.get('/', function (req, res) {
        kettik.collection('posts').find().sort({ "_id": -1 }).toArray(function (error, posts) {
            if (error) {
                console.log('Error getting posts from MongoDB:', error);
                return;
            }
            const url = `http://api.openweathermap.org/data/2.5/weather?q=${CITY_NAME}&appid=${API_KEY}`;
            fetch(url)
            .then(response => response.json())
            .then(data => {
                const weather = {
                    temperature: Math.round(data.main.temp - 273.15),
                    description: data.weather[0].description,
                };
                res.render('small-users/all-posts', { posts: posts, weather: weather });
            })
            .catch(err => {
                console.log('Error fetching weather data:', err);
                res.send('Error fetching weather data');
            });
        });
    });
    
    app.get('/posts1', function (req, res) {
        res.render('admin/posts1');
    });

    app.post('/do-post', function (req, res) {
        kettik.collection('posts').insertOne(req.body, function (err, document) {
            if (err) {
                console.log('Error adding post to MongoDB:', err);
                return;
            }
            res.send('Post added');
        });
    });

    app.get('/add_user', function (req, res) {
        res.render('admin/add_user');
    });

    app.post('/do-add-user', function (req, res) {
        kettik.collection('users').insertOne(req.body, function (err, document) {
            if (err) {
                console.log('Error adding user to MongoDB:', err);
                return;
            }
            res.send('User added');
        });
    });

    app.get('/register', function (req, res) {
        res.render('small-users/register');
    });

    app.post('/register', function (req, res) {
        kettik.collection('users').insertOne(req.body, function (err, document) {
            if (err) {
                console.log('Error registering user to MongoDB:', err);
                return;
            }
            res.redirect('/');
        });
    });

    app.get('/login', function (req, res) {
        res.render('small-users/login');
    });

    app.post('/login', function(req,res){
        kettik.collection('users').findOne(req.body, function(err, document){
            if (err) {
                console.log('Error logging in user to MongoDB:', err);
                return;
            }
            res.redirect('/');
        });
    });

    app.get('/posts/:id', function (req, res) {
        kettik.collection('posts').findOne({ '_id': ObjectId(req.params.id) }, function (err, posts) {
            if (err) {
                console.log('Error getting post from MongoDB:', err);
                return;
            }
            res.render('small-users/user', { posts: posts });
        });
    });

    app.listen(PORT, function () {
        console.log(`Server listening on port ${PORT}`);
    });
});