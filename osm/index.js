const request = require('request');

let osmURL = 'http://www.openstreetmap.org';
let osmAuth = {};
const version = '0.1.0'

function overpass(query, callback) {
  post('http://overpass-api.de/api/interpreter', query, function(data) {
    callback(data);
  });
}

function createChangeset(comment, callback) {
  if (!comment) throw new Error('No comment specified');

  let changeset = '<osm>' +
    '<changeset>' +
      '<tag k="created_by" v="OSM Microtasks ' + version + '"/>' +
      '<tag k="comment" v="' + comment + '"/>' +
    '</changeset>' +
  '</osm>';

  put(osmURL + '/api/0.6/changeset/create', changeset, function(data) {
    callback(data);
  });
}

function closeChangeset(id) {
  put(osmURL + '/api/0.6/changeset/' + id + '/close');
}

function getElement(element, id, callback) {
  get(osmURL + '/api/0.6/' + element + '/' + id, function(data) {
    callback(data);
  });
}

function updateElement(element, id, body, callback) {
  put(osmURL + '/api/0.6/' + element + '/' + id, body, function(data) {
    callback(data);
  });
}

//module specific request functions
function get(url, callback) {
  request.get({
    auth: osmAuth,
    url: url
  }, function(err, response, body) {
    if (response.statusCode == 200) {
      if (callback) callback(body);
    } else {
      console.log(err);
    }
  });
}

function put(url, data, callback) {
  request.put({
    auth: osmAuth,
    url: url,
    body: data || ''
  }, function(err, response, body) {
    if (response.statusCode == 200) {
      if (callback) callback(body);
    } else {
      console.log(err);
    }
  });
}

function post(url, data, callback) {
  request.post({
    url: url,
    body: data
  }, function(err, response, body) {
    if (response.statusCode == 200) {
      callback(body);
    } else {
      console.log(err);
    }
  });
}

//export the module
module.exports = function(auth, url) {
  if (!auth) throw new Error('No authentication provided');
  osmAuth = auth;

  if (url) osmURL = url;

  this.overpass = overpass;

  this.createChangeset = createChangeset;
  this.closeChangeset = closeChangeset;

  this.getElement = getElement;
  this.updateElement = updateElement;
};
