virtualhost
===========

Make your HTTP server hostname-aware **very simply**.

You define the handler for each server name, and that will return the final handler to be passed to your HTTP server.

Works fine with Express.

Installation
------------

`npm install virtualhost`

Usage
-----

```javascript
var virtualhost = require('virtualhost');
var server = http.createServer(virtualhost(servers, catchAll));
```

* `servers` is a hash of server's configuration, each one having following options:
  * `pattern` can be a string (hostnames will simply be compared for equality), or a regular expression (you could use `/^hello\.(fr|com)$/i` for example to use this handler for `hello.fr` and `hello.com`, or `/\.domain.tld$/` to match all subdomains of `domain.tld`). Think about anchors (`^` and `$`) when using regular expression as pattern.
  * `handler` is a `function (req, res)`. Request matching pattern will simply be forwarded to this handler.
  * `with_port` will include the port in the comparison. Default comparison ignores it, which means `pattern: "domain.tld" will match `domain.tld:8080` and `domain.tld:3000` the same way. If you enable this option, you **have to** include port in your pattern.
* `catchAll` is the default handler used when no server matched hostname. It's not mandatory, and defaults to a simple 404.

### Shorter usage

`servers` can also be a simple hash of the form `pattern: handler`.

For example:

```javascript
virtualhost({
  "one.mydomain.tld": function (req, res) {…},
  "two.mydomain.tld": function (req, res) {…}
});
```

is strictly equivalent to

```javascript
virtualhost({
  "one.mydomain.tld": {
    pattern: "one.mydomain.tld",
    handler: function (req, res) {…}
  },
  "two.mydomain.tld": {
    pattern: "two.mydomain.tld",
    handler: function (req, res) {…}
  }
});
```

Of course you can mix both syntax.

### Additional sugar

As a bonus, the `Request` object will be enhanced with an additional attribute `virtualhost`. You can use it in your handlers to identify context:

* `req.virtualhost.hostname` is the hostname without port
* `req.virtualhost.port` is the port
* `req.virtualhost.match` depends of the matching result
  * `false` if no pattern was matched
  * `true` if a string-pattern was matched
  * an array if the matched pattern was a `RegExp`. `match` is then the result of `String#match()`, which means you can access capturing groups. If your pattern was `/mydomain\.(fr|com)/` then in your handler you'll be able to access `req.virtualhost.match[1]` which will contain `"fr"` or `"com"`.

Sample usage
------------

```javascript
// Example of standard handler
// This one will simply write "handler1" at "sub.domain.tld/*"
var handler1 = function (req, res) { res.end('handler1') };

// Example of Express 3.x app
// Good guy Express now simply returns standard handler, which makes this directly usable in virtualhost :)
// This one will write "handler2 (www.)" at "www.domain.tld/" and "handler2 (undefined)" at "domain.tld/"
var handler2 = express().get('/', function (req, res) { res.end('handler2 (' + req.virtualhost.match[1] + ')' });

// Example of virtualhost configuration
var apps = {
  // Shortcut hostname→handler
  sub.domain.tld: handler1,
  // Full config with RegExp pattern
  express: { pattern: /^(www\.)?domain\.tld$/, handler: handler2 }
};

http.createServer(virtualhost(apps)).listen();
```
