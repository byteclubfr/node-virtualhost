
var url = require('url');

module.exports = handler;

function handler (servers, catchAll) {
  catchAll = catchAll || _catchAll;

  // Check catch-all
  if (typeof catchAll !== 'function') throw new Error('[virtualhost] Catch-all should be a valid callback');
  // Check servers configuration
  for (var server in servers) {
    var conf = servers[server];
    if (typeof conf === 'function') {
      // Direct function assignment
      servers[server] = { pattern: server, handler: conf };
    } else if (typeof conf === 'object') {
      // Check options
      if (typeof conf.handler !== 'function') throw new Error('[virtualhost] Invalid configuration for server "' + server + '": "handler" should be a valid callback');
      if (!conf.pattern || (typeof conf.pattern !== 'string' && !(conf.pattern instanceof RegExp))) throw new Error('[virtualhost] Invalid configuration for server"' + server + '": "pattern" should be a string or a RegExp');
    } else {
      // Invalid type
      throw new Error('[virtualhost] Invalid configuration for server "' + server + '": object or function expected');
    }
  }

  // Valid options, return meta-handler
  return function (req, res) {
    // Retrieve hostname
    var location = url.parse('http://' + req.headers.host);
    // Define "req.virtualhost" (can be used by user)
    req.virtualhost = {
      hostname: location.hostname || '',
      port:     location.port,
      match:    false
    };
    // Browser available handlers and find the first one matching hostname
    for (var server in servers) {
      req.virtualhost.match = matchHost(req.virtualhost, servers[server]);
      if (req.virtualhost.match) {
        req.virtualhost.name = server;
        return servers[server].handler.call(this, req, res);
      }
    }
    // None found, fallback to catch-all
    req.virtualhost.match = null;
    return catchAll.call(this, req, res);
  };
}

function matchHost (hostInfo, conf) {
  var pattern = conf.pattern;
  var host = hostInfo.hostname + (conf.with_port ? (':' + hostInfo.port) : '');
  if (conf.pattern instanceof RegExp) {
    console.log(host, conf.pattern, host.match(conf.pattern));
    return host.match(conf.pattern);
  } else {
    return host === conf.pattern;
  }
}

function _catchAll (req, res) {
  res.writeHead(404);
  res.end('Invalid host name');
}
