#! /usr/bin/env node

let fs = require("fs"),
	httpProxy = require('http-proxy'),

	input = process.argv[2],
	output = process.argv[3],
	host = process.argv[4],
	cert = process.argv[5],
	key = process.argv[6]
;

(function prox() {
	try {
		let proxy;
		if(cert)
			proxy = httpProxy.createServer({
				target: {
					host, port: input
				},
				ssl: {
					key: fs.readFileSync(key, 'utf8'),
					cert: fs.readFileSync(cert, 'utf8')
				}
			}).listen(output);
		else
			proxy = httpProxy.createProxyServer({
				target:`http://localhost:${input}`
			}).listen(output);

		proxy.on('error', prox);
	}
	catch(err) {
		console.log(err.message);
		//prox();
	}
})();

console.log(`Proxying form port: ${process.argv[2]} to port: ${process.argv[3]}...`);
