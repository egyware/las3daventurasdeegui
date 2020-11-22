'use strict'

const api    = require('../api.js')
const cheerio = require('cheerio');
var stdio   = require('stdio');
const axios = require('axios');
const url   = require('url');
const vm    = require('vm');
const Q     = require('q');


const baseUrl = 'https://las3daventurasdeegui.cl'

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

main()
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

const alwaysTrue = {
    test : function() { return true; }
}

const alwaysFalse = {
    test : function() { return false; }
}

function sandbox(crawlerData, $, enlace){
    //creando una caja de arena para ejecutar scripts de la base de datos            
    let articulos = []    
    let sandbox = {                
        $: $,
        jQuery: $, //alias
        hashCode: hashCode,
        enlace: enlace,        
        save: function(sku, nombre, marca, stock, precio, enlace)
        {            
            const articulo = 
            { 
                sku,
                nombre,
                marca,
                stock, 
                precio, 
                enlace
            };
            articulos.push(articulo);            
        }
    };
                
    try {
        var context = new vm.createContext(sandbox);        
        crawlerData.script.runInContext(context);
    } catch (e) {
        console.log('Sandbox:', e.message, enlace);                
    }            
    //regresamos todos los articulos por agregar
    return articulos;
}

var notificaciones = [];
var enlacesVisitados = [];
var anchorLinkRegex = /#.*?$/i
async function scrap(crawlerData, enlaces) {    
    let articulos = []
    let promesas = enlaces.map(function(enlace){
        //aunque falle traer la pagina, igual se anaide en los enlaces visitados
        enlacesVisitados.push(enlace);

        let promesa = obtenerPagina(enlace)
        .then((res) => {
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

            let articulosPorAgregar = sandbox(crawlerData, $, enlace);
            articulos = articulos.concat(articulosPorAgregar);

            return siguientesEnlaces;
        }).then(async function(siguientesEnlaces){
            if (siguientesEnlaces.length > 0)
            {
                let articulosPorAgregar = await scrap(crawlerData, siguientesEnlaces);
                articulos = articulos.concat(articulosPorAgregar);
            }
        })
        .catch(function(err){
            console.log('Scrap:', err.message);
        });
        return promesa;
    }); //end map
    await Q.allSettled(promesas); 
    return articulos;      
}

async function main(){    
    const options = stdio.getopt({
        'proveedores': {key: 'p', args: '*', description: 'Lista de proveedores a revisar', multiple: true}
    });
    if(typeof options.proveedores === 'undefined') options.proveedores = [];
    if(typeof options.proveedores !== 'object') options.proveedores = [ options.proveedores];
    
    let promesas =
     options.proveedores.map(function(proveedorId) {
        return api.crawlerInfo(proveedorId)
        .then(function (currentValue){                        
            let crawlerData = JSON.parse(currentValue.crawler);                                        
            crawlerData.id      = currentValue.id; //el id
            crawlerData.empresa = currentValue.empresa;
            crawlerData.script  = new vm.Script(currentValue.script);
            crawlerData.validLinks    = crawlerData.validLinks    != null?new RegExp(crawlerData.validLinks, 'i'):alwaysFalse;
            crawlerData.validProducts = crawlerData.validProducts != null?new RegExp(crawlerData.validProducts, 'i'):alwaysTrue;
            crawlerData.invalidProducts = (typeof crawlerData.invalidProducts !== 'undefined' && crawlerData.invalidProducts != null)?new RegExp(crawlerData.invalidProducts, 'i'):alwaysFalse;
            return crawlerData;
        })
        .then(crawler)        
    })   
    await Q.allSettled(promesas);
}

function crawler(crawlerData)
{
    return Q.fcall(async function() {            
        let articulos = await scrap(crawlerData, crawlerData.origenes);
        return { proveedorId:crawlerData.id, proveedorNombre:crawlerData.empresa, articulos };
    })
    .then(async function(scraped)
    {
        // Sku, Stock, Precio
        let results = await api.getStock(scraped.proveedorId, scraped.articulos.map(articulo=>articulo.sku));
        let stockEnWeb = {}
        results.forEach(item => {
            stockEnWeb[item.Sku] = { Precio:item.Stock, Precio:item.Precio }
        });
        scraped.articulos.forEach(articulo => {            
            let notificacion = {
                proveedorId: scraped.proveedorId,
                proveedorNombre: scraped.proveedorNombre,
                sku: articulo.sku,
                nombre: articulo.nombre,
                marca: articulo.marca,                            
                tipo: null,
                descripcion: null                           
            }
            if(stockEnWeb.hasOwnProperty(articulo.sku))
            {
                let articuloEnWeb =  stockEnWeb[articulo.sku];
                
                if(articuloEnWeb.Stock > 0 && articulo.stock == 0)
                {                              
                    notificacion.tipo      = "SINSTOCK"; 
                    notificacion.descripcion = `Se acabó ${articulo.nombre}`;
                }else
                if(articuloEnWeb.Precio > articulo.precio)
                {
                    notificacion.tipo = "REBAJA"; 
                    notificacion.descripcion = `Aprovecha ${articulo.nombre} tiene una rebaja de ${(1 - (articulo.precio / articuloEnWeb.Precio))*100}%`;
                }else
                if(articuloEnWeb.Stock < articulo.stock)
                {                           
                    notificacion.tipo = "HAYSTOCK"; 
                    notificacion.descripcion = `Disponible ${articulo.stock} unidades de ${articulo.nombre} en ${notificacion.proveedorNombre}`;
                }
            }else if(articulo.stock > 0) { //solo si vale la pena
                notificacion.tipo = "NUEVO";
                notificacion.descripcion = `Nuevo ${articulo.nombre} a ${notificacion.proveedorNombre}`;
            }                                              
            if(notificacion.tipo != null)
            {
                notificaciones.push(notificacion);
            }
        }); //fin forEach
        await api.updateStock(scraped.proveedorId, scraped.articulos);
    })
    .then(function(){     
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
                                titulo: obtenerTitulo(tipo),
                                cuerpo: obtenerDescripcion(tipo, notificaciones[0].proveedorNombre), //se puede sacar de forma segura del primero
                                enlace: baseUrl+`/proveedor/${proveedorId}`
                        };                            
                                            
                        if(notificaciones.length == 1) //si hay una sola, reemplazamos la notificacion por defecto
                        {
                            message.cuerpo = notificaciones[0].descripcion;
                        }

                        messages.push(message);
                    } else { //si hay varios tipos                        
                        let notificacionesTipo = notificacionesTipos[0];
                        //let tipo           = notificacionesTipo[0];
                        let notificaciones = notificacionesTipo[1];                            
                        let message = {                            
                                titulo: `HAY NOVEDADES EN ${notificaciones[0].proveedorNombre}`,
                                cuerpo: `Llegó más filamento? o hay rebajas? haz click acá para enterarte`,
                                link: baseUrl+`/proveedor/${proveedorId}`
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
                    api.multicast(message)
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
            console.log(`Tarea finalizada para ${crawlerData.id}`);            
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
