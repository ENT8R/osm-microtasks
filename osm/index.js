/* globals osmAuth*/

const auth = osmAuth({
  oauth_consumer_key: 'sGSxWmOF7JYttUCO41YoQD2VJNqBlTjcjETAOmrW', // eslint-disable-line camelcase
  oauth_secret: 'cqpLFpQtEigD46EiAmaXnJqCaafNaEuz5Ow7l8ba', // eslint-disable-line camelcase
  auto: true,
  landing: '../osm/land.html'
});

const version = '0.2.0';

function overpass(query, callback) {
  const http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      if (callback) {
        callback(http.responseText);
      }
    }
  };
  http.open('POST', 'https://overpass-api.de/api/interpreter', true);
  http.send(query);
}

function createChangeset(comment, callback) {
  if (!comment) {
    throw new Error('No comment specified');
  }

  const changeset = `
  <osm>
    <changeset>
      <tag k="created_by" v="OSM Microtasks ${version}"/>
      <tag k="comment" v="${comment}"/>
    </changeset>
  </osm>`;

  put('/api/0.6/changeset/create', changeset, (data) => {
    // returns the id of the changeset
    callback(data);
  });
}

function closeChangeset(id) {
  put(`/api/0.6/changeset/${id}/close`);
}

function getElement(id, callback) {
  get(`/api/0.6/${id}`, (data) => {
    callback(new XMLSerializer().serializeToString(data));
  });
}

function updateElement(id, body, callback) {
  put(`/api/0.6/${id}`, body, (data) => {
    // returns the new version of the element
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
  }, (err, res) => {
    if (!err) {
      if (callback) {
        callback(res);
      }
    }
  });
}

function put(url, data, callback) {
  auth.xhr({
    method: 'PUT',
    path: url,
    options: {
      header: {
        'Content-Type': 'text/xml'
      }
    },
    content: data || ''
  }, (err, res) => {
    if (!err) {
      if (callback) {
        callback(res);
      }
    }
  });
}

function post(url, data, callback) { // eslint-disable-line no-unused-vars
  auth.xhr({
    method: 'POST',
    path: url,
    options: {
      header: {
        'Content-Type': 'text/xml'
      }
    },
    content: data
  }, (err, res) => {
    if (!err) {
      if (callback) {
        callback(new XMLSerializer().serializeToString(res));
      }
    }
  });
}

// export the module
window.osmapi = {
  overpass,

  createChangeset,
  closeChangeset,

  getElement,
  updateElement,

  logout,
  authenticated,
  authenticate
};
