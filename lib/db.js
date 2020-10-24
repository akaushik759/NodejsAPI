const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'nodejs_db',
  password: ''
});

connection.connect();
module.exports = connection;