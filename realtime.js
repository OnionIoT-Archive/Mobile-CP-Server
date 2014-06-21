'use strict';

var socket = require('socket.io');

var socketServer,
	connections = {};

var init = function (httpsServer) {
	socketServer = socket.listen(httpsServer, {
		log : false
	});

	socketServer.sockets.on('connection', function (socket) {
		var appId = socket.handshake.query.appId;
		
		connections[appId] = socket;
		
		socket.on('disconnect', function () {
			delete connections[appId];
		});
		console.log('App ' + socket.handshake.query.appId + ' connected.');
	});
};

module.exports = {
	init: init,
	connections: connections
};

