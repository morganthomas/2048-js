var express = require('express');

var app = express();
app.use(express.static(__dirname + '/public'));

var server = app.listen(3001, function() {
  console.log('Express server listening on port ' + server.address().port);
})
