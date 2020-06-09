var express = require('express');
var app = express();

// respond with "hello world" when a GET request is made to the homepage
// app.get('/', function(req, res) {
//   res.send('hello world');
// });
app.use(express.static('public'));

const port = process.env.PORT || 1337;
app.listen(port, function() {
    console.log("Server running at http://localhost:%d", port);
 });
