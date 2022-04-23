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

function rp_serve(req, res, dest) {
  let host = req.headers.host.split(":")[0];

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

      res.writeHead(500);
      res.end();
    });
    backReq.end();
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
  rev_prox = http.createServer((req, res) => rp_serve(req, res, dest.output || dest.hosts || dest));
  rev_prox.listen(source);
}

function https_prox(source, dest, lkey, lcert) {
  try {
    let rev_prox;

    if(! lcert) {
      console.error(`No cert file supplied when reverse-proxying source port ${source} !`);
      process.exit();
    }
    let kf, cf;

    try {
      kf = fs.readFileSync(lkey, "utf-8");
    }
    catch(err) {
      console.error(`Failed to read key file when reverse-proxying source port ${source}:`);
      console.error(err);
      process.exit();
    }

    try {
      cf = fs.readFileSync(lcert, "utf-8");
    }
    catch(err) {
      console.error(`Failed to read cert file when reverse-proxying source port ${source}:`);
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

    rev_prox.on("error", err => {
      console.error(`An error occurred when reverse-proxying source port ${source}:`);
      console.error(err.message);
      process.exit();
    });
  }
  catch(err) {
    console.error(`An error occurred when reverse-proxying source port ${source}:`);
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
        "Port number must be smaller that 65536."
      );
      process.exit();
    }

    // When rprox value is a string
    if(typeof rpObj == String) {
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
    if(typeof rpObj == Number) {
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
          "Port number must be smaller that 65536."
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
              "Port number must be smaller that 65536."
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
          https_prox(rpPort, rpObj.output, rpObj.key, rpObj.cert);
        else
          http_prox(rpPort, rpObj.output);
      }

      // When rprox value has a 'hosts' fields (multiple destinations)
      if(rpObj.hosts) {
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
            rpObj.hosts[hst] = floor(rpObj.hosts[hst]);
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
                "Port number must be smaller that 65536."
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
            rpObj[hst] = floor(rpObj[hst]);
            if(rpObj[hst] < 0) {
              console.error(
                `In reverse-proxy section, for input port ${rpPort}, ` +
                `wrong destination port supplied for host "${hst}. "` +
                "Port number must be a positive number."
              );
              process.exit();
            }
            if(rpObj[hist] > 65535) {
              console.error(
                `In reverse-proxy section, for input port ${rpPort}, ` +
                `wrong destination port supplied for host "${hst}. "` +
                "Port number must be smaller that 65536."
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
          if(typeof rpObj[hst] != "number") {
            console.error(
              `In reverse-proxy section, for input port ${rpPort}, ` +
              `wrong destination port supplied for host "${hst}. "` +
              "Number expected."
            );
            process.exit();
          }
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
              "Port number must be smaller that 65536."
            );
            process.exit();
          }
        }
      }
    }

    // When rprox value is unsupported
    else {
      console.error(`In reverse-proxy section, wrong value for port ${rpPort} !`);
      console.error("Visit https://www.npmjs.com/package/proxen for documentation.");
      process.exit();
    }
  }
  else {
    if(key)
      https_prox(from, to, key, cert);
    else
      http_prox(from, to);
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
