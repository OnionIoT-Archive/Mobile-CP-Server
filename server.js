'use strict';

// SockJS with Express 3
var express = require('express'),
    connect = require('connect'),
    uuid = require('node-uuid'),
	http = require('http'),
	https = require('https'),
	fs = require('fs');

var database = require('./database'),
    realtime = require('./realtime');

// creating SSL options
var sslOptions = {
    key: fs.readFileSync('/etc/onion-ssl/onion.io.key.pem'),
    cert: fs.readFileSync('/etc/onion-ssl/onion.io.crt.pem'),
    ca: fs.readFileSync('/etc/onion-ssl/gd_bundle-g2-g1.crt')
};

// Create servers
var httpExpressServer = express();
var httpsExpressServer = express();

var httpServer = http.createServer(httpExpressServer);
var httpsServer = https.createServer(sslOptions, httpsExpressServer);

realtime.init(httpsServer);

//====================
// HTTPS Server
//====================

// Configure the express server
httpsExpressServer.use(connect.cookieParser());
httpsExpressServer.use(connect.session({secret: 'OnionSessionQly71fRMT3e6igqZ'}));


// Assign unique ID to user's app. Account registration is optional
httpsExpressServer.get('/app/register', function (req, res) {
    var appId = uuid.v4();
    database.registerApp(appId, function (err) {
        if (!err) {
            res.end(JSON.stringify({
                appId: appId
            }));
        }
    });
});

// TESTING ONLY!!
/*httpsExpressServer.get('/ap', function (req, res) {
    res.end();
});
httpsExpressServer.post('/ap', function (req, res) {
    res.end();
});*/

httpsExpressServer.get('/device/:appId', function (req, res) {
    var appId = req.params.appId;
    if (realtime.connections[appId]) realtime.connections[appId].emit('DEVICE_ONLINE');
    res.end();
});

// Authenticate user
httpsExpressServer.post('/users/auth', function (req, res) {
    var data = '';

    req.on('data', function (chunk) {
        data += chunk;
    });

    req.on('end', function () {
        data = JSON.parse(data);
        database.authUser(data.email, data.pwHash, function (rows) {
            if (rows.length && rows[0].pw_hash === data.pwHash) {
                res.end(JSON.stringify({
                    success: true
                }));
            } else {
                res.end(JSON.stringify({
                    success: false
                }));
            }
        });
    });
});

// Adding user
httpsExpressServer.post('/users/add', function (req, res) {
    var data = '';

    req.on('data', function (chunk) {
        data += chunk;
    });

    req.on('end', function () {
        data = JSON.parse(data);
        database.addUser(data.email, data.pwHash, function (err) {
            if (err) {
                res.end(JSON.stringify({
                    success: false
                }));
            } else {
                res.end(JSON.stringify({
                    success: true
                }));
            }
        });
    });
});

/*httpsExpressServer.get('*', function(req, res) {
	res.redirect('/');
});*/


//====================
// HTTP Server
//====================

// Redirect all traffic to https
httpExpressServer.all('*', function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        res.redirect('https://' + req.headers['host'] + req.url);
    } else {
        next();
    }
});

httpServer.listen(80);
httpsServer.listen(443);




