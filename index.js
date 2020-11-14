const crypto = require('crypto');
const db      = require('./database.js')
const express = require('express');
const path = require('path');
const Q    = require('q');
const fs   = require('fs');
var app = express();
var apiRoute = express.Router();

app.set('views', './views') // specify the views directory
app.use(express.json())
app.use(express.urlencoded())
app.use(express.static('public'));
app.use("/api", apiRoute);


//constantes
const port = process.env.PORT || 1337;
const publicKey   = fs.readFileSync('public.key', { encoding:'utf8', flag:'r'});

app.get('/', function(req, res){
    res.redirect('https://las3daventurasdeegui.cl'); //redirigir a mi dominio
});

apiRoute.get('/proveedor', async function(req, res)
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
});

apiRoute.post('/proveedores', function(req, res){
    db.query('INSERT INTO `proveedores` (`website`, `empresa`, `descripcion`) VALUES(?, ?, ?)',[req.body.website, req.body.nombre, req.body.descripcion])
    .then(function(){        
        res.redirect('/');
    })
    .catch(console.log.bind(console));
});
apiRoute.get('/proveedor/search', async function(req, res)
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
});

apiRoute.get('/proveedor/:id', async function(req, res)
{
    db.query(`SELECT P.id, P.website, P.empresa, P.favicon, P.descripcion, COUNT(S.ProveedorId) AS scrapedProductos
              FROM proveedores AS P              
              LEFT JOIN stock  AS S ON (P.id = S.ProveedorId)
              WHERE P.id = ?
              GROUP BY P.id`, [req.params.id])    
     .then(function(results) {            
        if(results.length > 0)
         {
            res.send(results[0]);
         }
         else
         {
            res.status(404).end()
         }
     })
     .catch(function(err) {
         res.status(500).send(err.message);
     });
});

apiRoute.get('/proveedor/:id/track', async function(req, res)
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
});

apiRoute.get('/proveedor/:id/stock', async function(req, res)
{    
    await db.query(`SET @deltaRow = 0`)
    await db.query(`SET @stockRow = 0`)
    await db.query(`SET @deltaSku = ''`)
    await db.query(`SET @stockSku = ''`)
    await db.query(`SELECT 
    S.sku, S.ProveedorId, S.Nombre, S.Marca, S.Stock, S.Precio, S.Link, S.UltimaActualizacion, S.Precio as PrecioAnterior, StockAnterior, S.Fecha
FROM 
(
    SELECT
        @stockRow:=CASE WHEN @stockSku = S.sku THEN @stockRow + 1 ELSE 1 END AS stockRow,		
        @stockSku:=S.sku as sku,deltaRow,
        S.ProveedorId, S.Nombre, S.Marca, S.Stock, S.Precio, S.Link, S.UltimaActualizacion, S.PrecioAnterior, S.StockAnterior, S.Fecha
    FROM
    (
        SELECT		
            deltaRow, S.sku, S.ProveedorId, S.Nombre, S.Marca, S.Stock, S.Precio, S.Link, S.UltimaActualizacion, D.Precio as PrecioAnterior, D.Stock as StockAnterior, D.Fecha
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
            ORDER BY ProveedorId, sku, fecha DESC
        ) as D ON (S.ProveedorId = D.ProveedorId and S.sku = D.Sku)
        WHERE D.deltaRow <= 2    
        ORDER BY ProveedorId, S.sku, D.Fecha ASC
    ) as S    
) as S
Where StockRow = 1 and ProveedorId = ?`, [ req.params.id ])
    .then(function(results) {       
        res.send(results);
    })
    .catch(function(err) {
        res.status(500).send(err.message);
    });
    
});

//subir data
apiRoute.post('/proveedor/:id/stock', async function(req, res)
{   
    //talvez esta comprobacion se pueda hacer en alguna parte centralizada
    const body = req.body;    
    const stringified = JSON.stringify(body.data)    
    const isVerified = crypto.verify(
        "sha256",
        Buffer.from(stringified),
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        Buffer.from(body.signature, "base64")
    );
    //si el origen de los datos está verificado o no
    if(isVerified)
    {
        const articulo = body.data;
        db.query(`INSERT INTO stock (ProveedorId, Sku, Nombre, Marca, Stock, Precio, Link)
                 VALUES(?,?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE Stock = VALUES(Stock), Precio = VALUES(Precio), UltimaActualizacion = NOW()`,
                 [req.params.id, articulo.sku, articulo.nombre, articulo.marca, articulo.stock, articulo.precio, articulo.enlace])
         .then(function(results) {       
             res.status(200).end();
         })
         .catch(function(err) {
             res.status(500).send(err.message);
        });
    }
    else
    {
        res.status(401).send("No autorizado");
    }
});

//dejaré esto aqui como plantilla, porque no lo usaré
// apiRoute.post('/broadcast', async function(req, res)
// {   
//     //talvez esta comprobacion se pueda hacer en alguna parte centralizada
//     const body = req.body;    
//     const stringified = JSON.stringify(body.data)    
//     const isVerified = crypto.verify(
//         "sha256",
//         Buffer.from(stringified),
//         {
//             key: publicKey,
//             padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
//         },
//         Buffer.from(body.signature, "base64")
//     );
//     //si el origen de los datos está verificado o no
//     if(isVerified)
//     {
//         const message = body.data;
      
//     }
//     else
//     {
//         res.status(401).send("No autorizado");
//     }
// });

//subscribirse

apiRoute.post('/subcribirse', function(req, res){
    db.query('INSERT INTO `subscriptores` (`token`) VALUES(?)',[req.body.token])
    .then(function(){        
        res.sendStatus(200);
    })
    .catch(console.log.bind(console));
});


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



