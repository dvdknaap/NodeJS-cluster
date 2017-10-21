#!/usr/bin/env node
var fs            = require('fs');
var domainFile    = 'domains.json';
var fileContent   = fs.readFileSync(domainFile).toString();
var domains       = JSON.parse(fileContent === '' ? {} : fileContent);
var checkInterval = 60*5;
var nextCheck     = Math.round(+new Date()/1000)+checkInterval;
var colors        = require('colors');

var cluster   = require('cluster');
var workers   = require('./modules/workers').init(cluster);
var http      = require('http');
var httpPort  = 80;
var httpProxy = require('http-proxy');

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	info: 'green',
	data: 'grey',
	help: 'cyan',
	warn: 'yellow',
	debug: 'blue',
	error: 'red'
});

if (cluster.isMaster) {

	workers.startWorkers();

	Object.keys(cluster.workers).forEach(function(id) {
		cluster.workers[id].on('message', function (data) {
			var msg = JSON.parse(data);

			if (msg.cmd !== undefined ) {
			    console.log('%s: %s'.info, msg.cmd, msg.msg);
			}
		});
	});

	console.log('HTTP proxy listening on port %s'.input, httpPort);
} else if (cluster.isWorker) {
	console.log('I am worker # %s'.input, cluster.worker.id);

	workers.proccesSend({ 
		cmd: 'workerStarted', 
		msg: 'worker '+cluster.worker.id+' has been started' 
	});

	var proxy = httpProxy.createProxyServer({
		target:	{
			protocol: 'http'
		}
	});

	// Listen for the `error` event on `proxy`.
	proxy.on('error', function (err, req, res) {
		console.error(err, 'err'.error);

		res.writeHead(500, {
			'Content-Type': 'text/plain'
		});

		res.end('Something went wrong. And we are reporting a custom error message.');
	});

	http.createServer(function(req, res) {
		var requestedUrl = req.headers.host;
		var domainName  = requestedUrl/* .replace('www', '')*/;

		if (domains[domainName] === undefined ) {
			requestedUrl = requestedUrl.split('.');
			domainName = requestedUrl[requestedUrl.length-2]+'.'+requestedUrl[requestedUrl.length-1];
		}

		//Check if we need to update already
		if ((nextCheck-Math.round(+new Date()/1000)) <= 0 ) {
			fileContent = fs.readFileSync(domainFile).toString();
			domains 	= JSON.parse(fileContent === '' ? {} : fileContent);
			nextCheck 	= Math.round(+new Date()/1000)+checkInterval
		}

		if (domains[domainName] !== undefined ) {
		    proxy.web(req, res, domains[domainName]);
		} else {
			res.writeHead(500, {
				'Content-Type': 'text/plain'
			});

			res.end('Domain wasnt found.');
		}

	}).on('upgrade', function (req, socket, head) {
		var requestedUrl = req.headers.host.split('.');
		var domainName  = requestedUrl/* .replace('www', '')*/;

		if (domains[domainName] === undefined ) {
			domainName = requestedUrl[requestedUrl.length-2]+'.'+requestedUrl[requestedUrl.length-1];
		}
		
		console.log(domainName, 'domainName');
		proxy.ws(req, socket, head);
	}).listen(80);

}
