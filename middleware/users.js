// middleware/users.js
const jwt = require('jsonwebtoken');

const validateRegister = (req, res, next) => {
    // username min length 3
    if ((!req.body.email || req.body.email.length < 3) && req.body.email.indexOf('@') > 0) {
      return res.status(400).send({
        msg: 'Invalid email id'
      });
    }

    // password min 6 chars
    if (!req.body.password || req.body.password.length < 8) {
      return res.status(400).send({
        msg: 'Please enter a password with min. 8 chars'
      });
    }

    next();
  };

const isLoggedIn = (req, res, next) => {
  try {
    const token = req.headers.authorization; 
    const decoded = jwt.verify(
      token,
      'SECRETKEY'
    );
    req.userData = decoded;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).send({
      msg: 'Your session is not valid!'
    });
  }
}

module.exports = {
  validateRegister: validateRegister,
  isLoggedIn: isLoggedIn 
};