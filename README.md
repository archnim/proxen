# proxen
## A dead simple, yet powerful HTTP toolset
### Features: `proxy`, `reverse proxy`, `redirection`, `remote download`, `static file server`, `in-browser file explorer`

## To install proxen:
```sh
npm i -g proxen
```

## Notice ⚠️
**Starting from version three, proxen breaks retro-compatibility with versions 2.x.y and lower !**
I will do all my best to never break it again.

## Usage
There are two ways to use proxen:
- The simple way is to type `proxen <subcommand> <options>`. Each subcommand corresponds to one feature of the program.

- The other way is to use a config file. You can name that file however you want. It is a Json file. Here is how to use it: `proxen -f <filename>` or `proxen --file <filename>`

The advantage of using the config file, is that you can exploit all the available features, in one call. And you can call each feature several time in the file.


### proxen as a reverse proxy
This feature allows you to forward all requests from an input port, to an output port. So no more need for NGNX in simple cases ! The input must be free, so that proxen will listen on it. You can also ask proxen to secure its server, by passing paths to a key and a cert file.

#### Simple method:
- HTTP without ssl or tls
```sh
proxen rprox <input port> <output port>
```

- Secured HTTP
```sh
proxen rprox <input port> <output port> <cert file path> <key file path>
```

#### With config file:
Add the field "rprox" to the root object of the file.

- Example 1:
```json
{
	"rprox": {
		"<input port 1>": "<output port 1>",
		"<input port 2>": "<output port 2>",
		"<input port 3>": "<output port 3>"
	}
}
```

- Example 2:
```json
{
	"rprox": {
		"<input port 1>": {
			"key": "<path to key 1>",
			"cert": "<path to cert 1>"
			"output": "<output port 1>"
		},
		"<input port 2>": {
			"key": "<path to key 2>",
			"cert": "<path to cert 2>"
			"output": "<output port 2>"
		},
		"<input port 3>": {
			"key": "<path to key 3>",
			"cert": "<path to cert 3>"
			"output": "<output port 3>"
		}
	}
}
```

- Example 3:
```json
{
	"rprox": {
		"<input port 1>": {
			"<address 1>": "<output port 1>",  // For each IP address or domain name used to access the
			"<address 2>": "<output port 2>",  // input port, we can specify a different output port
			"<address 3>": "<output port 3>"
			"default": "<default output port>" // We can also add a default output port (optional)
		},
		"<input port 2>": {
			"<address 1>": "<output port 1>",
			"<address 2>": "<output port 2>",
			"<address 3>": "<output port 3>"
			"default": "<default output port>"
		},
		"<input port 3>": {
			"<address 1>": "<output port 1>",
			"<address 2>": "<output port 2>",
			"<address 3>": "<output port 3>"
			"default": "<default output port>"
		}
	}
}
```

- Example 4:
```json
{
	"rprox": {
		"<input port 1>": {
			"key": "<path to key 1>", // You certificate files must cover all the provided domains !
			"cert": "<path to cert 1>",
			"hosts": {
				"<address 1>": "<output port 1>",
				"<address 2>": "<output port 2>",
				"<address 3>": "<output port 3>"
				"default": "<default output port>"
			}
		},
		"<input port 2>": {
			"key": "<path to key 2>",
			"cert": "<path to cert 2>",
			"hosts": {
				"<address 1>": "<output port 1>",
				"<address 2>": "<output port 2>",
				"<address 3>": "<output port 3>"
				"default": "<default output port>"
			}
		},
		"<input port 3>": {
			"key": "<path to key 3>",
			"cert": "<path to cert 3>",
			"hosts": {
				"<address 1>": "<output port 1>",
				"<address 2>": "<output port 2>",
				"<address 3>": "<output port 3>"
				"default": "<default output port>"
			}
		}
	}
}
```

- Example 5 (Mix previous cases together)
```json
{
	"rprox": {
		"<input port 1>": "<output port>",
		"<input port 2>": {
			"key": "<path to key>",
			"cert": "<path to cert>"
			"output": "<output port>"
		},
		"<input port 3>": {
			"<address 1>": "<output port 1>",
			"<address 2>": "<output port 2>",
			"<address 3>": "<output port 3>"
			"default": "<default output port>"
		},
		"<input port 4>": {
			"key": "<path to key>",
			"cert": "<path to cert>",
			"hosts": {
				"<address 1>": "<output port 1>",
				"<address 2>": "<output port 2>",
				"<address 3>": "<output port 3>"
				"default": "<default output port>"
			}
		}
	}
}
```


### proxen as a redirection server
This feature will allow you to explicitly redirect clients to another port or server

*Not yet implemented.*
Will be available in version 3.1.0
Expect release date: *May 25 2022*


### proxen as a proxy
This feature will allow you to access any resource on the web, using your server as a proxy

*Not yet implemented.*
Will be available in version 3.2.0
Expect release date: *June 15 2022*


### proxen as a download server
This feature will allow you to download any resource on your server, until you are ready to download it on your local machine. It can be very useful when the resource will not remain available for a long time, but you can't immediately download it because of a poor internet connection, or lack of disk space on your local machine

*Not yet implemented.*
Will be available in version 3.3.0
Expect release date: *June 30 2022*


### proxen as a static file server
This feature will allow you to statically serve files from any directory

*Not yet implemented.*
Will be available in version 4.0.0
Expect release date: *September 15 2022*


### proxen as an in-browser file explorer
This feature will allow you to serve an in-browser file explorer on your server or your local machine. Authorized people in your network will be able to upload, download, copy, paste, etc...

*Not yet implemented.*
Will be available in version 5.0.0
Expect release date: *December 31 2022*


## You can encourage me:
- Follow [my GitHub account](https://github.com/archnim)
- Star [proxen's repository](https://github.com/archnim/proxen), and send pull requests
- Suggest features and point out bugs, through [issues](https://github.com/archnim/proxen/issues)


## Get in touch
- [My Twitter account](https://twitter.com/archnim)
- [My Telegram account](https://t.me/archnim)


By @archnim. Full-stack web developer. Open-source enthusiast. [Nim-lang](https://nimlang.org) promoter.