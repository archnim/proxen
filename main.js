#! /usr/bin/env node

let fs = require("fs"),
	http = require("http"),
	https = require("https"),

	op = process.argv[2],
	opIsF = (op == "-f") || (op == "--file"),
	fname = from = process.argv[3],
	to = process.argv[4],
	cert = process.argv[5],
	key = process.argv[6]
;

function rp_serve(req, res, rpObj) {
	let dest,
		host = req.headers.host.split(":")[0];
	;

	if(opIsF) {
		if(typeof rpObj == "number")
			dest = parseInt(to);
		else {
			if(rpObj[host])
				dest = rpObj[host];
			else if(rpObj["#default"])
				dest = rpObj["#default"];
			else {
				res.writeHead(404);
				res.end();
				return;
			}
		}
	}
	else dest = to;

	try {
		let options = {
				hostname: "127.0.0.1",
				port: dest,
				path: req.url,
				method: req.method,
				headers: req.headers
			},
			backReq = http.request(options, backRes => {
				res.writeHead(
					backRes.statusCode,
					backRes.statusMessage,
					backRes.headers
				);
				backRes.on("data", chunk => res.write(chunk));
				backRes.on("end", chunk => res.end(chunk));
			})
		;
		backReq.on("error", err => {
			console.error("An error occurred when serving :");
			console.error(options);
			console.error("Error message: ");
			console.error(err.message);
		});
		backReq.end();
	}
	catch(err) {
		console.error("An error occurred when serving :");
		console.error(options);
		console.error("Error message: ");
		console.error(err.message);
	}
}

function rprox(rpPort, rpObj) {
	if(rpPort){
		rpPort = parseInt(rpPort);
		if(isNaN(rpPort)) {
			console.error(
				`In reverse-proxy section, wrong input port: "${rpPort}" ! ` +
				"Number expected."
			);
			process.exit();
		}
		if(rpPort < 0) {
			console.error(
				`In reverse-proxy section, wrong input port: "${rpPort}" ! ` +
				"Port number must be a positive number."
			);
			process.exit();
		}
		if(rpPort > 65535) {
			console.error(
				`In reverse-proxy section, wrong input port: "${rpPort}" ! ` +
				"Port number must be smaller that 65536."
			);
			process.exit();
		}
		if(typeof rpObj != "object") {
			console.error(`In reverse-proxy section, wrong value for port ${rpPort} !`);
			process.exit();
		}
		for(let hst in rpObj) {
			if(typeof rpObj[hst] != "number") {
				console.error(
					`In reverse-proxy section, for input port ${rpPort}, ` +
					`wrong destnation port supplied for host "${hst}. "` +
					"Number expected."
				);
				process.exit();
			}
			if(rpObj[hst] < 0) {
				console.error(
					`In reverse-proxy section, for input port ${rpPort}, ` +
					`wrong destnation port supplied for host "${hst}. "` +
					"Port number must be a positive number."
				);
				process.exit();
			}
			if(rpObj[hst] > 65535) {
				console.error(
					`In reverse-proxy section, for input port ${rpPort}, ` +
					`wrong destnation port supplied for host "${hst}. "` +
					"Port number must be smaller that 65536."
				);
				process.exit();
			}
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
				console.error(`No cert file supplied when reverse-proxying from port ${rpPort || from} !`);
				process.exit();
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
			process.exit();
		});
	}
	catch(err) {
		console.error(`An error occurred when reverse-proxying from port ${rpPort || from}:`);
		console.error(err.message);
		process.exit();
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
		process.exit();
	}

	for (let rp in fdata.rprox) {
		rprox(rp, fdata.rprox[rp]);
	}
}
else if(op == "rprox") {
	if(!from)
		console.error("No input port specified !");
	else if(isNaN(parseInt(from)))
		console.error(`Wrong input port: "${from}". Number Expected.`);
	else if(!to)
		console.error("No output port specified !");
	else if(isNaN(parseInt(to)))
		console.error(`Wrong output port: "${from}". Number Expected.`);
	else {
		from = parseInt(from);
		if(from < 0) {
			console.error(
				`Wrong input port: "${from}". ` +
				"Port number must be a positive number."
			);
			process.exit();
		}
		if(from > 65535) {
			console.error(
				`Wrong input port: "${from}". ` +
				"Port number must be smaller than 65536."
			);
			process.exit();
		}

		to = parseInt(to);
		if(to < 0) {
			console.error(
				`Wrong output port: "${from}". ` +
				"Port number must be a positive number."
			);
			process.exit();
		}
		if(to > 65535) {
			console.error(
				`Wrong output port: "${from}". ` +
				"Port number must be smaller than 65536."
			);
			process.exit();
		}

		rprox();
		console.log(`Reverse-proxying form port: ${from} to port: ${to}...`);
	}
}
else {
	console.error("Wrong parameter set !");
}
