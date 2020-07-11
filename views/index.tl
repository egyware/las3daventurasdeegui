<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Las 3D Aventuras de Egui - Lista de proveedores</title>
    <link rel="stylesheet" href="https://bootswatch.com/4/lux/bootstrap.min.css">    
    <script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script defer src="https://www.gstatic.com/firebasejs/7.15.5/firebase-app.js"></script>
    <script defer src="https://www.gstatic.com/firebasejs/7.15.5/firebase-analytics.js"></script>
    <script defer src="https://www.gstatic.com/firebasejs/7.15.5/firebase-messaging.js"></script>
    <script defer src="./init-firebase.js"></script>
</head>
<body>    
    <div class="container" p-4>        
        <h2>Tiendas</h2>
        <div class="row float-right">
            <span id="subscripcion">
                <svg width="2em" height="2em" viewBox="0 0 16 16" class="bi bi-bell" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z"/>
                    <path fill-rule="evenodd" d="M8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                </svg>
            </span>
          </svg>
        </div>
        <div class="row"><a href="agregarProveedor.html">Agregar Tienda</a></div>        
        <div class="row" id="tiendas">            
            ${d.proveedores.map((proveedor =>
                `<div class="col-12 col-md-4 p-2">
                    <div class="card" style="height:285px;max-height:285px">                            
                    <div class="card-header">
                    <h5 class="card-title text-truncate">
                        ${proveedor.favicon != null ? `<img class="img-fluid" style="max-height:1.75rem" src="${proveedor.favicon}" />`: `` }
                        <a href="${proveedor.website}">${proveedor.empresa}</a>
                    </h5>
                    </div>
                    <div class="card-body text-left" style="height:180px;overflow-y:auto">                                                                              
                        <p>${proveedor.descripcion}</p>                                
                    </div>                            
                    ${proveedor.scrapedProductos > 0 ? `<div class="card-footer"><a href="/proveedor/${proveedor.id}">Ver Stock</a></div>`: ``}
                </div>
            </div>`)).join('')}
        </div>        
        <div class="row">
            <div class="col-12">
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
            <!-- Las 3D Aventuras de Egui -->
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-2372755844722301"
                 data-ad-slot="8234407261"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
            </div>
        </div>
        <div class="row">
            <p>Sigueme en instagram <a href="https://www.instagram.com/las3daventurasdeegui/">@las3daventurasdeegui</a></p>
        </div>        
    </div>
    <script defer> 
            function obtenerToken(){
                messaging.getToken().then((currentToken) => {
                    if (currentToken) {
                        $.ajax({
                            url: "/api/subcribirse",
                            method: 'POST',
                            data: {
                                token: currentToken
                            }
                        }).done(function() { 
                            console.log('Subscrito', currentToken);
                        })
                    } else {                       
                        console.log('No Instance ID token available. Request permission to generate one.');                
                    }
                }).catch((err) => {
                    console.log('An error occurred while retrieving token. ', err);                   
                });
            }                  
            function subscribirse()
            {
                Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {                                                
                        obtenerToken();
                        modificarCampana(permission);
                    } else {
                        console.log('Unable to get permission to notify.');
                    }                
                });
            }

            function modificarCampana(permiso){
                if(permiso == 'granted')
                {
                    $("#subscripcion > svg").html('<path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>');
                }else{
                    $("#subscripcion > svg").html('path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z"/><path fill-rule="evenodd" d="M8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>');
                }
            }

            modificarCampana(Notification.permission);
         
            // messaging.onMessage((payload) => {
            //     console.log('Message received. ', payload);                    
            // });
            

            $("#subscripcion").click(subscribirse);
    </script>    
</body>
</html>
