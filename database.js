'use strict';

var mysql = require('mysql');

var dbConfig = {
	'host': 	'db-1.cfebhf8gsanf.us-east-1.rds.amazonaws.com',
    'database': 'device_users',
    'user': 	'root',
    'password': 'M3taphys!cs'
};

//====================
//  Initialization
//====================

var db = null;

var setupDB = function () {
    // Create a DB connection 
    db = mysql.createConnection(dbConfig);
    
    // Setup error handling
    db.on('error', function (err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
            console.log('Database disconnected;')
        } 
    });

    // Setup keep alaive for every hour
    setInterval(function () {
        db.query('DO 0');
    }, 3600000);
}

setupDB();


//====================
//  App Functions
//====================

var registerApp = function (appId, callback) {
	var data = {
		app_id: appId
	};

	db.query('INSERT INTO users SET ?' , [data], function (err, result) {
        if (err) { 
            db.rollback(function () {
                callback(err);
            });
        }
        callback();
    });
};

//====================
//  User Functions
//====================

var addUser = function (email, pwHash, callback) {
    var data = {
        email: email,
        pw_hash: pwHash
    };

    db.query('INSERT INTO users SET ?' , [data], function (err, result) {
        if (err) { 
            db.rollback(function () {
                callback(err);
            });
        }
        callback();
    });
};

var authUser = function (email, pwHash, callback) {
	db.query('SELECT * FROM users WHERE email=?', [email], function (err, rows, fields) {
        if (err) { 
            throw err;
        }

        callback(rows);
    });
};


module.exports = {
	registerApp: registerApp,

	addUser: addUser,
	authUser: authUser
};


