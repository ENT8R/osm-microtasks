let osmURL = 'https://www.openstreetmap.org';
let osmAuth = {};
const version = '0.1.0'

function overpass(query, callback) {
  post('https://overpass-api.de/api/interpreter', query, function(data) {
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
const http = new XMLHttpRequest();

function get(url, callback) {
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      if (callback) callback(http.responseText);
    }
  };
  http.open("GET", url, true);
  http.setRequestHeader("Authorization", "Basic " + window.btoa(osmAuth.user + ":" + osmAuth.pass));
  http.send();
}

function put(url, data, callback) {
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      if (callback) callback(http.responseText);
    }
  };
  http.open("PUT", url, true);
  http.setRequestHeader("Authorization", "Basic " + window.btoa(osmAuth.user + ":" + osmAuth.pass));
  http.send(data || '');
}

function post(url, data, callback) {
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      if (callback) callback(http.responseText);
    }
  };
  http.open("POST", url, true);
  http.send(data);
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
