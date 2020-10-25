// routes/router.js

const express = require('express');
const route = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const db = require('../lib/db.js');
const userMiddleware = require('../middleware/users.js');

// routes/router.js

route.post('/sign-up', userMiddleware.validateRegister, (req, res, next) => {
  db.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(
      req.body.email
    )});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          msg: 'This email is already in use!'
        });
      } else {
        // username is available
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err
            });
          } else {
          	//check if valid role
          	if(req.body.role != 'root'|| req.body.role != 'del_executive' || req.body.role != 'user' )
          	{
          		return res.status(401).send({
          			msg: 'Invalid Role!'
        		});
          	}
            // has hashed pw => add to database
            db.query(
              `INSERT INTO users (id, name, email, password, address, role) VALUES ('${uuid.v4()}', ${db.escape(
                req.body.name
              )},${db.escape(req.body.email)}, ${db.escape(hash)},${db.escape(req.body.address)},${db.escape(req.body.role)})`,
              (err, result) => {
                if (err) {
                  throw err;
                  return res.status(400).send({
                    msg: err
                  });
                }
                return res.status(201).send({
                  msg: 'Registered!'
                });
              }
            );
          }
        });
      }
    }
  );
});

// routes/router.js

route.post('/login', (req, res, next) => {
  db.query(
    `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        throw err;
        return res.status(400).send({
          msg: err
        });
      }

      if (!result.length) {
        return res.status(401).send({
          msg: 'Email or password is incorrect!'
        });
      }

      // check password
      bcrypt.compare(
        req.body.password,
        result[0]['password'],
        (bErr, bResult) => {
          // wrong password
          if (bErr) {
            throw bErr;
            return res.status(401).send({
              msg: 'Email or password is incorrect!'
            });
          }

          if (bResult) {
            const token = jwt.sign({
                username: result[0].email,
                userId: result[0].id
              },
              'SECRETKEY', {
                expiresIn: '7d'
              }
            );

            delete result[0].password;

            return res.status(200).send({
              msg: 'Logged in!',
              token,
              user: result[0]
            });
          }
          return res.status(401).send({
            msg: 'Email or password is incorrect!'
          });
        }
      );
    }
  );
});


route.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);
  res.send('This is the secret content. Only logged in users can see that!');
});

module.exports = route;