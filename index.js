const express = require('express');
const mysql = require('mysql');
var app = express();

//constantes
const port = process.env.PORT || 1337;
var connectionString = process.env.MYSQLCONNSTR_localdb || 'mysql://egui:passwd@localhost/las3daventuras';

if(!connectionString.startsWith('mysql://')) {
    let pairs = connectionString.split(';');
    let connectionProperties = {}
    pairs.forEach(function(item){
        let pair = item.split('=');
        Object.assign(connectionProperties,  { [pair[0].replace(/ /g, '')]: pair[1] });
    });    
    connectionString = `mysql://${connectionProperties.UserId}:${connectionProperties.Password}@${connectionProperties.DataSource}/${connectionProperties.Database}`    
}

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
