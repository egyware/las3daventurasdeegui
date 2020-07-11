<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Las 3D Aventuras de Egui - Stock</title>
    <link rel="stylesheet" href="https://bootswatch.com/4/lux/bootstrap.min.css">    
    <script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
</head>
<body>
    <div class="container" p-4>                
        ${d.proveedor.favicon != null?`<img class="img-fluid" src="${d.proveedor.favicon}"/>`:''}
        <h2 id="proveedor" style="display: inline-block; margin-left:0.5rem; margin-top:0.5rem; margin-bottom: 0px;">${d.proveedor.empresa}</h2>
        <p id="descripcion">${d.proveedor.descripcion}</p>
        <table class="table" id="stock">
                <thead>
                    <tr>
                        <td>Producto</td>
                        <td>Marca</td>
                        <td>Stock</td>
                        <td>Valor</td>                        
                        <td></td>
                    </tr>
                </thead>
                <tbody>
                    ${d.stock.map(articulo =>  `<tr>
                                 <td>${articulo.Nombre}</td>
                                 <td>${articulo.Marca}</td>
                                 <td>${articulo.Stock}</td>
                                 <td>${articulo.Precio}</td>
                                 <td><a href="${articulo.Link}">Ver Producto</a></td>
                             </tr>`).join('')}
                </tbody>
        </table>
        <div class="row">
            <p>Sigueme en instagram <a href="https://www.instagram.com/las3daventurasdeegui/">@las3daventurasdeegui</a></p>
        </div>        
    </div>  
</body>
</html>
