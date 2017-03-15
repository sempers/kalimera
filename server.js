var _path = require('path');
var _url = require('url');
var express = require('express');
var fn = require('./fn');
var proxy = require('express-http-proxy');

var app = express();

app.use(express.static(_path.resolve(__dirname, 'client')));

app.use('/fp', proxy('www.google.com', {
        decorateRequest: function (proxyReq, originalReq) {
            var path = proxyReq.path.substring(1);
            var url = _url.parse(path);
            proxyReq.hostname = url.protocol + "//" + url.hostname;
            proxyReq.path = url.pathname;
            return proxyReq;
        }
    }
));

app.get("/src/:fn", fn.src);

app.get("/href/:fn", fn.href);

app.get("/fs/:fn", fn.filestate);

app.get("/ls", fn.ls);

app.get("/clear", fn.clear);


app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
    console.log("Kalimera server running");
});