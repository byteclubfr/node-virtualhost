var http = require('http');
var express = require('express');
var virtualhost = require('./virtualhost');

// Compatible with standard handler
var handler1 = function (req, res) {
  res.end('handler1');
};

// Compatible with express 3.x
var handler2 = express().get('/', function (req, res) {
  res.end('handler2 (' + req.virtualhost.match[1] + ')');
});

var apps = {
  "sub.domain.tld": handler1,
  "main": { pattern: /^(www\.)?domain\.tld$/, handler: handler2 }
};

http.createServer(virtualhost(apps)).listen(8080);
