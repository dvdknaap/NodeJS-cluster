var os 		  	= require('os'),	
	numCPUs   	= os.cpus().length
;

function worker() {
	var workers  	= {},
		autoRestart = true,
		cluster		= false,
		ctx			= this
	;

	this.init = function(mainCluster) {
		cluster = mainCluster;
		return this;
	}

	this.startWorker = function() {
		if (!cluster) {
			throw new Error('No cluster found');
		}

		var worker = cluster.fork();

		worker.on('exit', function(worker, code, signal) {
			delete workers[worker.id];

			if (worker.suicide === true) {
				console.log('Oh, it was just suicide\' – no need to worry');
			} else if( signal ) {
				console.log('worker '+worker.id+' was killed by signal: '+signal);
			} else if( code !== 0 ) {
				console.log('worker '+worker.id+' exited with error code: '+code);
			} else {
				console.log('worker '+worker.id+' success!');
			}

		  	//Check if we may restart the worker
		  	if (autoRestart) {
		    	console.log('going to restart worker');
				ctx.startWorker();
		  	}
		});


		worker.on('disconnect', function(worker) {
			console.error('disconnect!');

		  	//Check if we may restart the worker
		  	if (autoRestart) {
		    	console.log('going to restart worker');
				ctx.startWorker();
		  	}
		});

		workers[worker.id] = worker;
	}

	this.startWorkers = function () {
		if (!cluster) {
			throw new Error('No cluster found');
		}
		
		console.log('Starting '+numCPUs+' workers');
		for(var i=0;i<numCPUs;i++) {
			this.startWorker();
		}
	}

	this.proccesSend = function (data) {
		data = JSON.stringify(data);
		return process.send(data);
	};
};

module.exports = (new worker());