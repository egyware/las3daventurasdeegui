//centralizaré acá todo el tema de los mensajes para simplificar el codigo y usar lazy load
const admin = require("firebase-admin");

let serviceAccount = null;
let app = null;
let messaging = null;

function initialize()
{
    if(serviceAccount == null)
    {
        serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS || __dirname +'/las3daventurasdeegui-firebase-adminsdk-4w365-aae9a791e7.json');
    }
    if(app == null)
    {        
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://las3daventurasdeegui.firebaseio.com"
        });    
    }
}

module.exports = {
    messaging: function() {
        initialize();
        if(messaging == null)
        {
            messaging = admin.messaging();
        }
        return messaging;
    },
    delete: function ()
    {
        if(app != null)
        {
            app.delete()
        }
    }

};
