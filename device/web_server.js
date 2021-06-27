'use strict'

var http = require('http');

var express = require('express');
var serveIndex = require('serve-index');

var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

var http_server = http.createServer(app);
http_server.listen(80,'0.0.0.0');
