var panels = undefined,
    lastPanel = undefined;

var numberPretty = function(number) {
  return (number < 10 ? '0' : '') + number;
};

var updateDate = function() {
  var date = new Date(),
      dateStr = '';

  dateStr += numberPretty(date.getDate()) + '/';
  dateStr += numberPretty(date.getMonth() + 1) + '/';
  dateStr += date.getFullYear() + ' - ';
  dateStr += numberPretty(date.getHours()) + 'h';
  dateStr += numberPretty(date.getMinutes()) + ':';
  dateStr += numberPretty(date.getSeconds());

  document.getElementById('date').innerHTML = dateStr;
};

window.onload = function() {

  var resetAllPanels = function() {
    var panels = document.getElementById('servers').getElementsByTagName('li');
    
    for (var i=0; i<panels.length; i++) {
      var classSplitted = panels[i].children[0].getAttribute('class').split(' '),
          classStr = '';

      for (var k=0; k<classSplitted.length; k++) {
        if (classSplitted[k] != 'active') {
          classStr += classSplitted[k];
        }
      }

      panels[i].children[0].setAttribute('class', classStr);
    }
  };

  var updatePanels = function() {
    var panels = document.getElementById('servers').getElementsByTagName('li');

    for (var i=0; i<panels.length; i++) {
      panels[i].children[0].addEventListener('click', function(e) {
        e.preventDefault();
        resetAllPanels();

        if (this != lastPanel) {
          this.className += ' active';
          lastPanel = this;
        } else {
          lastPanel = undefined;
        }
      });
    }
  };


  updateDate();
  updatePanels();


  const socket = io();

  var resetAllServers = function() {
    document.getElementById('servers').innerHTML = '';
    panels = undefined;
  }

  var HTMLtoString = function(html) {
    return html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  };

  var addServer = function(server) {
    var li = document.createElement('li'),
        div = document.createElement('div'),
        host = document.createElement('span'),
        status = document.createElement('span'),
        header = document.createElement('pre');

    div.className = 'error';
    host.className = 'url';
    status.className = 'status';
    header.className = 'header';

    host.innerHTML = server.header.host;
    status.innerHTML = server.header.statusCode;
    header.innerHTML = JSON.stringify(server.header, undefined, 4);

    div.appendChild(host);
    div.appendChild(status);
    div.appendChild(header);

    if (server.header.statusCode == 200 || server.header.statusCode == 404) {
      var src = document.createElement('code');

      src.innerHTML = HTMLtoString(server.body);

      div.appendChild(src);

      if (server.header.statusCode == 200) {
        div.className = 'valid';
      }
    }

    li.appendChild(div);
    document.getElementById('servers').appendChild(li);
  }

  socket.on('response', (servers) => {
    resetAllServers();
    updateDate();
    
    for (var key in servers) {
      addServer(servers[key]);
    }

    panels = document.getElementById('servers').getElementsByTagName('li');
    updatePanels();
  });

};