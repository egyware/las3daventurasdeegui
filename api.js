const axios = require('axios');
const fs   = require('fs');
const crypto = require('crypto');
const Q    = require('q');

const apiUrl = 'https://las3daventurasdeegui.cl'
//const apiUrl = 'http://localhost:1337'
let privateKey = fs.readFileSync('private.key', { encoding:'utf8', flag:'r'});

module.exports = 
{
    getStock: function(id, sku)
    {   
        let parameters = {
            method: 'get',
            url: apiUrl+`/api/proveedor/${id}/stock/${sku}`
        }   
        if(Array.isArray(sku)){
            parameters.url = apiUrl+`/api/proveedor/${id}/stock`;
            parameters['sku'] = sku;
        }        
        return Q.fcall(axios, parameters)
        .then(function(results)
        {
            //TODO verificar timeouts, errores en general, etc..
            return results.data;
        });
    },    
    updateStock: function(id, articulo)
    {
        const signature = crypto.sign("sha256", Buffer.from(JSON.stringify(articulo)), {
              key: privateKey,
              padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
         })
        
        const data =
        {
            data:      articulo,
            signature: signature.toString("base64")
        };
        
        return Q.fcall(axios,{
                 method: 'post',
                 url: apiUrl+`/api/proveedor/${id}/stock`,
                 data: data
        })
    },    
    multicast: function(mensaje)
    {
        const signature = crypto.sign("sha256", Buffer.from(JSON.stringify(mensaje)), {
              key: privateKey,
              padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
         })
        
        const data =
        {
            data:      mensaje,
            signature: signature.toString("base64")
        };
        
        return Q.fcall(axios,{
                 method: 'post',
                 url: apiUrl+`/api/multicast`,
                 data: data
        }).then(function(results)
        {
            //TODO verificar timeouts, errores en general, etc..
            return results.data;
        });
    },
    crawlerInfo: function(id)
    {
        return Q.fcall(axios, {
            method: 'get',
            url: apiUrl+ `/api/proveedor/${id}/crawler`,
        })
        .then(function(result){
            const data = result.data;
                
            const secretKey =        
                    crypto.privateDecrypt(privateKey, Buffer.from(data.secretKey, "base64"))
            
            const iv = Buffer.from(data.iv, "base64");
            
            const cipher = crypto.createDecipheriv('aes192', secretKey, iv);
        
            let decrypted = '';
            decrypted+= cipher.update(data.encrypted, 'base64', 'utf8');
            decrypted+= cipher.final('utf8');
            
            return JSON.parse(decrypted);
        });        
    }

}