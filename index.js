const db      = require('./database.js')
const express = require('express');
const path = require('path');
const Q    = require('q');
const tl   = require('express-tl')
const { spawn } = require('child_process');
const fs   = require('fs');
var app = express();

app.engine('tl', tl)
app.set('views', './views') // specify the views directory
app.set('view engine', 'tl') // register the template engine
app.use(express.json())
app.use(express.urlencoded())

//constantes
const port = process.env.PORT || 1337;

app.get('/run/:job', function(req, res){
    let jobPath = path.join('./jobs/', req.params.job);
    const job = spawn('node', [jobPath]);
    job.stdout.on('data', data => { 
        res.write(data);
    });
    job.on('close', (code) => {
        res.end();
    });
})


app.get('/', function(req, res){

    db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
        FROM proveedores AS P
        LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)       
        GROUP BY P.id`)
    .then(function(results) {       
        res.render('index', {
            proveedores: results
        })
    })
    .catch(console.log.bind(console));    
});

app.get('/proveedor/:id', async function(req, res){
    let proveedor = 
        await db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
                        FROM proveedores AS P
                        LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)
                        WHERE P.id = ?
                        GROUP BY P.id`, [req.params.id])    
    let stock = 
        await db.query(`SELECT S.Sku, S.ProveedorId, S.Nombre, S.Marca, S.Stock, S.Precio, S.Link, S.UltimaActualizacion, D.Precio as PrecioAnterior, D.Stock as StockAnterior, D.Fecha
                        FROM stock as S
                        LEFT JOIN stockdelta as D ON (S.ProveedorId = D.ProveedorId and S.Sku = D.Sku)
                        INNER JOIN (
                        SELECT D.sku, MIN(Fecha) as Fecha
                        FROM stockdelta as D
                        INNER JOIN stock as S ON (S.proveedorId = D.proveedorId and S.sku = D.sku and S.UltimaActualizacion <> D.fecha)
                        WHERE D.ProveedorId = ?
                        GROUP BY D.sku
                        ) as F ON (D.sku = F.sku and D.Fecha = F.Fecha)
                        WHERE S.ProveedorId = ?`, [ req.params.id, req.params.id ]);
    res.render('proveedor', {
        proveedor: proveedor.length>0?proveedor[0]: null,
        stock:stock
    })
    
});


//codigo
app.use(express.static('public'));

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

