const cheerio = require('cheerio');
const mysql = require('mysql');
const axios = require('axios');
const url   = require('url');
const Q     = require( "q" );
const fs    = require('fs')


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

//parche para iniciar la base de datos
fetchData('https://las3daventurasdeegui.azurewebsites.net/')
.then(crawler);

const regex = /\/[Pp][Rr][Oo][Dd][Uu][Cc][Tt][Oo]\//g;
let keywords = /(PLA)|(TPU)|(filamento)/i;

var enlacesVisitados = [];
async function scrap(enlaces) {
    siguientesEnlaces = [];    
    var promesas = enlaces.map(function(enlace){        
        //aunque falle traer la pagina, igual se anaide en los enlaces visitados
        enlacesVisitados.push(enlace);
        var promesa = fetchData(enlace).then((res) => {
            const html = res.data;
            const $ = cheerio.load(html);
            const hrefs = $('a');
            
            //revisar otros enlaces
            hrefs.each(function(){
                let href = $(this).attr('href');
                if(typeof href !== 'undefined' && regex.test(href))
                {   
                    if(keywords.test(href))
                    {
                        let nuevoEnlace = url.resolve(enlace, href);
                        if(!enlacesVisitados.includes(nuevoEnlace) && !siguientesEnlaces.includes(nuevoEnlace))
                        {
                            siguientesEnlaces.push(nuevoEnlace);
                        }
                    }            
                }
            });
            
            //revisar si existen fichas de producto
            let producto = $('.ficha_producto');            
            if(producto.length > 0){                
                let sku    = producto.find('.ficha_titulos > p > span').text().replace(/\s+/g, ' ');                
                let marca  = producto.find('.ficha_titulos > h1 > span:first-child').text().replace(/\s+/g, ' ');                
                let nombre = producto.find('.ficha_titulos > h1 > span:last-child').text().replace(/\s+/g, ' ');                
                let precio = producto.find('.ficha_precio_normal > h2').text().replace(/\s+/g, ' ').replace(/[\.$]/g, '');
                let stock  = producto.find(".ficha_producto_tiendas > ul > li > a[href^='tiendas'] :last-child").toArray().map(function(currentValue) { return parseInt($(currentValue).text().replace(/[\s\+\.a-zA-Z]+/g, '')); }).reduce((a,b)=> a+b, 0);
                promesa.then(db.query(`INSERT INTO stock (ProveedorId, Sku, Nombre, Marca, Stock, Precio, Link)
                                         VALUES(?,?,?,?,?,?,?)
                                         ON DUPLICATE KEY UPDATE Stock = VALUES(Stock), Precio = VALUES(Precio), UltimaActualizacion = NOW()`,
                                         [4, sku, nombre, marca, stock, precio, enlace]))
                        .then(
                            function handleResults(results){

                            },
                            function handleError(error){                                      
                                console.error(error);
                            }
                        ); 
            }
        });
        return (promesa);
    });
    Q
    .allSettled(promesas)
    .then(function(){
        if (siguientesEnlaces.length > 0)
            return scrap(siguientesEnlaces)
    }).catch(function (error) {
        // We get here with either foo's error or bar's error
        console.log(error);
    }).done(function(){        
        pool.end();  
    });    
}

async function crawler(){    

    var enlaces = ["https://www.pcfactory.cl/buscar?valor=filamento"];
    await scrap(enlaces);
}

async function fetchData(url){
    console.log("Crawling ", url)
    // make http call to url
    let response = await axios(url).catch((err) => console.log(err));

    if(response.status !== 200){
        console.log("Error occurred while fetching data");
        return;
    }
    return response;
}
