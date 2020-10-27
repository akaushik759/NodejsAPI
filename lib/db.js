const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'sql12.freemysqlhosting.net',
  user: 'sql12373005',
  database: 'sql12373005',
  password: 's9jQf6mdzE'
});

connection.connect();
module.exports = connection;