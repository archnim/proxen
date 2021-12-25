#! /usr/bin/env node

let fs = require("fs"),
	http = require("http"),
	https = require("https"),

	input = process.argv[2],
	output = process.argv[3],
	cert = process.argv[4],
	key = process.argv[5]
;

function serve (client_req, client_res) {
	var options = {
		hostname: "localhost",
		port: input,
		path: client_req.url,
		method: client_req.method,
		headers: client_req.headers
	};
	var req = http.request(options, function(res) {
		client_res.writeHead(res.statusCode, res.headers);
		res.on('data', function (chunk) {
			client_res.write(chunk);
		});
		res.on('end', function () {
			client_res.end();
		});
	});
	req.end();
}

(function prox() {
	try {
		let proxy;
		if(cert) {
			proxy = https.createServer(
				{
					key: fs.readFileSync(key, 'utf8'),
					cert: fs.readFileSync(cert, 'utf8')
				}, serve
			);
			
			proxy.listen(output);
		}
		else {
			proxy = http.createServer(serve);

			proxy.listen(output);
		}

		proxy.on("error", (err) => {
			console.err(err.message);
		});
	}
	catch(err) {
		console.log(err.message);
		prox();
	}
})();

console.log(`Proxying form port: ${process.argv[2]} to port: ${process.argv[3]}...`);
