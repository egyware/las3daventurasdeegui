const db    = require('../../../../database.js')
const admin = require("firebase-admin");
const cheerio = require('cheerio');
var stdio   = require('stdio');
const axios = require('axios');
const url   = require('url');
const vm    = require('vm');
const Q     = require('q');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS || '../../../../las3daventurasdeegui-firebase-adminsdk-4w365-aae9a791e7.json');

const app = admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
   databaseURL: "https://las3daventurasdeegui.firebaseio.com"
});

function groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

function obtenerTitulo(tipo)
{                              
    switch(tipo)
    {
        case "SINSTOCK":
            return 'Stock agotado'
        case "REBAJA":
            return 'REBAJA EN EL PRECIO!!';
        case "HAYSTOCK":
            return 'Stock Disponible';
        case "NUEVO":
            return  'Nuevo producto disponible'
        default:
            return tipo;
    }    
}

function obtenerDescripcion(tipo, proveedorNombre)
{                              
    switch(tipo)
    {
        case "SINSTOCK":
            return `Se ha agotado el stock en ${proveedorNombre}`
        case "REBAJA":
            return `Existen productos en rebajas en ${proveedorNombre}`;
        case "HAYSTOCK":
            return `Acaba de llegar stock a ${proveedorNombre}`;
        case "NUEVO":
            return  `Nuevos productos en ${proveedorNombre}`;
        default:
            return tipo;
    }    
}

function concatena(text, value, i, array) {
    return text + (i < array.length - 1 ? ', ' : ' y ') + value;
}

//parche para iniciar la base de datos
fetchData('https://las3daventurasdeegui.azurewebsites.net/')
.then(crawler)
.catch(console.log.bind(console))

var notificaciones = [];
var enlacesVisitados = [];
var anchorLinkRegex = /#.*?$/i
function scrap(crawlerData, enlaces) {
    var promesas = enlaces.map(function(enlace){
        //aunque falle traer la pagina, igual se anaide en los enlaces visitados
        enlacesVisitados.push(enlace);

        var promesa = fetchData(enlace)
        .then(async (res) => {
            const html = res.data;
            const $ = cheerio.load(html);
            const hrefs = $('a');            
            //revisar otros enlaces            
            var siguientesEnlaces = [];              
            hrefs.each(function(){
                let href = $(this).attr('href');
                if(typeof href !== 'undefined')
                {       
                    let nuevoEnlace = url.resolve(enlace, href);
                    nuevoEnlace = nuevoEnlace.replace(anchorLinkRegex, ''); //borramos todos los # que no, nos sirven ni aportan en nada.
                    if(crawlerData.validLinks.test(nuevoEnlace) && crawlerData.validProducts.test(nuevoEnlace))
                    {                                                   
                        if(!enlacesVisitados.includes(nuevoEnlace) && !siguientesEnlaces.includes(nuevoEnlace))
                        {
                            siguientesEnlaces.push(nuevoEnlace);
                        }
                    }            
                }
            });

            //creando una caja de arena para ejecutar scripts de la base de datos            
            let promesasSandbox = [];
            let sandbox = {                
                $: $,
                jQuery: $, //alias
                enlace:enlace,
                save: function(sku, nombre, marca, stock, precio, enlace){
                    let promesaSave = 
                    db.query(`SELECT Stock, Precio FROM stock WHERE ProveedorId = ? and Sku = ?`, [crawlerData.id, sku])
                    .then(function(results)
                    {
                        let notificacion = {
                            proveedorId: crawlerData.id,
                            proveedorNombre: crawlerData.empresa,
                            sku: sku,
                            nombre: nombre,
                            marca: marca,                            
                            tipo: null,
                            descripcion: null                           
                        }
                        if(results.length > 0)
                        {
                            let resultado = results[0];                            
                            
                            if(resultado.Stock > 0 && stock == 0)
                            {                              
                                notificacion.tipo      = "SINSTOCK"; 
                                notificacion.descripcion = `Se acabó ${nombre}`;
                            }else
                            if(resultado.Precio > precio)
                            {
                                notificacion.tipo = "REBAJA"; 
                                notificacion.descripcion = `Aprovecha ${nombre} tiene una rebaja de ${(1 - (precio / resultado.Precio))*100}%`;
                            }else
                            if(resultado.Stock < stock)
                            {                           
                                notificacion.tipo = "HAYSTOCK"; 
                                notificacion.descripcion = `Disponible ${stock} unidades de ${nombre} en ${notificacion.proveedorNombre}`;
                            }
                        }else{
                            notificacion.tipo = "NUEVO";
                            notificacion.descripcion = `Nuevo ${nombre} a ${notificacion.proveedorNombre}`;
                        }                                              
                        if(notificacion.tipo != null)
                        {
                            notificaciones.push(notificacion);
                        }

                    })
                    .then(function(){
                        return db.query(`INSERT INTO stock (ProveedorId, Sku, Nombre, Marca, Stock, Precio, Link)
                                    VALUES(?,?,?,?,?,?,?)
                                    ON DUPLICATE KEY UPDATE Stock = VALUES(Stock), Precio = VALUES(Precio), UltimaActualizacion = NOW()`,
                                    [crawlerData.id, sku, nombre, marca, stock, precio, enlace])
                        .then(function(results){
                            //console.log("Insert:", results);
                        });
                    })                    
                    .catch(console.log.bind(console));                    
                    promesasSandbox.push(promesaSave);
                }
            };
                        
            try {
                var context = new vm.createContext(sandbox);            
                crawlerData.script.runInContext(context);
            } catch (e) {
                console.log(e.message + "\n", enlace);                
            }            
            //esperamos todas las promesas hechas en esta iteración antes de pasar a la siguiente
            await Q.allSettled(promesasSandbox);
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
    const options = stdio.getopt({
        'proveedores': {key: 'p', args: '*', description: 'Lista de proveedores a revisar', multiple: true}
    });
    if(typeof options.proveedores === 'undefined') options.proveedores = [];
    if(typeof options.proveedores !== 'object') options.proveedores = [ options.proveedores];
    
    db.query(`SELECT id, empresa, crawler, script FROM proveedores WHERE crawler IS NOT NULL ${options.proveedores.length > 0 ? `and id IN (${options.proveedores.join(',')})`: ''}`)
       .then(
            function handleResults(results){
                results = results.map(currentValue => { 
                    let crawlerData = JSON.parse(currentValue.crawler);                                        
                    crawlerData.id      = currentValue.id; //el id
                    crawlerData.empresa = currentValue.empresa;
                    crawlerData.script  = new vm.Script(currentValue.script);
                    crawlerData.validLinks    = new RegExp(crawlerData.validLinks, 'i');
                    crawlerData.validProducts = new RegExp(crawlerData.validProducts, 'i');                    
                    
                    return crawlerData;
                });           
                return results;
            },
            function handleError(error){                                      
                console.error(error);
            })
        .then(async function(results){            
            var promesas = results.map(function(crawlerData) {
                return scrap(crawlerData, crawlerData.origenes);
            });
            await Q.allSettled(promesas);
        })
        .then(async function(){
            let tokens = null;
            await db.query(`select token from subscriptores`)
            .then(function(results) {
                tokens = results.map(currentValue => currentValue.token);
            })
            return tokens;
        })
        .then(function(tokens){     
            if(notificaciones.length > 0){
                let notificacionesProveedores = groupBy(notificaciones, 'proveedorId');

                for (let [proveedorId, notificacionesProveedor] of Object.entries(notificacionesProveedores)) {                    
                    let notificacionesTipos = Object.entries(groupBy(notificacionesProveedor, 'tipo'));                    
                    if(notificacionesTipos.length == 1) //si hay un solo tipo lo notificamos
                    {                   
                        let notificacionesTipo = notificacionesTipos[0];
                        let tipo           = notificacionesTipo[0];
                        let notificaciones = notificacionesTipo[1]; //no confundir con la variable del scope anterior                        
                        let message = {
                            notification: {
                                title: obtenerTitulo(tipo),
                                body: obtenerDescripcion(tipo, notificaciones[0].proveedorNombre) //se puede sacar de forma segura del primero
                            },
                            webpush: {
                                fcm_options: {
                                    link: `https://las3daventurasdeegui.azurewebsites.net/proveedor/${proveedorId}`
                                }
                            },
                            tokens: tokens
                        };
                        
                        if(notificaciones.length == 1) //si hay una sola, reemplazamos la notificacion por defecto
                        {
                            message.notification.body = notificaciones[0].descripcion;
                        }

                        return message;                        
                    } else { //si hay varios tipos                        
                        let notificacionesTipo = notificacionesTipos[0];
                        //let tipo           = notificacionesTipo[0];
                        let notificaciones = notificacionesTipo[1];                            
                        let message = {
                            notification: {
                                title: `HAY NOVEDADES EN ${notificaciones[0].proveedorNombre}`,
                                body: `LLegó más filamento? o hay rebajas? haz click acá para enterarte`
                            },
                            webpush: {
                                fcm_options: {
                                    link: `https://las3daventurasdeegui.azurewebsites.net/proveedor/${proveedorId}`
                                }
                            },
                            tokens: tokens
                        };

                        return message;                                              
                    }                  
                };                
            }
            return null;
        })
        .then(async function(message){
            if(message == null) return; //no hacer nada
            await admin.messaging().sendMulticast(message)
                .then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        })
        .catch(console.log.bind(console))        
        .done(function(){            
            db.end();  
            app.delete();
        });
}

async function fetchData(url){
    console.log("Crawling ", url)
    // make http call to url
    let response = await axios(url);    
    if(typeof response === 'undefined' || response.status !== 200){
        console.log("Error occurred while fetching data");
        throw new Error(`Cannot fetch: ${url}`);
    }
    return response;
}
