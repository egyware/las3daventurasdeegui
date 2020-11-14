const axios = require('axios');
const fs   = require('fs');
const crypto = require('crypto');

const apiUrl = 'http://localhost:1337'
let privateKey = fs.readFileSync('private.key', { encoding:'utf8', flag:'r'});

module.exports = 
{
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
        
        return axios({
                 method: 'post',
                 url: apiUrl+`/api/proveedor/${id}/stock`,
                 data: data
        })
    }    
}