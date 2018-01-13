const osmAuth = require('osm-auth');

let auth;

const version = '0.1.0'

function overpass(query, callback) {
  const http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      if (callback) callback(http.responseText);
    }
  };
  http.open("POST", 'https://overpass-api.de/api/interpreter', true);
  http.send(query);
}

function createChangeset(comment, callback) {
  if (!comment) throw new Error('No comment specified');

  let changeset = '<osm>' +
    '<changeset>' +
    '<tag k="created_by" v="OSM Microtasks ' + version + '"/>' +
    '<tag k="comment" v="' + comment + '"/>' +
    '</changeset>' +
    '</osm>';

  put('/api/0.6/changeset/create', changeset, function(data) {
    callback(data);
  });
}

function closeChangeset(id) {
  put('/api/0.6/changeset/' + id + '/close');
}

function getElement(element, id, callback) {
  get('/api/0.6/' + element + '/' + id, function(data) {
    callback(data);
  });
}

function updateElement(element, id, body, callback) {
  put('/api/0.6/' + element + '/' + id, body, function(data) {
    callback(data);
  });
}

function logout() {
  auth.logout();
}

function authenticated() {
  return auth.authenticated();
}

function authenticate(callback) {
  auth.authenticate(callback);
}


function get(url, callback) {
  auth.xhr({
    method: 'GET',
    path: url
  }, function(err, res) {
    if (!err) {
      if (callback) callback(new XMLSerializer().serializeToString(res));
    }
  });
}

function put(url, data, callback) {
  console.log(authenticated());
  auth.xhr({
    method: 'PUT',
    path: url,
    content: data || ''
  }, function(err, res) {
    console.log(err);
    console.log(res);
    if (!err) {
      if (callback) callback(new XMLSerializer().serializeToString(res));
    }
  });
}

function post(url, data, callback) {
  auth.xhr({
    method: 'POST',
    path: url,
    content: data
  }, function(err, res) {
    if (!err) {
      if (callback) callback(new XMLSerializer().serializeToString(res));
    }
  });
}

//export the module
module.exports = function(config) {
  if (config) {
    auth = osmAuth({
      oauth_consumer_key: 'sGSxWmOF7JYttUCO41YoQD2VJNqBlTjcjETAOmrW',
      oauth_secret: 'cqpLFpQtEigD46EiAmaXnJqCaafNaEuz5Ow7l8ba',
      auto: true,
      singlepage: true
    });
  }

  this.overpass = overpass;

  this.createChangeset = createChangeset;
  this.closeChangeset = closeChangeset;

  this.getElement = getElement;
  this.updateElement = updateElement;

  this.logout = logout;
  this.authenticated = authenticated;
  this.authenticate = authenticate;
};
