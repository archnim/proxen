const { Http2ServerRequest } = require("http2");

let fs = require("fs"),
  http = require("http"),
  https = require("https"),

  from = process.argv[3],
  to = process.argv[4],
  cert = process.argv[5],
  key = process.argv[6]
;

function rp_serve(req, res, dest) {
  let host = req.headers.host.split(":")[0];

  if(dest.output)
    dest = dest.output;
  else if(dest.hosts)
    dest = dest.hosts;

  if(typeof dest == "object") {
    if(dest[host])
      dest = dest[host];
    else if(dest["#default"])
      dest = dest["#default"];
    else {
      res.writeHead(404);
      res.end();
      return;
    }
  }

  try {
    let options = {
        hostname: "127.0.0.1",
        port: dest,
        path: req.url,
        method: req.method,
        headers: {...req.headers, host: "localhost"}
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

      res.writeHead(500);
      res.end();
    });
    req.on("data", chunk => backReq.write(chunk));
    req.on("end", () => backReq.end());
  }
  catch(err) {
    console.error("An error occurred when serving :");
    console.error(options);
    console.error("Error message: ");
    console.error(err.message);

    res.writeHead(500);
    res.end();
  }
}

function http_prox(source, dest) {
  try {
    rev_prox = http.createServer((req, res) => rp_serve(req, res, dest.output || dest.hosts || dest));
    rev_prox.listen(source);

    if(dest.output)
      dest = dest.output;
    else if(dest.hosts)
      dest = dest.hosts;
    if(typeof dest == "object") {
      console.log(`Reverse-proxying from port: ${source} to ports:`);
      console.log(dest);
      console.log("...");
    }
    else
      console.log(`Reverse-proxying from port: ${source} to port: ${dest}...`);

    rev_prox.on("error", err => {
      console.error(`An error occurred when reverse-proxying from source port ${source}:`);
      console.error(err.message);
      process.exit();
    });
  }
  catch(err) {
    console.error(`An error occurred when reverse-proxying from source port ${source}:`);
    console.error(err.message);
    process.exit();
  }
}

function https_prox(source, dest, lcert, lkey) {
  try {
    let rev_prox;

    if(! lcert) {
      console.error(`No cert file supplied when reverse-proxying from source port ${source} !`);
      process.exit();
    }
    let kf, cf;

    try {
      kf = fs.readFileSync(lkey, "utf-8");
    }
    catch(err) {
      console.error(`Failed to read key file when reverse-proxying from source port ${source}:`);
      console.error(err);
      process.exit();
    }

    try {
      cf = fs.readFileSync(lcert, "utf-8");
    }
    catch(err) {
      console.error(`Failed to read cert file when reverse-proxying from source port ${source}:`);
      console.error(err);
      process.exit();
    }

    rev_prox = https.createServer(
      {
        key: kf,
        cert: cf
      },
      (req, res) => rp_serve(req, res, dest)
    );
    rev_prox.listen(source);

    if(dest.output)
      dest = dest.output;
    else if(dest.hosts)
      dest = dest.hosts;

    if(typeof dest == "object") {
      console.log(`Reverse-proxying from ports: ${source} to ports:`);
      console.log(dest);
      console.log("...");
    }
    else
      console.log(`Reverse-proxying from port: ${source} to port: ${dest}...`);

    rev_prox.on("error", err => {
      console.error(`An error occurred when reverse-proxying from source port ${source}:`);
      console.error(err.message);
      process.exit();
    });
  }
  catch(err) {
    console.error(`An error occurred when reverse-proxying from source port ${source}:`);
    console.error(err.message);
    process.exit();
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
        "Port number must be smaller than 65536."
      );
      process.exit();
    }

    // When rprox value is a string
    if(typeof rpObj == "string") {
      rpObj = parseInt(rpObj);
      if(isNaN(rpObj)) {
        console.error(
          `In reverse-proxy section, wrong output port: "${rpObj}" ! ` +
          "Number expected."
        );
        process.exit();
      }
    }

    // When rprox value is a port number
    if(typeof rpObj == "number") {
      rpObj = Math.floor(rpObj);
      if(rpObj < 0) {
        console.error(
          `In reverse-proxy section, wrong output port: "${rpObj}" ! ` +
          "Port number must be a positive number."
        );
        process.exit();
      }
      if(rpObj > 65535) {
        console.error(
          `In reverse-proxy section, wrong output port: "${rpObj}" ! ` +
          "Port number must be smaller than 65536."
        );
        process.exit();
      }
      http_prox(rpPort, rpObj);
    }

    // When rprox value is an object
    else if(typeof rpObj == "object") {
      // When rprox value has an 'output' field (Unique destination)
      if(rpObj.output) {
        if(typeof rpObj.output == "string") {
          rpObj.output = parseInt(rpObj.output);
          if(isNaN(rpObj.output)) {
            console.error(
              `In reverse-proxy section, wrong output port: "${rpObj.output}" ! ` +
              "Number expected."
            );
            process.exit();
          }
        }

        if(typeof rpObj.output == "number") {
          rpObj.output = Math.floor(rpObj.output);
          if(rpObj.output < 0) {
            console.error(
              `In reverse-proxy section, wrong output port: "${rpObj.output}" ! ` +
              "Port number must be a positive number."
            );
            process.exit();
          }
          if(rpObj.output > 65535) {
            console.error(
              `In reverse-proxy section, wrong output port: "${rpObj.output}" ! ` +
              "Port number must be smaller than 65536."
            );
            process.exit();
          }
        }

        else {
          console.error(
            `In reverse-proxy section, wrong output port: "${rpObj.output}" ! ` +
            "Number expected."
          );
          process.exit();
        }

        if(rpObj.key)
          https_prox(rpPort, rpObj.output, rpObj.cert, rpObj.key);
        else
          http_prox(rpPort, rpObj.output);
      }

      // When rprox value has a 'hosts' fields (multiple destinations)
      else if(rpObj.hosts) {
        if(typeof rpObj.hosts != "object") {
          console.error(
            `In reverse-proxy section, wrong host list ! ` +
            "Object expected."
          );
          process.exit();
        }

        for(hst in rpObj.hosts) {
          if(typeof rpObj.hosts[hst] == "string") {
            rpObj.hosts[hst] = parseInt(rpObj.hosts[hst]);
            if(isNaN(rpObj.hosts[hst])) {
              console.error(
                `In reverse-proxy section, for input port ${rpPort}, ` +
                `wrong destination port supplied for host "${hst}. "` +
                "Number expected."
              );
              process.exit();
            }
          }

          if(typeof rpObj.hosts[hst] == "number") {
            rpObj.hosts[hst] = Math.floor(rpObj.hosts[hst]);
            if(rpObj.hosts[hst] < 0) {
              console.error(
                `In reverse-proxy section, for input port ${rpPort}, ` +
                `wrong destination port supplied for host "${hst}. "` +
                "Port number must be a positive number."
              );
              process.exit();
            }
            if(rpObj.hosts[hst] > 65535) {
              console.error(
                `In reverse-proxy section, for input port ${rpPort}, ` +
                `wrong destination port supplied for host "${hst}. "` +
                "Port number must be smaller than 65536."
              );
              process.exit();
            }
          }

          else {
            console.error(
              `In reverse-proxy section, for input port ${rpPort}, ` +
              `wrong destination port supplied for host "${hst}. "` +
              "Number expected."
            );
            process.exit();
          }
        }

        if(rpObj.key)
          https_prox(rpPort, rpObj, rpObj.cert, rpObj.key);
        else
          http_prox(rpPort, rpObj);
      }

      else {
        for(let hst in rpObj) {
          if(typeof rpObj[hst] == "string") {
            rpObj[hst] = parseInt(rpObj[hst]);
            if(isNaN(rpObj[hst])) {
              console.error(
                `In reverse-proxy section, for input port ${rpPort}, ` +
                `wrong destination port supplied for host "${hst}. "` +
                "Number expected."
              );
              process.exit();
            }
          }

          if(typeof rpObj[hst] == "number") {
            rpObj[hst] = Math.floor(rpObj[hst]);
            if(rpObj[hst] < 0) {
              console.error(
                `In reverse-proxy section, for input port ${rpPort}, ` +
                `wrong destination port supplied for host "${hst}. "` +
                "Port number must be a positive number."
              );
              process.exit();
            }
            if(rpObj[hst] > 65535) {
              console.error(
                `In reverse-proxy section, for input port ${rpPort}, ` +
                `wrong destination port supplied for host "${hst}. "` +
                "Port number must be smaller than 65536."
              );
              process.exit();
            }
          }

          else {
            console.error(
              `In reverse-proxy section, for input port ${rpPort}, ` +
              `wrong destination port supplied for host "${hst}. "` +
              "Number expected."
            );
            process.exit();
          }
        }
        http_prox(rpPort, rpObj);
      }
    }

    // When rprox value is unsupported
    else {
      console.error(`In reverse-proxy section, wrong value for port ${rpPort} !`);
      console.error("Visit https://www.npmjs.com/package/proxen#readme for documentation.");
      process.exit();
    }
  }
  else {
    if(key)
      https_prox(from, to, cert, key);
    else
      http_prox(from, to);
  }
}

module.exports = { rprox };
