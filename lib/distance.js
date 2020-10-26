var distance = require('google-distance');
const db = require('../lib/db.js');
 

function getTimeTaken(source,destination)
{
	distance.get(
  	{
    	origin: source,
    	destination: destination
  	},
  	function(err, data) {
    	if (err) return -1;
    	return data;
});
}

function assignDeliveryExecutive(order_id,order_address){
	let reply = {};
	let delivery_executives = [];
	let assigned_executive_id;
	let cur_order_id_of_exec;
	let next_order_list;
	db.query(`SELECT id, final_address, cur_order_id, next_order FROM del_executive;`,
		(err, result) => {
			if (err) {
        		//throw err;
        		reply = {'status':'error','msg':err}
      		}
      		if(result){
      			for(var i=0;i<result.length;i++)
      			{
      				var del_id = result[i].id;
      				var del_cur_order_id = result[i].cur_order_id;
      				var del_next_order_count = JSON.parse(result[i].next_order).length;
      				var del_next_order_list = JSON.parse(result[i].next_order);
      				var time_taken = getTimeTaken(result[i].final_address,order_address).durationValue;
      				if(time_taken!=-1)
      				{
      					delivery_executives.push([del_id,del_next_order_count,time_taken,del_cur_order_id, del_next_order_list]);
      				}
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
      		}		
    });

    if(cur_order_id_of_exec=="")
    {
    	db.query(`UPDATE del_executive SET cur_order_id = ${db.escape(order_id)}, final_address = ${db.escape(order_address)}  WHERE id = ${db.escape(assigned_executive_id)};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		console.log("Error in updating Delivery Executive assigned order : "+err);
      		}
      		if(result){
      			updateOrderTable(order_id,assigned_executive_id);
      			console.log("Successfully assigned order:"+order_id+" to delivery executive:"+assigned_executive_id);
      		}		
    });
    }
    else{
    	next_order_list.push([order_id, order_address]);
    	db.query(`UPDATE del_executive SET cur_order_id = ${db.escape(order_id)}, next_orders = ${db.escape(JSON.stringify(next_order_list))}  WHERE id = ${db.escape(assigned_executive_id)};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		console.log("Error in updating Delivery Executive assigned order : "+err);
      		}
      		if(result){
      			updateOrderTable(order_id,assigned_executive_id);
      			console.log("Successfully assigned order:"+order_id+" to delivery executive:"+assigned_executive_id);
      		}		
    });
    }
}

function updateOrderTable(order_id,dexecutive_id)
{
	db.query(`UPDATE orders SET dexecutive = ${db.escape(dexecutive_id)} WHERE id = ${db.escape(order_id)};`,
		(err, result) => {
			if (err) {
        		//throw err;
        		console.log("Error occurred while updating orders table :"+err);
      		}
      		if(result){
      			console.log("Updated Orders table for order :"+order_id+" delivery_executive :"+dexecutive_id);
      		}		
    });
}

module.exports = {
  getTimeTaken: getTimeTaken,
  assignDeliveryExecutive: assignDeliveryExecutive,
  updateOrderTable: updateOrderTable
};