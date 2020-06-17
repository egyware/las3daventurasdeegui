const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql');


//constantes
var connectionString = process.env.MYSQLCONNSTR_localdb || 'mysql://egui:passwd@localhost/las3daventuras';

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


const url = "https://www.pcfactory.cl/buscar?valor=filamento";


fetchData(url).then( (res) => {
    const html = res.data;
    const $ = cheerio.load(html);
    const productos = $('.wrap-caluga-matrix');
    productos.each(function() {
        let producto = $(this);        
        
        let sku = producto.find('.id-caluga').text().replace(/\s+/g, ' ');
        let marca = producto.find('.marca').text().replace(/\s+/g, ' ');
        let nombre = producto.find('.nombre').text().replace(/\s+/g, ' ');
        let precio = producto.find('.txt-precio').text().replace(/\s+/g, ' ').replace(/[\.$]/g, '');
        let stock = producto.find('.status-caluga').text().replace(/[\s\+\.a-zA-Z]+/g, '');
        
        pool.getConnection(function(err, connection) {
            if (err) {
              console.error('error connecting: ' + err.stack);
              return;
            }      
            console.log('connected as id ' + connection.threadId); 
            connection.query(`INSERT INTO stock (ProveedorId, Sku, Stock, Precio, Link)
                             VALUES(?,?,?,?,?)`,[4, sku, stock, precio, 'https://www.pcfactory.cl/producto/'+sku], 
                function (error){
                    if (error) throw error;
                
                connection.release();                  
            });
        });
    });
})

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