var distance = require('google-distance');
distance.apiKey = 'AIzaSyAqG418biOaqOjCkvjAvA8B64biCVYj7H4';
const db = require('../lib/db.js');
 

function getTimeTakenInSec(source,destination)
{
	return new Promise(async(resolve, reject)=>{
		distance.get(
  		{
    		origin: source,
    		destination: destination
  		},
  		function(err, data) {
    		if (err) return reject(err);
    			resolve(data.durationValue);
		});
	});
}
function getTimeTakenInLetters(source,destination)
{
	return new Promise(function(resolve, reject) {
		distance.get(
  		{
    		origin: source,
    		destination: destination
  		},
  		function(err, data) {
    		if (err) return reject(err);
    			resolve(data.duration);
		});
	});
}
function getAllDeliveryExecutives(){
	return new Promise(function(resolve,reject){
		db.query(`SELECT id, final_address, cur_order_id, next_order FROM del_executive;`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return reject(err);
      		}
      		if(result){
      			resolve(result);
      		}
      	});
	});
}

function addOrderToFreeDeliveryExecutive(order_id,order_address,assigned_executive_id){
	return new Promise(function(resolve,reject){
		db.query(`UPDATE del_executive SET cur_order_id = ${db.escape(order_id)}, final_address = ${db.escape(order_address)}  WHERE id = ${db.escape(assigned_executive_id)};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return reject(err);
      		}
      		if(result){
      			resolve(result);
      			updateOrderTable(order_id,assigned_executive_id);
      			console.log("Successfully assigned order:"+order_id+" to delivery executive:"+assigned_executive_id);
      		}		
    	});
	});
}

function addOrderToBusyDeliveryExecutive(order_id,order_address,next_order_list,assigned_executive_id){
	return new Promise(function(resolve,reject){
		db.query(`UPDATE del_executive SET cur_order_id = ${db.escape(order_id)},final_address = ${db.escape(order_address)}, next_orders = ${db.escape(JSON.stringify(next_order_list))}  WHERE id = ${db.escape(assigned_executive_id)};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		return reject(err);
      		}
      		if(result){
      			resolve(result);
      			updateOrderTable(order_id,assigned_executive_id);
      			console.log("Successfully assigned order:"+order_id+" to delivery executive:"+assigned_executive_id);
      		}		
    	});
	});
}

function assignDeliveryExecutive(order_id,order_address){
	return new Promise((resolve,reject)=>{
		let reply = {};
		let delivery_executives = [];
		let assigned_executive_id;
		let cur_order_id_of_exec;
		let next_order_list;
		let time_taken_list;

    	getAllDeliveryExecutives().then(async(result)=>{
    	time_taken_list = await Promise.all(result.map(async data => await getTimeTakenInSec(data.final_address,order_address)));
      	
      	for(var i=0;i<time_taken_list.length;i++)
      		{
      			if(isNaN(time_taken_list))
      				continue;
      			var del_id = result[i].id;
      			var del_cur_order_id = result[i].cur_order_id;
      			var del_next_order_count = JSON.parse(result[i].next_order).length;
      			var del_next_order_list = JSON.parse(result[i].next_order);
      			delivery_executives.push([del_id,del_next_order_count,time_taken_list[i],del_cur_order_id, del_next_order_list]);
      		}
      		//sort by shortest time for delivery executive
      		delivery_executives.sort(function(a, b) {
    			if (a[2] < b[2]) return -1;
    			else if (a[2] > b[2]) return 1;
    			return 0;
			});
			//find the delivery executive with shortest time and no. of orders
			var found;
			var ctr=0;
			while(true)
			{
    			found = outerArray.find(function (element) { 
        			return element[1] == ctr; 
        		});
				if(found!=undefined)
    				break;
				ctr++;
			}
			assigned_executive_id = found[0];
			cur_order_id_of_exec = found[3];
			next_order_list = found[4];

			if(cur_order_id_of_exec=="")
    		{
    			addOrderToFreeDeliveryExecutive(order_id,order_address,assigned_executive_id)
    			.then((result)=>{
    				updateOrderTable(order_id,assigned_executive_id)
    				.then((result)=>{
    					resolve({'status':'success','msg':"Successfully assigned order:"+order_id+" to delivery executive:"+assigned_executive_id});
    				})
    				.catch((err)=>{
    					return reject({'status':'error','msg':err});
    				});
    			})
    			.catch((err)=>{
    				return reject({'status':'error','msg':err});
    			});
    		}
    		else{
    			next_order_list.push([order_id, order_address]);
    			addOrderToBusyDeliveryExecutive(order_id,order_address,JSON.stringify(next_order_list),assigned_executive_id)
    			.then((result)=>{
    				updateOrderTable(order_id,assigned_executive_id)
    				.then((result)=>{
    					resolve({'status':'success','msg':"Successfully assigned order:"+order_id+" to delivery executive:"+assigned_executive_id});
    				})
    				.catch((err)=>{
    					return reject({'status':'error','msg':err});
    				});
    			})
    			.catch((err)=>{
    				return reject({'status':'error','msg':err});
    			});
    		}
    	})
    .then((result)=>{
    	resolve(result);
    })
    .catch((err)=>{
    	return reject({'status':'error','msg':err});
    });   
    });
}

function updateOrderTable(order_id,dexecutive_id)
{
	return new Promise(function(resolve, reject) {
		db.query(`UPDATE orders SET dexecutive = ${db.escape(dexecutive_id)} WHERE id = ${db.escape(order_id)};`,
			(err, result) => {
				if (err) {
        			//throw err;
        			return reject(err);
      			}
      			if(result){
      				resolve(result);
      			}		
    		});
	});
}

module.exports = {
  getTimeTakenInLetters: getTimeTakenInLetters,
  assignDeliveryExecutive: assignDeliveryExecutive,
  updateOrderTable: updateOrderTable
};