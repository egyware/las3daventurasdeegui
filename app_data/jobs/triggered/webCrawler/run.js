const db = require('../../../../database.js')
const cheerio = require('cheerio');
const axios = require('axios');
const url   = require('url');
const vm    = require('vm');
const Q     = require('q');


//constantes

// var admin = require("firebase-admin");

// var serviceAccount = require("las3daventurasdeegui-firebase-adminsdk-4w365-aae9a791e7");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://las3daventurasdeegui.firebaseio.com"
// });

//parche para iniciar la base de datos
fetchData('https://las3daventurasdeegui.azurewebsites.net/')
.then(crawler)
.catch(console.log.bind(console))

var enlacesVisitados = [];
function scrap(crawlerData, enlaces) {
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
                    var promesa = 
                    db.query(`SELECT Stock, Precio FROM stock WHERE ProveedorId = ? and Sku = ? and (Stock <> ? or Precio <> ?)`, [crawlerData.id, sku, stock, precio])
                    .then(function(results)
                    {
                        if(results.length > 0)
                        {
                            let resultado = results[0];
                            
                            if(resultado.stock > stock)
                            {
                                //llegó stock
                                console.log('llego stock');
                            }
                            if(resultado.precio > precio)
                            {
                                //bajo el precio
                                console.log('bajo precio');
                            }
                        }
                    })
                    .then(db.query(`INSERT INTO stock (ProveedorId, Sku, Nombre, Marca, Stock, Precio, Link)
                                    VALUES(?,?,?,?,?,?,?)
                                    ON DUPLICATE KEY UPDATE Stock = VALUES(Stock), Precio = VALUES(Precio), UltimaActualizacion = NOW()`,
                                    [crawlerData.id, sku, nombre, marca, stock, precio, enlace])
                        .then(function(results){
                            //console.log("Insert:", results);
                        }))                    
                    .catch(console.log.bind(console));                    
                    promesas.push(promesa);
                }
            };
                        
            try {
                var context = new vm.createContext(sandbox);            
                crawlerData.script.runInContext(context);
            } catch (e) {
                console.log(e.message + "\n", enlace);                
            }

            return siguientesEnlaces;
        }).then(function(siguientesEnlaces){
            if (siguientesEnlaces.length > 0)
            {
                return Q.allSettled(scrap(crawlerData, siguientesEnlaces))
            }
        })
        .catch(console.log.bind(console));
        return (promesa);
    }); //end map
    return Q.all(promesas);
}

async function crawler(){    

    db.query(`SELECT id, crawler, script FROM proveedores WHERE crawler IS NOT NULL and id`)
       .then(
            function handleResults(results){
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
        ).then(function(results){            
            var promesas = results.map(function(crawlerData) {
                return scrap(crawlerData, crawlerData.origenes);
            });
            return Q.allSettled(promesas);
        })
        .catch(console.log.bind(console))
        .done(function(){        
             db.end();  
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
