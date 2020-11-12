const db      = require('./database.js')
const express = require('express');
const path = require('path');
const Q    = require('q');
const fs   = require('fs');
var app = express();
var router = express.Router();

app.use("/api", router);
app.set('views', './views') // specify the views directory
app.use(express.json())
app.use(express.urlencoded())
app.use(express.static('public'));


//constantes
const port = process.env.PORT || 1337;

app.get('/', function(req, res){
    res.redirect('https://las3daventurasdeegui.cl'); //redirigir a mi dominio
});

router.get('/proveedor', async function(req, res)
{
    db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
              FROM proveedores AS P              
              LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)              
              GROUP BY P.id`)    
     .then(function(results) {       
         res.send(results);
     })
     .catch(function(err) {
         res.status(500).send(err.message);
     });
})

router.get('/proveedor/search', async function(req, res)
{
    db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
              FROM proveedores AS P              
              LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)
              WHERE P.empresa like '%?%'
              GROUP BY P.id`, [req.query.q])    
     .then(function(results) {       
        res.send(results);
     })
     .catch(function(err) {
         res.status(500).send(err.message);
     });
})

router.get('/proveedor/:id', async function(req, res)
{
    db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
              FROM proveedores AS P              
              LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)
              WHERE P.id = ?
              GROUP BY P.id`, [req.params.id])    
     .then(function(results) {       
        res.send(results);
     })
     .catch(function(err) {
         res.status(500).send(err.message);
     });
})

router.get('/proveedor/:id/track', async function(req, res)
{
    //TODO
    db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
              FROM proveedores AS P              
              LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)
              WHERE P.id = ?
              GROUP BY P.id`, [req.params.id])    
     .then(function(results) {       
        res.send(results);
     })
     .catch(function(err) {
         res.status(500).send(err.message);
     });
})

router.get('/proveedor/:id/stock', async function(req, res)
{    
    db.query(`SELECT S.Sku, S.ProveedorId, S.Nombre, S.Marca, S.Stock, S.Precio, S.Link, S.UltimaActualizacion, D.Precio as PrecioAnterior, D.Stock as StockAnterior, D.Fecha
                        FROM stock as S
                        LEFT JOIN stockdelta as D ON (S.ProveedorId = D.ProveedorId and S.Sku = D.Sku)
                        INNER JOIN (
                        SELECT D.sku, MIN(Fecha) as Fecha
                        FROM stockdelta as D
                        INNER JOIN stock as S ON (S.proveedorId = D.proveedorId and S.sku = D.sku and S.UltimaActualizacion <> D.fecha)
                        WHERE D.ProveedorId = ?
                        GROUP BY D.sku
                        ) as F ON (D.sku = F.sku and D.Fecha = F.Fecha)
                        WHERE S.ProveedorId = ?`, [ req.params.id, req.params.id ])
    .then(function(results) {       
        res.send(results);
    })
    .catch(function(err) {
        res.status(500).send(err.message);
    });
    
});


// //codigo

// app.post('/api/proveedores', function(req, res){
//     db.query('INSERT INTO `proveedores` (`website`, `empresa`, `descripcion`) VALUES(?, ?, ?)',[req.body.website, req.body.nombre, req.body.descripcion])
//     .then(function(){        
//         res.redirect('/');
//     })
//     .catch(console.log.bind(console));
// });

// app.post('/api/subcribirse', function(req, res){
//     db.query('INSERT INTO `subscriptores` (`token`) VALUES(?)',[req.body.token])
//     .then(function(){        
//         res.sendStatus(200);
//     })
//     .catch(console.log.bind(console));
// });

// // app.delete('/api/subcribirse', function(req, res){
// //     db.query('DELETE `subscriptores` where token = ?',[req.body.token])
// //     .then(function(){        
// //         res.sendStatus(200);
// //     })
// //     .catch(console.log.bind(console));
// // });

const server = app.listen(port, function() {
     console.log("Server running at http://localhost:%d", port);
});



