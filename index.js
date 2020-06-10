const express = require('express');
const mysql = require('mysql');
var app = express();

//constantes
const connectionString = process.env.MYSQLCONNSTR_localdb || 'mysql://egui:passwd@localhost/las3daventuras';
const port = process.env.PORT || 1337;

var pool = mysql.createPool(connectionString);

//codigo
app.use(express.static('public'));
app.use('/api/proveedores', function(req, res){
    pool.getConnection(function(err, connection) {
        if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }      
        console.log('connected as id ' + connection.threadId);    
        connection.query('SELECT * FROM Proveedores', function (error, results, fields) {
            if (error) throw error;
            // connected!
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(results));   

            connection.release();
        });
    });
});

app.listen(port, function() {
    console.log("Server running at http://localhost:%d", port);
});
