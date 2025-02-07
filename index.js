var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
    engines = require('consolidate'),
    request = require('request'),
    web = require('./web.js');

var channels = new Object(); // save all channel info
var room_route = __dirname + '/room/templates/';

// share channel data to all backend port
module.exports.channels = channels;

// url base.
var backend_url = 'http://localhost:3000/';
var update_url = 'http://localhost:8000/updatelive/';

// server socket on 3000
server.listen(process.env.PORT || 3000); // set server port
app.engine('html', engines.mustache);
app.set('view engine', 'html');
app.set('views', __dirname + 'views');
app.use(express.static(__dirname + '/room/static'));


app.get('/test_chatroom', function(req, res) {
    res.sendFile(room_route + 'test_chatroom.html');
});

app.get('/test_hostroom', function(req, res) {
    var test_js = require('/public/test/test.js');
    var t_id = test_js.fake_id();
    var t_ch = test_js.fake_channel();
    console.log("ID : " + t_id);
    console.log("Channel : " + f_ch);
    // create fake channele 
    res.render(room_route);
});

app.get('/chatroom', function(req, res) {
    // parse url to chatroom.html
    var data = require('url').parse(req.url, true).query;
    res.render(room_route + 'chatroom.html');
});

app.get('/hostroom', function(req, res) {
    // parse url to chatroom.html
    var hostfbid = req.query.hostfbid;
    if(!hostfbid) {
        res.sendStatus(404);
        return;
    }
    res.render(room_route + 'hostroom.html');
});

// not sure why lulu keep this.
app.get('/chatroom_lulu', function(req, res) {
    res.sendFile(room_route + 'chatroom_lulu.html');
});
 
// initialize channel info from Django server.
app.post('/', function(req, res) {

    var body = '';
    var qs = require('querystring');
    // on receiving request data
    req.on('data', function(data) {
        body += data; 
    });

    req.on('end', function() {

        //body = qs.parse(body);
        //console.log(body);
        var data = JSON.parse(body);
        var host_fb_id = data.hostfbid; // use fb id as identifier  
        var ProductList = data.productlist;
        var streamurl = data.streamurl;       
        console.log(data);
        // put basic info into target channel.
        // other info such as stream url and socket id
        // will be init when create_channel socket catch data.
        channels[host_fb_id] = new Object();
        channels[host_fb_id].ProductList = ProductList;
        channels[host_fb_id].CurrentProduct = new Object();
        channels[host_fb_id].PriceList = new Object();
        channels[host_fb_id].stream_url = streamurl;        
        console.log('go!');
        res.render(room_route + 'chatroom.html', data);

    });

});



// Socket port define and implement here.
io.sockets.on('connection', function(socket) {

    socket.on('create_channel',function(req) {
        // req will be a 'me' object,
        // which containing following info :
        // fb_id
        // fb_name
        // host_fb_id
        // stream_url
        console.log(req);
        console.log('create!');
        var sendObj = new Object();
        var host_fb_id = req.host_fb_id;

        if(channels[host_fb_id]) {
            sendObj.ProductList = channels[host_fb_id].ProductList;
            socket.emit('', sendObj); // undefine.
            return;
        }

        var host = new Object();
        channels[host_fb_id].socket_id = socket.id;

        // Put host into customer list to recieve chat msg.
        host.user = req;
        host.socket_id = socket.id;
        channels[host_fb_id].customers = new Object();
        channels[host_fb_id].customers[host_fb_id] = host;

        sendObj.ProductList = channels[host_fb_id].ProductList;
        socket.emit('', sendObj); // undefine.
    });

    socket.on('enter_channel', function(req) {
        // response will be a 'me' object.
        var user_id = req.fb_id;
        var customer = new Object();
        var host_fb_id = req.host_fb_id;
        customer.user = req;
        customer.socket_id = socket.id;
        // put customer into channel's customers list.
        channels[host_fb_id].customers[user_id] = customer;
    });

    socket.on('send_msg', function(req) {
        var host_fb_id = req.user.host_fb_id;
        var customers = channels[host_fb_id].customers;
        
        for (var key in customers) {
            io.to(customers[key].socket_id).emit('broadcast_msg');
        }
    });

    socket.on('customer_change_price', function(req) {
        var host_fb_id = req.user.host_fb_id;
        var price_info = new Object();
        var customers = channels[host_fb_id].customers;
        // get price and user info from req.
        price_info.price = req.price;
        price_info.fb_name = req.user.fb_name;
        channels[host_fb_id].PriceList[customer_id] = price_info;
        
        for (var key in customers) {
            io.to(customers[key].socket_id).emit('broadcast_customer_price');
        }
    });

    socket.on('change_product', function(req) {
        // need to be implemented
    });

    socket.on('disconnect', function(req) {
        var host_fb_id = req.host_fb_id;
        channels[host_fb_id] = null;
    });

});

