// index.js

const express = require('express');
var session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

// set up port
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
	name : 'nodejsapi',
    secret:'CNOJS@*$UAD!',
    resave :true,
    saveUninitialized: true,
    cookie : {
            maxAge:(1000 * 60 * 100)
    }   }));

app.use(cors());

// add routes
const route = require('./routes/route.js');
app.use('/api', route);

// run server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));