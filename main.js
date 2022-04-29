#! /usr/bin/env node

let fs = require("fs"),

  { rprox } = require("./rprox"),
  red = require("./red"),

  op = process.argv[2],
  opIsF = (op == "-f") || (op == "--file"),
  fname = from = process.argv[3],
  to = process.argv[4]
;

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
  for (let rp in fdata.rprox)
    rprox(rp, fdata.rprox[rp]);

  if(fdata.red && (typeof fdata.red != "object")) {
    console.error("Wrong value supplied for the redirection section. Expected an object.");
    process.exit();
  }
  for (let rd in fdata.red)
    red(rd, fdata.red[rd]);
}
else if(op == "rprox") {
  if(!from)
    console.error("No input port specified !");
  else if(!to)
    console.error("No output port specified !");
  else {
    from = parseInt(from);
    if(isNaN(from)) {
      console.error(`Wrong input port: "${from}". Number Expected.`);
      process.exit();
    }
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
    if(isNaN(to)) {
      console.error(`Wrong output port: "${to}". Number Expected.`);
      process.exit();
    }
    if(to < 0) {
      console.error(
        `Wrong output port: "${to}". ` +
        "Port number must be a positive number."
      );
      process.exit();
    }
    if(to > 65535) {
      console.error(
        `Wrong output port: "${to}". ` +
        "Port number must be smaller than 65536."
      );
      process.exit();
    }

    rprox();
  }
}
else if(op == "red") {
  if(!from)
    console.error("No input specified !");
  else if(!to)
    console.error("No destination specified !");
  else
    red(from, to);
}
else if(op == "-h" || op == "--help" || op == "help") {
  console.log("Proxen Version 3.1.2");
  console.log("Copyright (c) 2021-2022 archnim");
  console.log("Under MIT license");
  console.log("");
  console.log("https://github.com/archnim/proxen");
  console.log("https://npmjs.com/package/proxen");
  console.log("");
  console.log("A dead simple, yet powerful HTTP toolset.");
  console.log("");
  console.log("There are two ways to use proxen:");
  console.log("");
  console.log("");
  console.log("- The simple way is to type `proxen <subcommand> <params>`. Each subcommand corresponds to one feature of the program.");
  console.log("");
  console.log("Example 1:");
  console.log("proxen rprox 80 3000");
  console.log("");
  console.log("Example 2:");
  console.log("proxen rprox 443 3000 /path/to/fullchain.pem /path/to/privkey.pem");
  console.log("");
  console.log("");
  console.log("- The other way is to use a config file. You can name that file however you want. It is a Json file.");
  console.log("");
  console.log("Example 1:");
  console.log("proxen -f /path/to/config.json");
  console.log("");
  console.log("Example 2:");
  console.log("proxen --file /path/to/config.json");
  console.log("");
  console.log("");
  console.log("The advantage of using the config file, is that you can exploit all the available features, in one call. And you can call each feature several time in the file.");
  console.log("");
  console.log("To know how to write a config file for proxen, read this documentation:");
  console.log("https://www.npmjs.com/package/proxen#readme");
}
else if(op == '-v' || op == "--version" || op == "version") {
  console.log("Proxen Version 3.1.2");
  console.log("Copyright (c) 2021-2022 archnim (https://github.com/archnim)");
  console.log("Under MIT license");
}
else {
  console.error("Wrong parameter set !");
}
