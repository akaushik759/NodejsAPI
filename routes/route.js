// routes/router.js

const express = require('express');
var session = require('express-session');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const db = require('../lib/db.js');
const delivery = require('../lib/delivery.js');
const userMiddleware = require('../middleware/users.js');
const roleMiddleware = require('../middleware/roles.js');

var di = require('google-distance');
di.apiKey = 'AIzaSyAqG418biOaqOjCkvjAvA8B64biCVYj7H4';

var ssn;

function createNewUser(name,email,hash,address,role)
{
	return new Promise(function(resolve,reject){
		var unique_id = uuid.v4();
		let reply;
		//check if valid role
        if(role != 'root' && role != 'del_executive' && role != 'user' )
        {
          	return {'status':'error','msg':'Invalid role'};
        }
        // has hashed pw => add to database
        db.query(
            	`INSERT INTO users (id, name, email, password, address, role, timestamp) VALUES (${db.escape(unique_id)}, ${db.escape(name)},${db.escape(email)}, ${db.escape(hash)},${db.escape(address)},${db.escape(role)},CURRENT_TIMESTAMP())`,
           	(err, result) => {
            	console.log("inside function");
            	if (err) {
                	return reject(err);
            	}
            	console.log("create user : "+result);
            	resolve({
            		"uid":unique_id,
            		"name":name,
            		"role":role});
           	}

   		);
    });
 }
   			//If delivery executive role then add the user to del_executive table
   			// if(role == 'del_executive')
   			// {
   			// 	db.query(
      //       	`INSERT INTO del_executive (id, name, cur_order_id, address, location, next_orders) VALUES (${db.escape(unique_id)}, ${db.escape(name)},"", "","","")`,
      //         		(err, result) => {
      //           		if (err) {
      //           			console.log(err);
      //             			reply = {'status':'error','msg':err};
      //             			console.log(reply.msg);
      //           		}
      //         		}
   			// 	);

   			// }
   			// if(reply == undefined)
   			// {
   			// 	return {'status':'success','msg':'Successfully created new user'};
   			// }
      //      return reply;

function addToDelExecutiveTable(data)
{
	return new Promise(function(resolve,reject){
		db.query(
            	`INSERT INTO del_executive (id, name, cur_order_id, final_address, location, next_orders) VALUES (${db.escape(data.uid)}, ${db.escape(data.name)},"", "","","")`,
              		(err, result) => {
                		if (err) {
                			return reject(err);
                		}
                		resolve(result);
              		}
   				);
	});
}

//Authentication Routes
router.post('/sign-up', [userMiddleware.validateRegister,userMiddleware.isLoggedOut], (req, res, next) => {
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
          	createNewUser(req.body.name,req.body.email,hash,req.body.address,req.body.role).then((data)=>{
          		console.log("inside then of cnu : "+data.uid+data.role);
          		if(data.role=='del_executive')
          		{
          			addToDelExecutiveTable(data).then((data)=>{
          				return res.status(200).send({
          					msg: "Successfully created user, also added to delivery executive table"
        				});
          			})
          			.catch((err)=>{
          				return res.status(401).send({
          					msg: err
        				});
          			});
          		}
          		else
          		{
          			return res.status(200).send({
          				msg: "Successfully created new user"
        			});
          		}
          	})
          	.catch((err)=>{
          		return res.status(401).send({
          					msg: err
        		});
          	});
          }
        });
      }
    }
  );
});

router.post('/login', userMiddleware.isLoggedOut,(req, res, next) => {
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
            ssn.user_id = result[0].id;
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

router.get('/logout',userMiddleware.isLoggedIn, (req, res, next) => {
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
	var customer_id = ssn.user_id;
	var order_addr = ssn.address;
	db.query(`INSERT INTO orders (id, cookie_id, cust_id, address, status, dexecutive, timestamp) VALUES ('${uuid.v4()}', ${db.escape(cookie_id)},${db.escape(customer_id)}, ${db.escape(order_addr)},${db.escape("undelivered")},"",CURRENT_TIMESTAMP());`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}

      		if(result)
      		{	
      			delivery.assignDeliveryExecutive(result[0].id,order_addr).then((result)=>{
      				return res.status(200).send({
            			msg: 'Successfully placed order',
            			data: result[0]
          			});
      			})
      			.catch((err)=>{
      				return res.status(401).send({
          				msg: err
        			});
      			});
      		}	
    });
});

router.get('/get/orders/customer/:cid',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','user'])],(req, res, next) =>{
	ssn = req.session;
	db.query(`SELECT * FROM orders WHERE cust_id = ${db.escape(req.params['cid'])};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		if(result){
      			return res.status(200).send({
            		msg: 'All orders for the customer',
            		data: result
          		});
      		}		
    });
});

router.get('/get/eta/:oid',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','user'])],(req, res, next) =>{
	ssn = req.session;
	db.query(`SELECT dexecutive FROM orders WHERE id = ${db.escape(req.params['oid'])};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		if(result){
      			db.query(`SELECT location FROM del_executive WHERE id = ${db.escape(result[0])};`,
					(err, result) => {
					if (err) {
        				//throw err;
        				return res.status(401).send({
          					msg: err
        				});
      				}
      				if(result){
      					delivery.getTimeTakenInLetters(ssn.address, result[0]).then((val)=>{
      						return res.status(200).send({
            					msg: 'Successfully calculated ETA',
            					data: val
          					});
      					})
      					.catch((err)=>{
          					return res.status(401).send({
          						msg: err
        					});
          				});
      				}		
    			});
      		}		
    });
});

//Delivery Executive Routes
router.get('/get/orders/dexecutive/:did',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','del_executive'])],(req, res, next) =>{
	ssn = req.session;
	db.query(`SELECT * FROM orders WHERE dexecutive = ${db.escape(req.params['did'])};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		if(result){
      			return res.status(200).send({
            		msg: 'All orders for the delivery person',
            		data: result
          		});
      		}		
    });
});

router.put('/order/status/:oid',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','del_executive'])],(req, res, next) =>{
	ssn = req.session;
	var next_order_list;
	db.query(`UPDATE orders SET status = 'delivered'  WHERE id = ${db.escape(req.params['oid'])};`,
		(err, result) => {
			if (err) {
        		//throw err;
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

    db.query(`SELECT next_orders FROM del_executive WHERE id = ${db.escape(req.params['oid'])};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		if(result){
      			next_order_list = JSON.parse(result[0]);
      			var cur_order_id = next_order_list[0];
      			var cur_order_address = next_order_list[1];
      			next_order_list.shift();
      			db.query(`UPDATE del_executive SET cur_order_id = ${db.escape(cur_order_id)}, next_orders = ${db.escape(JSON.stringify(next_order_list))}  WHERE id = ${db.escape(req.params['oid'])};`,
					(err, result) => {
						if (err) {
        					//throw err;
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
      		}		
    });

});

router.put('/dexecutive/update/location',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root','del_executive'])],(req, res, next) =>{
	ssn = req.session;
	var lolwa;
	console.log(lolwa);
	db.query(`UPDATE del_executive SET location = ${db.escape(req.body.location)}  WHERE id = ${db.escape(ssn.user_id)};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}
      		if(result){
      			lolwa = result;
      			console.log(result);
      			return res.status(200).send({
            		msg: 'Successfully updated delivery executive current location',
            		data: result
          		});
      		}		
    });
    console.log(lolwa);
});

//Only Root user Routes

router.post('/add/cookie',[userMiddleware.isLoggedIn, roleMiddleware.allowedRoles(['root'])],(req, res, next) =>{
	ssn = req.session;
	var cookie_name = req.body.name;
	var cookie_price = req.body.price;
	db.query(`INSERT INTO cookies (id, name, price) VALUES ('${uuid.v4()}', ${db.escape(cookie_name)},${db.escape(cookie_price)});`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return res.status(401).send({
          			msg: err
        		});
      		}

      		if(result)
      		{	
      			return res.status(200).send({
            		msg: 'Successfully added cookie',
            		data: result[0]
          		});
      		}

      		
    });
});

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
          	createNewUser(req.body.name,req.body.email,hash,req.body.address,"root").then((data)=>{
          		return res.status(200).send({
          			msg: "Successfully created new user"
        		});
          	})
          	.catch((err)=>{
          		return res.status(401).send({
          					msg: err
        		});
          	});
          }
        });
      }
    }
  );
});



router.get('/secret-route', (req, res, next) => {
	ssn = req.session;
	for(var i=0; i<100;i++){
  	di.get(
  	{
    	origin: 'Nageswar Residency, Odisha, India',
    	destination: 'San Diego, CA'
  	},
  	function(err, data) {
    	if (err) 
    	console.log(err);

    	console.log(data);
    	return data;
	});
  }
	
  res.send('This is the secret content. Only logged in users can see that!'+ssn.role+" session "+ssn.isLoggedIn);
});

module.exports = router;