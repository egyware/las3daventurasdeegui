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
        await scrap(crawlerData, crawlerData.origenes);            
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
