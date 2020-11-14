const Q     = require('q');
const axios = require('axios');
const crypto = require('crypto');
const fs   = require('fs');
const firebase   = require('./firebase.js')
const api = require('./api.js')

let publicKey    = fs.readFileSync('public.key', { encoding:'utf8', flag:'r'});
let privateKey   = fs.readFileSync('private.key', { encoding:'utf8', flag:'r'});

 api.crawlerInfo(4).then(function(crawler){
     console.log(crawler)
 })



//  axios({
//          method: 'get',
//          url: 'http://localhost:1337/api/proveedor/4/crawlerInfo',         
//      })
//  .then(function(result){
//     const data = result.data;
     
//     const secretKey =        
//             crypto.privateDecrypt(privateKey, Buffer.from(data.secretKey, "base64")).toString("utf8")
    
//     const cipher = crypto.createDecipher('aes192', secretKey);

//     let decrypted = '';
//     decrypted+= cipher.update(data.encrypted, 'base64', 'utf8');
//     decrypted+= cipher.final('utf8');

//     console.log({secretKey, decrypted, secret:data.secret});
//  })
//  .catch(function(err){
//      console.log(err);
//  })


// const db      = require('./database.js')
// db.query(`SELECT id, crawler, script
//         FROM proveedores
//         WHERE id = ?`, [4])    
// .then(function(results) {
//     if(results.length > 0)
//     {
//         const result = results[0];
//         let resultado = { id:result.id, crawler:result.crawler, script:result.script };
        
//         //puede que sea una aproximación muy sencilla para compartir datos secretos
//         const secret = crypto.randomBytes(128).toString("base64");
//         const cipher = crypto.createCipher('aes192', secret);

//         let encrypted = '';
//         encrypted+= cipher.update(JSON.stringify(resultado), 'utf8', 'base64');
//         encrypted+= cipher.final('base64');
        
//         const secretKey = 
//             crypto.publicEncrypt(publicKey,
//                                  Buffer.from(secret)).toString("base64");

//         console.log({ encrypted, secretKey });
//     }
// })
// .catch(function(err) {
//     console.log(err.message);
// }).done(function()
// {
//     db.end()
// });

// api.multicast({
//     titulo : 'Mensaje Importante para Javier',
//     cuerpo: 'Deja de cobrar tan barato',
//     enlace: 'http://localhost'
// })

// let message = {
//     notification: {
//         title: "Hola Mundo",
//         body: "Pruebaaaaa"
//     },
//     webpush: {
//         fcm_options: {
//             link: 'https://las3daventurasdeegui.cl'
//         }
//     },
//     tokens: ['cB75Pjoflc581im1Jr0CFD:APA91bEX6cu367cyMr6XL7rwBy5gPBBrJty6AY8soFiuSELrmsXElhsegAE50kKVtBZP4czOZZaMJBxgk8_cY-wK8Rqj1UAkkI7bpgrmGpPQzoFIVdiW8kYCF3asAhBBFI9DdpnvSvRj']
// }

// firebase.messaging().sendMulticast(message)
// .then((response) => {
//     // Response is a message ID string.
//     console.log('Successfully sent message:', response);
//     firebase.delete()
// })
// .catch((error) => {
//     console.log('Error sending message:', error);
// })



// const object = {articulo:123}
// const stringified = JSON.stringify(object)
// const signature = crypto.sign("sha256", Buffer.from(stringified), {
//  	key: privateKey,
//  	padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
//  })

//  const data =
// {
//     data: object,
//     signature: signature.toString("base64")
// };


// //axios.post("", data, { timeout: 30000 })
// axios({
//         method: 'post',
//         url: 'http://localhost:1337/api/proveedor/4/stock',
//         data: data
//     })
// .then(function(result){
//     console.log(result);
// })
// .catch(function(err){
//     console.log(err);
// })


// signature = "sQ/yOwinpYww2rg4H0kL1b8z7kCou5NX4TbeyXSuXaXF8UsCYnck0oNd0Y9BLrZoStY8KRS+3ETdFxdzlRo4Q+rnaBNgs3Wdqu8frHb9vQsJu9Sdd1GUHRxE8eWtcl/ohwSAPWbab7VSLtmdz3iAEajWbfmq29DQsxH3f4NFEJ4npi8jB4KeMVr5n5ZNhJuhoz1NhoBq8EBchodug8yP9SW7GFwBNDb+q9q299jDb73kZGGgGR2LeNgbBD8UHlbxMAQvI24DPqOom/5aAxRZxVc0AVMt1v4+IbCHtsGmX9cpZPfyyxUBrhzlzA09BfU42oInU3aiDlNhRiIdZFJoYg=="

// const isVerified = crypto.verify(
//     "sha256",
//     Buffer.from(stringified),
//     {
//         key: publicKey,
//         padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
//     },
//     Buffer.from(signature, "base64")
// );
// console.log(isVerified);
