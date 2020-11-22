const mysql = require('mysql');
const fs    = require('fs');
const Q     = require('q');

//dejaré aqui todo lo que concierne a la conexión y manejo de base de datos

var connectionString = process.env.MYSQLCONNSTR_localdb || 'mysql://egui:passwd@localhost/las3daventuras';
const filename = '/home/lasdaven/MYSQLCONNSTR_localdb.txt';

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
    connectionString = `mysql://${connectionProperties.UserId}:${connectionProperties.Password}@${connectionProperties.DataSource}/${connectionProperties.Database}?connectionLimit=3`
}

const pool = mysql.createPool(connectionString);

module.exports = {    
    escape: function(input)
    {
        return pool.escape(input);
    },
    query: function( sql, params ) {
        var deferred = Q.defer();
        pool.query(sql, params, function (err, results) {
            if (err) {
                console.log(sql, params);
                deferred.reject(new Error(err));
            }
            deferred.resolve(results);
        });
        return deferred.promise;       
    },    
    end: function()
    {       
        pool.end();    
    }
};
