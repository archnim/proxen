let fs = require("fs"),
  http = require("http"),
  https = require("https"),
  url = require("url"),

  cert = process.argv[5],
  key = process.argv[6]
;

function redirect(req, res, protocol, source, dest) {
  let domain = req.headers.host.split(":")[0],
    port = source,
    url = new URL(`${protocol}://${domain}:${port}${req.url}`),
    path = url.pathname,
    qs = url.search,
    goto
  ;

  function trans(dest) {
    if(typeof dest == "number")
      return `${protocol}://${domain}:${dest}${path}${qs}`;
    else if(dest == "http")
      return `http://${domain}${path}${qs}`;
    else if(dest == "https")
      return `https://${domain}${path}${qs}`;
    else if(typeof dest == "string") {
      dest = dest.replaceAll("{protocol}", protocol);
      dest = dest.replaceAll("{domain}", domain);
      dest = dest.replaceAll("{port}", port);
      dest = dest.replaceAll("{path}", path);
      dest = dest.replaceAll("{query}", qs);
      return dest;
    }
  }

  if(typeof dest == "object") {}
  else
    goto = trans(dest);

  res.writeHead(301, "Moved Permanently", {
    location: goto
  });
  res.end();
}

function http_red(source, dest) {
  try {
    let red = http.createServer(
      (req, res) => redirect(req, res, "http", source, dest)
    );
    red.listen(source);

    if(dest.dest)
      dest = dest.dest;
    else if(dest.dests)
      dest = dest.dests;

    if(typeof dest == "object") {
      console.log(`Redirecting from port: ${source} to destinations:`);
      console.log(dest);
      console.log("...");
    }
    else
      console.log(`Redirecting from port: ${source} to destination: ${dest}...`);

    red.on("error", err => {
      console.error(`An error occurred when redirecting from source port ${source}:`);
      console.error(err.message);
      process.exit();
    });
  }
  catch(err) {
    console.error(`An error occurred when redirecting from source port ${source}:`);
    console.error(err.message);
    process.exit();
  }
}

function https_red(source, dest) {
  try {
    let lcert = cert || dest.cert,
      lkey = key || dest.key,
      cf, kf
    ;

    if(!lkey) {
      console.error(`No key file supplied when redirecting from source port ${source} !`);
      process.exit();
    }

    try {
      cf = fs.readFileSync(lcert, "utf-8");
    }
    catch(err) {
      console.error(`Failed to read cert file when redirecting from source port ${source}:`);
      console.error(err);
      process.exit();
    }

    try {
      kf = fs.readFileSync(lkey, "utf-8");
    }
    catch(err) {
      console.error(`Failed to read key file when redirecting from source port ${source}:`);
      console.error(err);
      process.exit();
    }

    let red = https.createServer(
      {
        cert: cf,
        key: kf
      },
      (req, res) => redirect(req, res, "https", source, dest)
    );
    red.listen(source);

    if(dest.dest)
      dest = dest.dest;
    else if(dest.dests)
      dest = dest.dests;

    if(typeof dest == "object") {
      console.log(`Redirecting from port: ${source} to destinations:`);
      console.log(dest);
      console.log("...");
    }
    else
      console.log(`Redirecting from port: ${source} to destination: ${dest}...`);

    red.on("error", err => {
      console.error(`An error occurred when redirecting from source port ${source}:`);
      console.error(err.message);
      process.exit();
    });
  }
  catch(err) {
    console.error(`An error occurred when redirecting from source port ${source}:`);
    console.error(err.message);
    process.exit();
  }
}

module.exports = function(rdPort, rdObj) {
  rdPort = parseInt(rdPort);
  if(isNaN(rdPort)) {
    console.error(
      `Error while redirecting: wrong source port: "${rdPort}" ! ` +
      "Number expected."
    );
    process.exit();
  }
  if(rdPort < 0) {
    console.error(
      `Error while redirecting: wrong source port: "${rdPort}" ! ` +
      "Port number must be a positive number."
    );
    process.exit();
  }
  if(rdPort > 65_535) {
    console.error(
      `Error while redirecting: wrong source port: "${rdPort}" ! ` +
      "Port number must be a smaller than 65536."
    );
    process.exit();
  }

  if(typeof rdObj == "string") {
    let temp = parseInt(rdObj);
    if(isNaN(temp)) {
      if(cert)
        https_red(rdPort, rdObj);
      else
        http_red(rdPort, rdObj);
    }
    else
      rdObj = temp;
  }

  if(typeof rdObj == "number") {
    rdObj = Math.floor(rdObj);
    if(rdObj < 0) {
      console.error(
        `Error while redirecting: wrong destination port: "${rdPort}" ! ` +
        "Port number must be a positive number."
      );
      process.exit();
    }
    if(rdObj > 65_535) {
      console.error(
        `Error while redirecting: wrong destination port: "${rdPort}" ! ` +
        "Port number must be smaller than 65536."
      );
      process.exit();
    }
    if(cert)
      https_red(rdPort, rdObj);
    else
      http_red(rdPort, rdObj);
  }

  if(typeof rdObj == "object") {
    if(rdObj.dest) {}
    else if(rdObj.dests) {
      //
    }
    else {
      //
    }
  }
}
