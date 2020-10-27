# REST API using NodeJS, MySQL

## Hosted on Heroku

Link : https://abhisheknodejs.herokuapp.com/

## ROUTES

### Authentication Routes
```
/api/auth/signup

POST - Used to create user account
```
Input : email,name,password,address,role
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}

```
/api/auth/login

POST - Used to login
```
Input : email,password
Output : 
	Success - {'status':200, 'msg':''} Also return a JWT token which is used for verification for other routes requiring signin
	Error - {'status':401, 'msg':''}

```
/api/auth/logout

GET - Used to logout
```
Input :
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}

### User Routes

```
/api/get/cookies

GET - Used to fetch the list of all cookies in db with their price
```
Input :
Output : 
	Success - {'status':200, 'msg':'', 'data': [[]]}
	Error - {'status':401, 'msg':''}

```
/api/order/cookies

POST - Used to order a cookie
```
Input : id (Only the id of the cookie)
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}

```
/api/get/orders/customer/:cid

GET - Used to get all orders placed by a customer
```
Input : 
Output : 
	Success - {'status':200, 'msg':'','data':[[]]}
	Error - {'status':401, 'msg':''}

```
/api/get/eta/:oid

GET - Get estimated time of arrival of an order
```
Input : 
Output : 
	Success - {'status':200, 'msg':'','data':''}
	Error - {'status':401, 'msg':''}

### Delivery Executive Routes

```
/api/get/orders/dexecutive/:did

GET - Used to get all orders of a delivery executive
```
Input : 
Output : 
	Success - {'status':200, 'msg':'','data':[[]]}
	Error - {'status':401, 'msg':''}

```
/api/order/status/:oid

PUT - Update order status as delivered
```
Input : 
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}

```
/api/dexecutive/update/location

PUT - Update current location of the delivery executive such that it can be used for calculating ETA by the customer
```
Input : 
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}

### Root User Routes

```
/api/add/cookie

POST - Add a new cookie to the database
```
Input : name, price
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}

```
/api/root/create_user

POST - Create another root user
```
Input : name, email, password, address
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)