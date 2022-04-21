#! /usr/bin/env node

let fs = require("fs"),
	http = require("http"),
	https = require("https"),

	lg = console.log

	op = process.argv[2],
	opIsF = (op == "-f") || (op == "--file"),
	fname = from = process.argv[3],
	to = process.argv[4],
	cert = process.argv[5],
	key = process.argv[6]
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

function rp_serve(req, res, rpObj) {
	lg(rpObj);
}

function rprox(rpPort, rpObj) {
	if(rpPort){
		if(! /^\d+$/.test(rpPort)) {
			console.error(`In reverse-proxy section, wrong input port: "${rpPort}" !`);
			process.exit();
		}
		if(typeof rpObj != "object") {
			console.error(`In reverse-proxy section, wrong value for port ${rpPort} !`);
			process.exit();
		}
	}
	else rpObj = {}

	let lkey = rpObj.key || ((op == "rprox")? key : undefined),
		lcert = rpObj.cert || ((op == "rprox")? cert : undefined)
	;

	try {
		let rev_prox;

		if(lkey) {
			if(! lcert) {
				console.error("No cert file supplied !")
			}
			let kf, cf;

			try {
				kf = fs.readFileSync(lkey, "utf-8");
			}
			catch(err) {
				console.error(`Failed to read key file when reverse-proxying from port ${rpPort || from}:`);
				console.error(err);
				process.exit();
			}

			try {
				cf = fs.readFileSync(lcert, "utf-8");
			}
			catch(err) {
				console.error(`Failed to read cert file when reverse-proxying from port ${rpPort || from}:`);
				console.error(err);
				process.exit();
			}

			rev_prox = https.createServer(
				{
					key: kf,
					cert: cf
				},
				(req, res) => rp_serve(req, res, rpObj)
			);
		}
		else {
			rev_prox = http.createServer((req, res) => rp_serve(req, res, rpObj));
		}
		rev_prox.listen(rpPort || from);

		rev_prox.on("error", err => {
			console.error(`An error occurred when reverse-proxying from port ${rpPort || from}:`);
			console.error(err.message);
		});
	}
	catch(err) {
		console.error(`An error occurred when reverse-proxying from port ${rpPort || from}:`);
		console.error(err.message);
	}
}

if (!op) {
	console.error("No parameter passed")
}
else if(opIsF){
	if(!fname) {
		console.error("No filename supplied !");
		process.exit();
	}

	let fdata;
	try {
		fdata = fs.readFileSync(fname, "utf-8");
	}
	catch(err) {
		console.error("Failed to read config file:");
		console.error(err.message);
		process.exit();
	}

	try {
		fdata = JSON.parse(fdata);
	}
	catch(err) {
		console.error("Failed to parse config file !");
		process.exit();
	}

	if(fdata.rprox && (typeof fdata.rprox != "object")) {
		console.error("Wrong value supplied for the reverse-proxy section. Expected an object.");

	}

	for (let rp in fdata.rprox) {
		rprox(rp, fdata.rprox[rp]);
	}
}
else if(op == "rprox") {
	if(!from)
		console.error("No input port specified !");
	else if(! /^\d+$/.test(from))
		console.error("Wrong input port !");
	if(!to)
		console.error("No output port specified !");
	else if(! /^\d+$/.test(to))
		console.error("Wrong output port !");
	else {
		rprox();
		console.log(`Reverse-proxying form port: ${from} to port: ${to}...`);
	}
}
else {
	console.error("Wrong parameter set !");
}

