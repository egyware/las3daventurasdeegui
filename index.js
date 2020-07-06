const db      = require('./database.js')
const express = require('express');
const path = require('path');
const Q    = require('q');
var app = express();

app.use(express.json())
app.use(express.urlencoded())

//constantes
const port = process.env.PORT || 1337;

//codigo
app.use(express.static('public'));

app.get('/proveedor/:id', function(req, res){
    res.sendFile(path.join(__dirname, 'public', 'proveedor.html'));
});
app.get('/api/proveedor/:id', function(req, res){    
    db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
                FROM proveedores AS P
                LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)
                WHERE P.id = ?
                GROUP BY P.id`, [req.params.id])
    .then(function(results) {                    
        res.json(results.length>0?results[0]: null);
    })
    .catch(console.log.bind(console));
});

app.get('/api/proveedores', function(req, res){    
    db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
                FROM proveedores AS P
                LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)
                GROUP BY P.id`)
    .then(function(results) {            
        res.json(results);
    })
    .catch(console.log.bind(console));
});

app.get('/api/stock/:id', function(req, res){
    db.query(`SELECT Nombre, Marca, Stock, Precio, Link
              FROM Stock                          
              WHERE ProveedorId = ?
              ORDER BY Stock DESC`, [req.params.id])
    .then(function (results) {            
        res.json(results);
    })
    .catch(console.log.bind(console));
});

app.post('/api/proveedores', function(req, res){
    db.query('INSERT INTO `proveedores` (`website`, `empresa`, `descripcion`) VALUES(?, ?, ?)',[req.body.website, req.body.nombre, req.body.descripcion])
    .then(function(){        
        res.redirect('/');
    })
    .catch(console.log.bind(console));
});

app.post('/api/subcribirse', function(req, res){
    db.query('INSERT INTO `subscriptores` (`token`) VALUES(?)',[req.body.token])
    .then(function(){        
        res.sendStatus(200);
    })
    .catch(console.log.bind(console));
});

// app.delete('/api/subcribirse', function(req, res){
//     db.query('DELETE `subscriptores` where token = ?',[req.body.token])
//     .then(function(){        
//         res.sendStatus(200);
//     })
//     .catch(console.log.bind(console));
// });

const server = app.listen(port, function() {
    console.log("Server running at http://localhost:%d", port);
});

// no sé si esto funciona en ambiente windows...
// process.on('SIGTERM', () => {
//       
//     console.info('SIGTERM signal received.');
//     console.log('Closing http server.');
//     server.close(() => {        
//       db.end();        
//       console.log('Http server closed.');
//     });
//   });

