#!/usr/bin/env node
var fs            = require('fs');
var domainFile    = 'domains.json';
var fileContent   = fs.readFileSync(domainFile).toString();
var domains       = JSON.parse(fileContent === '' ? {} : fileContent);
var colors        = require('colors');

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

function checkDomainPorts(port) {
	if (port === undefined) {
		throw new Error('No port found');
	}

	for (var domainI in domains) {
		if (domains[domainI].target.indexOf(':'+port) !== -1) {
			return true;
		}
	}

	return false;
}
var program = require('commander');

program
	.version('1.0.5')
	.usage('Type ./domainManager.js -h for help')
	.option('-a, --add', 'Add domain usage: domain.ext port')
	.option('-r, --remove', 'Remove domain usage domain.ext')
	.option('-s, --show', 'Show domains')
	.parse(process.argv)
 ;

if (program.add) {

	var domainName = (process.argv[3] !== undefined ? process.argv[3] : false);
	var domainPort = (process.argv[4] !== undefined ? process.argv[4] : false);

	if (domainName && domainPort ) {
		if ( domains[domainName] !== undefined) {
			console.warn('This domain name already exists'.warn);
		} else if (checkDomainPorts(domainPort)) {
			console.warn('This port name is already in use'.warn);
		} else {
			console.info('Add domain'.info);

			domains[domainName] = {
				'target': 'http://localhost:'+domainPort,
				'ws': true
			};

			fs.writeFileSync(domainFile, JSON.stringify(domains));
			console.info('%s has been added'.info, domainName);
		}
	} else {
		console.error('couldnt found domainName or port, check your params'.error)
	}

} else if (program.remove) {

	var domainName = (process.argv[3] !== undefined ? process.argv[3] : false);

	if (domainName && domains[domainName] !== undefined ) {
		delete domains[domainName];

		fs.writeFileSync(domainFile, JSON.stringify(domains));

		console.info('%s has been removed'.input, domainName);
	} else {
		console.error('Domain couldnt be found'.error);
	}
} else if (program.show) {
	var numDomains = 0;
	for (var domainI in domains) {
		++numDomains;
		console.log(domainI, domains[domainI]);
	}

	if (numDomains === 0) {
		console.log('There are no domain yet');
	} else {
		console.log('We\'ve got %s domains').debug, numDomains);
	}
} else {
	program.help();
}