const AppConfig = {
  ServersPath: 'servers.json',
  TimeShift: 15 * 60 * 1000, /* Default: 15 * 60 * 1000 (15min) */
  ListenPort: {
    WebServer: 80,
  }
};

const https   = require('https')
      http    = require('http'),
      fs      = require('fs'),
      express = require('express'),
      app     = express(),
      server  = require('http').Server(app),
      io = require('socket.io')(server);


const Suricate = {

  nbServers: 0,
  servers: {},

  resetServerList: () => {
    Suricate.servers = {};
  },

  RequestListeners: {
    Default: (headers, body) => {
      Suricate.servers[headers.host] = {
        header: headers,
        body: body
      };
      
      var rest = Suricate.nbServers;
      for (var key in Suricate.servers) {
        rest -= 1;
      }

      if (rest === 0) {
        io.sockets.emit('response', Suricate.servers);
      }
    },

    RequestOk: (headers, result) => {
      Suricate.RequestListeners.Default(headers, result);
    },

    ResultNotFound: (headers) => {
      Suricate.RequestListeners.Default(headers);
    },

    RequestError: (headers) => {
      Suricate.RequestListeners.Default(headers);

      console.error('Error on ' + headers.host);
      console.error(headers);
    }
  },

  getHTTPRequest: (options, isHttps) => {
    var requestProtocol = isHttps ? https : http;

    if (typeof options == 'string') {
      options = {
        host: options,
        path: '/'
      };
    }

    options.headers = {
      'user-agent': 'Mozilla/5.0'
    };

    try {
      requestProtocol.get(options, (res) => {
        const { headers, statusCode } = res;

        headers.host = options.host;
        headers.url = (isHttps ? 'https' : 'http') + '://' + options.host + options.path;
        headers.statusCode = statusCode;

        // Page Read & Not Found
        if (statusCode === 200 || statusCode === 404) {
          let data = '';

          res.on('data', (chunk) => { data += chunk });
          res.on('end', () => {
            if (statusCode === 200) {
              Suricate.RequestListeners.RequestOk(headers, data);
            }
            else if (statusCode === 404) {
              Suricate.RequestListeners.ResultNotFound(headers);
            }
          });
        }

        // Redirection
        else if (statusCode === 301 || statusCode === 302) {
          var location = headers.location.split('/'),
              locationStr = '';

          for (var i=1; i<location.length; i++) {
            locationStr += '/' + location[i];
          }

          Suricate.getHTTPRequest({
            host: options.host,
            path: locationStr
          }, isHttps);
        }

        else {
          Suricate.RequestListeners.RequestError(statusCode, headers);
        }
      });
    } catch (e) {
      console.log(e);
    }
  },

  watch: (serversPath, timeShift) => {
    let readAndGetServers = (path) => {
      fs.readFile(path, 'utf8', (err, file) => {
        Suricate.resetServerList();
        
        if (err) {
          console.error(err);
        }
        else {
          var servers = JSON.parse(file);

          Suricate.nbServers = 0;

          if (servers.HTTPS) {
            Suricate.nbServers += servers.HTTPS.length;
            for (var i=0; i<servers.HTTPS.length; i++) {
              Suricate.getHTTPRequest(servers.HTTPS[i], true);
            }
          }

          if (servers.HTTP) {
            Suricate.nbServers += servers.HTTP.length;
            for (var i=0; i<servers.HTTP.length; i++) {
              Suricate.getHTTPRequest(servers.HTTP[i]);
            }
          }
        }
      });
    };

    if (timeShift) {
      setTimeout(() => {
        Suricate.watch(serversPath, timeShift);
      }, timeShift);
      
      readAndGetServers(serversPath);
    } else {
      readAndGetServers(serversPath);
    }
  }
};



// Config Web Server
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/resources'));
server.listen(AppConfig.ListenPort.WebServer, (d) => {
  console.log('WebServer binded on ' + AppConfig.ListenPort.WebServer);
});


// Look For Each Server
Suricate.watch(AppConfig.ServersPath, AppConfig.TimeShift);


// Config Web Route
app.get('/', (req, res) => {
  res.render('index', {
    servers: Suricate.servers
  });
});