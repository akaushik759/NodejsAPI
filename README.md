# REST API using NodeJS, MySQL

## Hosted on Heroku

Link : https://abhisheknodejs.herokuapp.com/

## DEPENDENCIES

- bcryptjs
- body-parser
- cors
- express
- express-session
- google-distance
- jsonwebtoken
- mysql
- uuid

## TABLES

- users (Store all users)
- orders (Store all orders)
- del_executive (Store all delivery executives and their assigned order details)
- cookies (Store all cookie inventory)

## ROUTES

### Authentication Routes
```
1. /api/auth/signup

POST - Used to create user account

Input : email,name,password,address,role
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}


2. /api/auth/login

POST - Used to login

Input : email,password
Output : 
	Success - {'status':200, 'msg':''} Also return a JWT token which is used for verification for other routes requiring signin
	Error - {'status':401, 'msg':''}


3. /api/auth/logout

GET - Used to logout

Input :
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}
```
### User Routes

```
4. /api/get/cookies

GET - Used to fetch the list of all cookies in db with their price

Input :
Output : 
	Success - {'status':200, 'msg':'', 'data': [[]]}
	Error - {'status':401, 'msg':''}


5. /api/order/cookies

POST - Used to order a cookie

Input : id (Only the id of the cookie)
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}


6. /api/get/orders/customer/:cid

GET - Used to get all orders placed by a customer

Input : 
Output : 
	Success - {'status':200, 'msg':'','data':[[]]}
	Error - {'status':401, 'msg':''}


7. /api/get/eta/:oid

GET - Get estimated time of arrival of an order

Input : 
Output : 
	Success - {'status':200, 'msg':'','data':''}
	Error - {'status':401, 'msg':''}
```
### Delivery Executive Routes

```
8. /api/get/orders/dexecutive/:did

GET - Used to get all orders of a delivery executive

Input : 
Output : 
	Success - {'status':200, 'msg':'','data':[[]]}
	Error - {'status':401, 'msg':''}


9. /api/order/status/:oid

PUT - Update order status as delivered

Input : 
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}


10. /api/dexecutive/update/location

PUT - Update current location of the delivery executive such that it can be used for calculating ETA by the customer

Input : 
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}
```
### Root User Routes

```
11. /api/add/cookie

POST - Add a new cookie to the database

Input : name, price
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}


12. /api/root/create_user

POST - Create another root user

Input : name, email, password, address
Output : 
	Success - {'status':200, 'msg':''}
	Error - {'status':401, 'msg':''}
```

## ALGORITHM

### Calculation of ETA for an order: 
- There is a route which is used for updating the current location of the delivery executive.
- When a user asks for ETA, the distance of the current location of the respective delivery executive alloted to that order and the address of the user is sent to the google-maps api, which returns the time required to reach the destination

### Creation of Delivery Executive User:
- When a new account is created with the role of del_executive, then a new record is created in the del_executive table with the same id

### Assigning a Delivery Executive when order is placed:
- According to the problem statement given by you, orders within the same area should be given the same delivery executive.
- By logic, if two orders are in the same area, then the time taken to travel from one of them to the other would be less
- Hence, I when an order is placed, first I calculate the time taken between the destination address of a delivery executive and the current order address. 
- This is calculated for all the delivery executives
- If a delivery executive is free then the current location of them is considered
- Then this list is sorted in ascending order of time taken
- Although the choice should be to assign the order to the first executive in the list, but what if the executive has multiple orders already, and there are other free executives
- It may take more time for a free executive to go from shop to the address, but in the long term when all executives are utilised then there are higher chances of an order being nearer to one of them
- Hence, now the first delivery executive with the minimum number of pending orders is assigned the order

This ensures that order is delivered in short time also all delivery executives are utilised
There are definitely more hidden factors like time taken to complete pending orders, if an order is cancelled, or if an order can be delivered before another order, but that would need more complex logic which would have been tough to implement within 72 hrs, hence I went with a simple and optimal logic.

## Roles - user, root, del_executive
