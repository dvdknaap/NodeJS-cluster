#!/usr/bin/env node
var fs  			= require('fs'),
	domainFile  	= 'domains.js',
	fileContent 	= fs.readFileSync(domainFile).toString(),
	domains 		= JSON.parse(fileContent === '' ? {} : fileContent),
	checkInterval 	= 60*5,
	nextCheck 		= Math.round(+new Date()/1000)+checkInterval
;

/*,
	domains = {
	'hefnerubuntubox.nl' : {
      target: 'http://localhost:9001'
	},
	'hefnerubuntubox2.nl' : {
      target: 'http://localhost:9002'
	}
};
*/

if (process.env._ !== undefined) {
	var program		= require('commander');

	program
		.version('0.0.1')
  		.usage('Type ./cluster.js -h for help')
		.option('-a, --add', 'Add domain usage: domain.ext port')
		.option('-r, --remove', 'Remove domain usage domain.ext')
		.option('-s, --show', 'Show domains')
		.parse(process.argv)
	 ;

	if (program.add) {

		var domainName = (process.argv[3] !== undefined ? process.argv[3] : false);
		var domainPort = (process.argv[4] !== undefined ? process.argv[4] : false);

		console.log(domainName, 'domainName');
		console.log(domainPort, 'domainPort');

		if (domainName && domainPort ) {
			if ( domains[domainName] !== undefined) {
				console.log('This domain name already exists');
			} else {
				console.log('Add domain');

				domains[domainName] = {
					'target': 'http://localhost:'+domainPort
				};

				fs.writeFileSync(domainFile, JSON.stringify(domains));
				console.log(domainName+' has been added');
			}
		} else {
			console.log('couldnt found domainName or port, check your params')
		}

	} else if (program.remove) {

		var domainName = (process.argv[3] !== undefined ? process.argv[3] : false);

		if (domainName && domains[domainName] !== undefined ) {
			delete domains[domainName];

			fs.writeFileSync(domainFile, JSON.stringify(domains));

			console.log(domainName+' has been removed');
		} else {
			console.log('Domain couldnt be found');
		}
	} else if (program.show) {
		for (var domainI in domains) {
			console.log(domainI, domains[domainI]);
		}
	} else {
		console.log('Type ./cluster.js -h for help')
	}

	return;
}


var cluster   	= require('cluster'),
	workers   	= require('./modules/workers').init(cluster),
	http 		= require('http'),
	httpPort  	= 80,
	httpProxy 	= require('http-proxy'),
	url 		= require('url')
;

if (cluster.isMaster) {

	workers.startWorkers();

	Object.keys(cluster.workers).forEach(function(id) {
		cluster.workers[id].on('message', function (data) {
			var msg = JSON.parse(data);

			if (msg.cmd !== undefined ) {
			    console.log(msg.cmd+':', msg.msg);
			}
		});
	});

	console.log('HTTP proxy listening on port', httpPort);
} else if (cluster.isWorker) {
	console.log('I am worker #' + cluster.worker.id);

	workers.proccesSend({ 
		cmd: 'workerStarted', 
		msg: 'worker '+cluster.worker.id+' has been started' 
	});

	var proxy = httpProxy.createProxyServer({
		target:	{
			protocol: 'http'
		}
	});

	//
	// Listen for the `error` event on `proxy`.
	proxy.on('error', function (err, req, res) {
		console.error(err, 'err');

		res.writeHead(500, {
			'Content-Type': 'text/plain'
		});

		res.end('Something went wrong. And we are reporting a custom error message.');
	});

	http.createServer(function(req, res) {

		var host = req.headers.host.replace('www.', '');

		console.log(nextCheck, 'nextCheck');
		console.log(Math.round(+new Date()/1000), 'now');

		//Check if we need to update already
		if ((nextCheck-Math.round(+new Date()/1000)) <= 0 ) {
			fileContent = fs.readFileSync(domainFile).toString();
			domains 	= JSON.parse(fileContent === '' ? {} : fileContent);
			nextCheck 	= Math.round(+new Date()/1000)+checkInterval
		}

		if (domains[host] !== undefined ) {
		    proxy.web(req, res, domains[host]);
		} else {
			res.writeHead(500, {
				'Content-Type': 'text/plain'
			});

			res.end('Domain wasnt found.');
		}

	}).listen(80);

}