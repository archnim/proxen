#! /usr/bin/env node
let fs = require("fs"),
    httpProxy = require('http-proxy'),

    input = process.argv[2],
    output = process.argv[3],
    cert = process.argv[4],
    key = process.argv[5]
;

if(cert)
    httpProxy.createServer({
        target: {
            host: 'localhost',
            port: input
        },
        ssl: {
            key: fs.readFileSync(key, 'utf8'),
            cert: fs.readFileSync(cert, 'utf8')
        }
    }).listen(output);
else
    httpProxy.createProxyServer({
        target:`http://localhost:${input}`
    }).listen(output);

console.log(`Proxying form port: ${process.argv[2]} to port: ${process.argv[3]}...`);
