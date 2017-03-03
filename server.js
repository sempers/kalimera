var path = require('path');
var express = require('express');
var fn = require('./fn');

var app = express();

app.use(express.static(path.resolve(__dirname, 'client')));

app.get("/src/:fn", fn.start);

app.get("/href/:fn", fn.sync);

app.get("/fs/:fn", fn.filestate);

app.get("/ls", fn.ls);

app.get("/clear", fn.clear);

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  console.log("Kalimera server running");
});