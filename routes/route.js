// routes/router.js

const express = require('express');
var session = require('express-session');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const db = require('../lib/db.js');
const userMiddleware = require('../middleware/users.js');
const roleMiddleware = require('../middleware/roles.js');

var ssn;

function createNewUser(name,email,hash,address,role)
{
	//check if valid role
          	if(req.body.role != 'root'|| req.body.role != 'del_executive' || req.body.role != 'user' )
          	{
          		return {'status':'error','msg':'Invalid role'};
          	}
            // has hashed pw => add to database
            db.query(
              `INSERT INTO users (id, name, email, password, address, role, timestamp) VALUES ('${uuid.v4()}', ${db.escape(name)},${db.escape(email)}, ${db.escape(hash)},${db.escape(address)},${db.escape(role)},now())`,
              (err, result) => {
                if (err) {
                  return {'status':'error','msg':err};
                }
                return {'status':'success','msg':'Successfully created new user','data':result[0]};
              }
    );
}

//Authentication Routes
router.post('/sign-up', userMiddleware.validateRegister, (req, res, next) => {
  db.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(req.body.email)});`,
    (err, result) => {

      if (result.length) {
        return res.status(409).send({
          msg: 'This email is already in use!'
        });
      } 
      else {
        // username is available
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err
            });
          } 
          else {
          	var fresult = createNewUser(req.body.name,req.body.email,hash,req.body.address,req.body.role);
          	if(fresult.status == 'error')
          	{
          		return res.status(401).send({
          			msg: fresult.msg
        		});
          	}
          	else if(fresult.status == 'success')
          	{
          		return res.status(201).send({
                  msg: fresult.msg
                });
          	}
          }
        });
      }
    }
  );
});

router.post('/login', (req, res, next) => {
	ssn = req.session;
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
            //Store frequently used data in session variables
            ssn.id = result[0].id;
            ssn.name = result[0].name;
            ssn.email = result[0].email;
            ssn.role = result[0].role;
            ssn.address = result[0].address;
            ssn.isLoggedIn = true;

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

router.get('/logout', (req, res, next) => {
	ssn = req.session;
	ssn.destroy(function(error){ 
        console.log("Session Destroyed")
        return res.status(200).send({
            msg: 'Successfully logged out'
          });
        if(error)
        {
        	return res.status(401).send({
            	msg: 'Error logging out'
          });
        }
    }) 
    
});

//User Routes
router.get('/get/cookies',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','user'])],(req, res, next) =>{
	ssn = req.session;
	db.query(`SELECT * FROM cookies;`,
		(err, result) => {
			if (err) {
        		throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		if(result){
      			return res.status(200).send({
            		msg: 'All cookies',
            		data: result
          		});
      		}
      		
    });

});

router.post('/order/cookies',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','user'])],(req, res, next) =>{
	ssn = req.session;
	var cookie_id = req.body.id;
	var customer_id = ssn.id;
	var order_addr = ssn.address;
	db.query(`INSERT INTO orders (id, cookie_id, customer_id, timestamp, address, status, del_executive, timestamp) VALUES ('${uuid.v4()}', ${db.escape(cookie_id)},${db.escape(customer_id)},now(),${db.escape(order_addr)},${db.escape("undelivered")},"",now())`,
		(err, result) => {
			if (err) {
        		throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}

      		if(result)
      		{	
      			//assignDeliveryExecutive(result[0].id,order_addr);
      			return res.status(200).send({
            		msg: 'Successfully placed order',
            		data: result[0]
          		});
      		}

      		
    });
});

router.get('/get/orders/:cid',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','user'])],(req, res, next) =>{
	ssn = req.session;
	db.query(`SELECT * FROM orders WHERE customer_id = ${db.escape(req.params['cid'])};`,
		(err, result) => {
			if (err) {
        		throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		if(result){
      			return res.status(200).send({
            		msg: 'All orders',
            		data: result
          		});
      		}		
    });
});

router.get('/get/eta/:oid',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','user'])],(req, res, next) =>{
	ssn = req.session;
	db.query(`SELECT location FROM del_executive WHERE cur_order_id = ${db.escape(req.params['oid'])};`,
		(err, result) => {
			if (err) {
        		throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		//var ETA = findETABetween(result[0].location,ssn.address);
      		if(result){
      			return res.status(200).send({
            		msg: 'Successfully calculated ETA',
            		data: ETA
          		});
      		}		
    });
});

//Delivery Executive Routes
router.put('/order/status/:oid',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','del_executive'])],(req, res, next) =>{
	ssn = req.session;
	db.query(`UPDATE orders SET status = 'delivered'  WHERE id = ${db.escape(req.params['oid'])};`,
		(err, result) => {
			if (err) {
        		throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		if(result){
      			return res.status(200).send({
            		msg: 'Successfully updated order status',
            		data: result[0]
          		});
      		}		
    });
});

//Only Root user Routes
router.post('/root/create_user',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root'])],(req, res, next) =>{
	ssn = req.session;
	db.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(req.body.email)});`,
    (err, result) => {

      if (result.length) {
        return res.status(409).send({
          msg: 'This email is already in use!'
        });
      } 
      else {
        // username is available
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err
            });
          } 
          else {
          	var fresult = createNewUser(req.body.name,req.body.email,hash,req.body.address,"root");
          	if(fresult.status == 'error')
          	{
          		return res.status(401).send({
          			msg: fresult.msg
        		});
          	}
          	else if(fresult.status == 'success')
          	{
          		return res.status(201).send({
                  msg: fresult.msg
                });
          	}
          }
        });
      }
    }
  );
});



router.get('/secret-route', [userMiddleware.isLoggedIn,roleMiddleware.allowedRoles(['root'])], (req, res, next) => {
	ssn = req.session;
  console.log(req.userData);
  console.log(ssn.name+" "+ssn.email+" "+ssn.role);
  res.send('This is the secret content. Only logged in users can see that!'+ssn.role+" session "+ssn.isLoggedIn);
});

module.exports = router;