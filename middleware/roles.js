
const jwt = require('jsonwebtoken');
var session = require('express-session');

var ssn;

const isRoot = (req, res, next) => {
    ssn = req.session;
    if (ssn.role == 'root'){
      next();
    }

    return res.status(401).send({
        msg: 'Unauthorized access'
      });
  };

const isDelExec = (req, res, next) => {
    ssn = req.session;
    if (ssn.role == 'del_executive'){
      next();
    }

    return res.status(401).send({
        msg: 'Unauthorized access'
      });
  };

const isUser = (req, res, next) => {
    ssn = req.session;
    if (ssn.role == 'user'){
      next();
    }

    return res.status(401).send({
        msg: 'Unauthorized access'
      });
  };

module.exports = {
  isRoot: isRoot,
  isDelExec: isDelExec,
  isUser: isUser 
};