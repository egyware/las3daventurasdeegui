const cheerio = require('cheerio');
const mysql = require('mysql');
const axios = require('axios');
const fs = require('fs')
var Q = require( "q" );


//constantes
var connectionString = 'mysql://egui:passwd@localhost/las3daventuras';
const filename = 'D:\\home\\data\\mysql\\MYSQLCONNSTR_localdb.txt';
if(fs.existsSync(filename))
{
    connectionString = fs.readFileSync(filename, { encoding:'utf8', flag:'r'});        
}

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

var db = {
	query: function( sql, params ) {
		var deferred = Q.defer();

		// CAUTION: When using the node-resolver, the records and fields get passed into
		// the resolution handler as an array.
		pool.query( sql, params, deferred.makeNodeResolver() );

		return( deferred.promise );
	}
};


const url = "https://www.pcfactory.cl/buscar?valor=filamento";

fetchData(url).then( (res) => {
    const html = res.data;
    const $ = cheerio.load(html);
    const productos = $('.wrap-caluga-matrix');

    var promises = []
    productos.each(function() {
        let producto = $(this);        
        
        let sku = producto.find('.id-caluga').text().replace(/\s+/g, ' ');
        let marca = producto.find('.marca').text().replace(/\s+/g, ' ');
        let nombre = producto.find('.nombre').text().replace(/\s+/g, ' ');
        let precio = producto.find('.txt-precio').text().replace(/\s+/g, ' ').replace(/[\.$]/g, '');
        let stock = producto.find('.status-caluga').text().replace(/[\s\+\.a-zA-Z]+/g, '');
        
        var promise = db.query(`INSERT INTO stock (ProveedorId, Sku, Nombre, Marca, Stock, Precio, Link)
                                VALUES(?,?,?,?,?,?,?)
                                ON DUPLICATE KEY UPDATE Stock = VALUES(Stock), Precio = VALUES(Precio), UltimaActualizacion = NOW()`, [4, sku, nombre, marca, stock, precio, 'https://www.pcfactory.cl/producto/'+sku])
                        .then(
                            function handleResults(results){

                            },
                            function handleError(error){
                                console.error(error);
                            }
                        ); 
        promises.push(promise);
    }); //end producto each
    Q
    .allSettled(promises)
    .then(function(){        
            pool.end();  
        });
    });


async function fetchData(url){
    console.log("Crawling data...")
    // make http call to url
    let response = await axios(url).catch((err) => console.log(err));

    if(response.status !== 200){
        console.log("Error occurred while fetching data");
        return;
    }
    return response;
}