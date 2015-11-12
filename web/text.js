var channels = new Object();
var people = new Object();
var channel = function(seller_fb_id, youtube_url, socket_id) {
	this.youtube_url = youtube_url;
	this.seller_socket_id = socket_id;
	this.customers = [];
}
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
request = require('request');
var engines = require('consolidate');

server.listen(5000);
app.set('views', __dirname + 'views');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.get('/chatroom', function(req, res) {
	res.sendFile(__dirname + '/chatroom.html');
});
app.get('/chatcost',function (req,res) {
	// body...
	//var post = req.query;
	var data = require('url').parse(req.url,true).query;
	console.log(data);
	res.render('./chatroom.html', data);
});
app.post('/', function(req, res) {
	// body...
	var body = '';
	req.on('data', function(data) {
		body += data;
	});

	var qr = require('querystring');
	var post;
	req.on('end', function() {
		post = qr.parse(body);
		console.log(post);
		res.render('./chatroom.html', post);
	});


});
io.sockets.on('connection', function(socket) {
	console.log('type:' + socket.handshake.query.type);
	socket.on('response_id_url', function(sale) {
		// body...
		create_channel(sale, socket.id);
	});
	socket.on('response_fb_id_my_id', function(my_id,fb_id) {
		// body...
		join_broadcast(fb_id,my_id, socket.id);
		socket.emit('response_url', channels[fb_id].youtube_url);
	});
	socket.on('chat',function (fb_id,user_id,talk) {
		console.log(fb_id);
		var customers  = channels[fb_id].customers;
		console.log(customers.length);
		console.log(talk);
		console.log(fb_id);
		for (var i = 0; i < customers.length; i++) {
			io.to(customers[i]).emit('chat',user_id,talk);
			console.log('talk');
		};
	});
});

function create_channel(sale, socket_id) {
	// body...
	var new_channel = new channel(sale.seller_fb_id, sale.youtube_url, socket_id);
	people[socket_id]='Chief';
	new_channel.customers.push(socket_id);
	channels[sale.seller_fb_id] = new_channel;
	console.log(sale.seller_fb_id);
	console.log(new_channel.customers.length);
}

function join_broadcast(fb_id,my_id, socket_id) {
	// body...
	console.log(fb_id);
	var channel = channels[fb_id];
	people[socket_id]=my_id;
	channel.customers.push(socket_id);
	console.log('url:' + channel.youtube_url);
}
