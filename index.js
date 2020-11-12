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
    db.query(`SET @deltaRow = 0;
    SET @deltaSku = '';
    SET @stockRow = 0;
    SET @stockSku = '';
    SELECT S.sku, S.ProveedorId, S.Nombre, S.Marca, S.Stock, S.Precio, S.Link, S.UltimaActualizacion, S.PrecioAnterior, S.StockAnterior, S.Fecha
    FROM
    (
        SELECT
            @stockRow:=CASE WHEN @stockSku = S.sku THEN @stockRow + 1 ELSE 1 END AS stockRow,		
            @stockSku:=S.sku as sku,
            S.ProveedorId, S.Nombre, S.Marca, S.Stock, S.Precio, S.Link, S.UltimaActualizacion, D.Precio as PrecioAnterior, D.Stock as StockAnterior, D.Fecha
        FROM stock as S
        INNER JOIN
        (
            SELECT 
                @deltaRow:=CASE WHEN @deltaSku = sku THEN @deltaRow + 1 ELSE 1 END AS deltaRow,		
                @deltaSku:=sku as sku,
                ProveedorId,
                Fecha,
                Precio,
                Stock        
            FROM
                stockdelta
            ORDER BY ProveedorId, sku, fecha
        ) as D ON (S.ProveedorId = D.ProveedorId and S.sku = D.Sku)
        WHERE D.deltaRow <= 2
    ) as S
    WHERE S.ProveedorId = 4 and S.stockRow = 1`, [ req.params.id ])
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



