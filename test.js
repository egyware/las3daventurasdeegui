const Q     = require('q');
const axios = require('axios');
const crypto = require('crypto');
const fs   = require('fs');
const firebase   = require('./firebase.js')

let message = {
    notification: {
        title: "Hola Mundo",
        body: "Pruebaaaaa"
    },
    webpush: {
        fcm_options: {
            link: 'https://las3daventurasdeegui.cl'
        }
    },
    tokens: ['cB75Pjoflc581im1Jr0CFD:APA91bEX6cu367cyMr6XL7rwBy5gPBBrJty6AY8soFiuSELrmsXElhsegAE50kKVtBZP4czOZZaMJBxgk8_cY-wK8Rqj1UAkkI7bpgrmGpPQzoFIVdiW8kYCF3asAhBBFI9DdpnvSvRj']
}

firebase.messaging().sendMulticast(message)
.then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
    firebase.delete()
})
.catch((error) => {
    console.log('Error sending message:', error);
})


// let publicKey    = fs.readFileSync('public.key', { encoding:'utf8', flag:'r'});
// let privateKey   = fs.readFileSync('private.key', { encoding:'utf8', flag:'r'});

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
