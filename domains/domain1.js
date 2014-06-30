var http 	 = require('http'),
	httpPort = 9001
;

// Worker processes have a http server.
http.createServer(function(req, res) {
	res.writeHead(200);
	res.end('hello world domain1\n');
}).listen(httpPort, function () {

	console.log('Listening to port '+httpPort);
});

