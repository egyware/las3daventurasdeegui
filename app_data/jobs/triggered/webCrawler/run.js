const cheerio = require('cheerio');
const mysql = require('mysql');
const axios = require('axios');
const url   = require('url');
const fs    = require('fs');
const vm    = require('vm');
const Q     = require('q');


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
.then(crawler)
.catch(console.err);;

var enlacesVisitados = [];
async function scrap(crawlerData, enlaces) {
    var promesas = enlaces.map(function(enlace){
        //aunque falle traer la pagina, igual se anaide en los enlaces visitados
        enlacesVisitados.push(enlace);

        var promesa = fetchData(enlace).then((res) => {
            const html = res.data;
            const $ = cheerio.load(html);
            const hrefs = $('a');            
            //revisar otros enlaces            
            var siguientesEnlaces = [];              
            hrefs.each(function(){
                let href = $(this).attr('href');                
                if(typeof href !== 'undefined' && crawlerData.validLinks.test(href))
                {                       
                    if(crawlerData.validProducts.test(href))
                    {                       
                        let nuevoEnlace = url.resolve(enlace, href);
                        if(!enlacesVisitados.includes(nuevoEnlace) && !siguientesEnlaces.includes(nuevoEnlace))
                        {
                            siguientesEnlaces.push(nuevoEnlace);
                        }
                    }            
                }
            });

            //creando una caja de arena para ejecutar scripts de la base de datos
            var sandbox = {                
                $: $,
                enlace:enlace,
                save: function(sku, nombre, marca, stock, precio, enlace){
                    promesa.then(db.query(`INSERT INTO stock (ProveedorId, Sku, Nombre, Marca, Stock, Precio, Link)
                    VALUES(?,?,?,?,?,?,?)
                    ON DUPLICATE KEY UPDATE Stock = VALUES(Stock), Precio = VALUES(Precio), UltimaActualizacion = NOW()`,
                    [crawlerData.id, sku, nombre, marca, stock, precio, enlace]))
                    .then(
                        function handleResults(results){

                        },
                        function handleError(error){                                      
                            console.error(error);
                        }
                    );
                    //console.log([crawlerData.id, sku, nombre, marca, stock, precio, enlace]);
                }    
            };
            
            var context = new vm.createContext(sandbox);            
            crawlerData.script.runInContext(context);

            return siguientesEnlaces;
        }).then(function(siguientesEnlaces){
            if (siguientesEnlaces.length > 0)
                return scrap(crawlerData, siguientesEnlaces)
        }).catch(console.err);
        return (promesa);
    }); //end map
    await Q.allSettled(promesas)
           .catch(console.err);;    
    return promesas;
}

async function crawler(){    

    db.query(`SELECT id, crawler, script FROM proveedores WHERE crawler IS NOT NULL`)
       .then(
            function handleResults(results){
                results = results[0]; // no me gustan esta clase de parches...
                results = results.map(currentValue => { 
                    let crawlerData = JSON.parse(currentValue.crawler);                                        
                    crawlerData.id     = currentValue.id; //el id
                    crawlerData.script = new vm.Script(currentValue.script);
                    crawlerData.validLinks    = new RegExp(crawlerData.validLinks, 'i');
                    crawlerData.validProducts = new RegExp(crawlerData.validProducts, 'i');                    
                    
                    return crawlerData;
                });           
                return results;
            },
            function handleError(error){                                      
                console.error(error);
            }
        ).then(async function(results){
            var promesas = results.map(function(crawlerData) {
                return scrap(crawlerData, crawlerData.origenes);
            });
            await Q.allSettled(promesas)
                   .catch(console.err);
        }).done(function(){        
            pool.end();  
        });
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
