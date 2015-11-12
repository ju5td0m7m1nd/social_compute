function create_store () {
	// body...
	socket = io.connect('',{query: 'type=sale'});
	socket.emit('response_add_seller',me);
	socket.on('msg_broadcast',function (user_id,talk) {
		// body...
		console.log(talk);
		UpdateMessage(user_id.replace(/\%20/g," "), talk);
	});
	socket.on('msg_broadcast',function (response) {
		// body...
		UpdateMessage(response);
	});
	socket.on('buyer_price_broadcast',function (response) {

		UpdatePrice(response);
	});
}