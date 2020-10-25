
const jwt = require('jsonwebtoken');
var session = require('express-session');

var ssn;

const allowedRoles = (roles) => {
  return function(req, res, next) {
    ssn = req.session;
    if(roles.includes(ssn.role)){
      next();
    }
    else{
      res.status(401).send({
        msg: 'Unauthorized access'
      });
    }
}};

module.exports = {
  allowedRoles: allowedRoles 
};