#! /usr/bin/env node
let httpProxy = require('http-proxy');

httpProxy.createProxyServer({
    target:`http://localhost:${process.argv[2]}`
}).listen(process.argv[3]);

console.log(`Proxying form port: ${process.argv[2]} to port: ${process.argv[3]}...`);
