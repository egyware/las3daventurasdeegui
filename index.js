const express = require('express');
const mysql = require('mysql');
var app = express();


app.use(express.json())
app.use(express.urlencoded())

//constantes
const port = process.env.PORT || 1337;
var connectionString = process.env.MYSQLCONNSTR_localdb || 'mysql://egui:passwd@localhost/las3daventuras';

if(!connectionString.startsWith('mysql://')) {
    let pairs = connectionString.split(';');
    let connectionProperties = {}
    pairs.forEach(function(item){
        let pair = item.split('=');
        Object.assign(connectionProperties,  { [pair[0].replace(/ /g, '')]: pair[1].replace(/#/g, '%23') });
    });    
    connectionString = `mysql://${connectionProperties.UserId}:${connectionProperties.Password}@${connectionProperties.DataSource}/${connectionProperties.Database}`    
}

var pool = mysql.createPool(connectionString);

//codigo
app.use(express.static('public'));
app.get('/api/proveedores', function(req, res){
    pool.getConnection(function(err, connection) {
        if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }      
        console.log('connected as id ' + connection.threadId);    
        connection.query('SELECT * FROM Proveedores', function (error, results, fields) {
            if (error) throw error;
            // connected!
            res.json(results);   

            connection.release();
        });
    });
});
app.post('/api/proveedores', function(req, res){
    pool.getConnection(function(err, connection) {
        if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }      
        console.log('connected as id ' + connection.threadId); 
        connection.query('INSERT INTO `proveedores` (`website`, `empresa`, `descripcion`) VALUES(?, ?, ?)',[req.body.website, req.body.nombre, req.body.descripcion], function (error, results){
            if (error) throw error;
            // connected!
            res.redirect('/');
        });
    });
});

app.listen(port, function() {
    console.log("Server running at http://localhost:%d", port);
});
