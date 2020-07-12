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
obtenerPagina('https://las3daventurasdeegui.azurewebsites.net/')
.then(crawler)
.catch(console.log.bind(console))

function hashCode(string)
{
    let hash = 0, i, chr;
    for (i = 0; i < string.length; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

const alwaysFalse = {
    test : function() { return false; }
}

async function sandbox(crawlerData, $, enlace){
    //creando una caja de arena para ejecutar scripts de la base de datos            
    let promesasSandbox = [];
    let sandbox = {                
        $: $,
        jQuery: $, //alias
        hashCode: hashCode,
        enlace: enlace,        
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
                }else if(stock > 0) { //solo si vale la pena
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
        console.log('Sandbox:', e.message, enlace);                
    }            
    //esperamos todas las promesas hechas en esta iteración antes de pasar a la siguiente
    await Q.allSettled(promesasSandbox);
}

var notificaciones = [];
var enlacesVisitados = [];
var anchorLinkRegex = /#.*?$/i
async function scrap(crawlerData, enlaces) {    
    let promesas = enlaces.map(function(enlace){
        //aunque falle traer la pagina, igual se anaide en los enlaces visitados
        enlacesVisitados.push(enlace);

        let promesa = obtenerPagina(enlace)
        .then(async (res) => {
            const html = res.data;
            const $ = cheerio.load(html);
            const hrefs = $('a');            
            //revisar otros enlaces            
            let siguientesEnlaces = [];              
            hrefs.each(function(){
                let href = $(this).attr('href');
                if(typeof href !== 'undefined')
                {       
                    let nuevoEnlace = url.resolve(enlace, href);
                    nuevoEnlace = nuevoEnlace.replace(anchorLinkRegex, ''); //borramos todos los # que no, nos sirven ni aportan en nada.
                    if(crawlerData.validLinks.test(nuevoEnlace) && crawlerData.validProducts.test(nuevoEnlace))
                    {       
                        if(!crawlerData.invalidProducts.test(nuevoEnlace) && !enlacesVisitados.includes(nuevoEnlace) && !siguientesEnlaces.includes(nuevoEnlace))
                        {
                            siguientesEnlaces.push(nuevoEnlace);
                        }
                    }            
                }
            });

            await sandbox(crawlerData, $, enlace);

            return siguientesEnlaces;
        }).then(async function(siguientesEnlaces){
            if (siguientesEnlaces.length > 0)
            {
                await scrap(crawlerData, siguientesEnlaces);
            }
        })
        .catch(function(err){
            console.log('Scrap:', err.message);
        });
        return promesa;
    }); //end map
    await Q.allSettled(promesas);        
}

async function crawler(){    
    const options = stdio.getopt({
        'proveedores': {key: 'p', args: '*', description: 'Lista de proveedores a revisar', multiple: true}
    });
    if(typeof options.proveedores === 'undefined') options.proveedores = [];
    if(typeof options.proveedores !== 'object') options.proveedores = [ options.proveedores];
    
    db.query(`SELECT id, empresa, crawler, script FROM proveedores WHERE crawler IS NOT NULL ${options.proveedores.length > 0 ? `and id IN (${options.proveedores.join(',')})`: ''}`)
       .then(
            function (results){
                results = results.map(currentValue => { 
                    let crawlerData = JSON.parse(currentValue.crawler);                                        
                    crawlerData.id      = currentValue.id; //el id
                    crawlerData.empresa = currentValue.empresa;
                    crawlerData.script  = new vm.Script(currentValue.script);
                    crawlerData.validLinks    = crawlerData.validLinks    != null?new RegExp(crawlerData.validLinks, 'i'):alwaysFalse;
                    crawlerData.validProducts = crawlerData.validProducts != null?new RegExp(crawlerData.validProducts, 'i'):alwaysFalse;
                    crawlerData.invalidProducts = (typeof crawlerData.invalidProducts !== 'undefined' && crawlerData.invalidProducts != null)?new RegExp(crawlerData.invalidProducts, 'i'):alwaysFalse;
                    return crawlerData;
                });           
                return results;
            })
        .then(async function(results){            
            let promesas = results.map(function(crawlerData) {
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
                let messages = []
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

                        messages.push(message);
                    } else { //si hay varios tipos                        
                        let notificacionesTipo = notificacionesTipos[0];
                        //let tipo           = notificacionesTipo[0];
                        let notificaciones = notificacionesTipo[1];                            
                        let message = {
                            notification: {
                                title: `HAY NOVEDADES EN ${notificaciones[0].proveedorNombre}`,
                                body: `Llegó más filamento? o hay rebajas? haz click acá para enterarte`
                            },
                            webpush: {
                                fcm_options: {
                                    link: `https://las3daventurasdeegui.azurewebsites.net/proveedor/${proveedorId}`
                                }
                            },
                            tokens: tokens
                        };

                        messages.push(message);
                    }                  
                }
                return messages;                
            }
            return null;
        })
        .then(async function(messages){
            if(messages == null) return; //no hacer nada
            let messagePromises = messages.map( message => 
                admin.messaging().sendMulticast(message)
                    .then((response) => {
                        // Response is a message ID string.
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.log('Error sending message:', error);
                    })
                )            
            await Q.allSettled(messagePromises);
        })
        .catch(console.log.bind(console))        
        .done(function(){            
            console.log('Job finalizado');
            db.end();  
            app.delete();
        });
}

async function obtenerPagina(url){    
    console.log('obtenerPagina:', url);
    let response = 
        await axios(url,{timeout: 30000}).catch(function(err) { return null; }); 
    if(response == null || response.status !== 200) 
        throw new Error(`No se puede obtener: ${url}`);
    return response;
}
