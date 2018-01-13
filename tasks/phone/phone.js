const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const Mustache = require('mustache');
const osmtogeojson = require('osmtogeojson');
const osmAPI = require('../../osm/index.js');

const copyNumber = new Clipboard('.copy-number');
copyNumber.on('success', function(e) {
  Materialize.toast("Copied number: " + e.text, 3000);
});
const copyNumberAndOpenEditor = new Clipboard('.copy-number-and-open');
copyNumberAndOpenEditor.on('success', function(e) {
  window.open($(e.trigger).attr("data-url"));
});

let osm = new osmAPI();
let geoJSON = '';
let map;

let tagToSearch = 'phone';
const changesetComment = 'Corrected phone number to be in international format (E.164)';

$(document).ready(function() {
  //Set listeners
  $('#upload-immediately').click(function() {
    uploadImmediately();
  });

  $('#country').change(function() {
    $('#states').hide();

    if (hasStates($(this).val())) {
      //Show the option to select a state of the selected country
      $('#states').show();
      $('.states[data-country="' + $(this).val() + '"]').parent().show();
    } else {
      //A country was selected
      query(buildQuery(2, $(this).val()), $(this).val());
    }
  });

  $('.states').change(function() {
    query(buildQuery(4, $(this).val()), $(this).attr('data-country'));
  });
});

function hasStates(country) {
  if (country == 'DE') {
    return true;
  } else {
    return false;
  }
}

function buildQuery(level, area) {
  const query = {
    country: '[out:json][timeout:3600];' +
      'area["ISO3166-1"="' + area + '"][admin_level=2]->.a;' +
      '(' +
      'node(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
      'way(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
      ');' +
      'out;',
    state: '[out:json][timeout:3600];' +
      'area["ISO3166-2"="' + area + '"][admin_level=4]->.a;' +
      '(' +
      'node(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
      'way(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
      ');' +
      'out;'
  };

  switch (level) {
    case 2:
      return query.country;
      break;
    case 4:
      return query.state;
      break;

  }
}

function query(query, countryCode) {
  $('.progress').show();

  osm.overpass(query, function(data) {
    $('.progress').fadeOut();

    let numberOfElements = 0;
    let elements = JSON.parse(data).elements;
    viewOnMap(osmtogeojson(JSON.parse(data)), countryCode);
  });
}

function viewOnMap(geoJSON, countryCode) {
  $('#map').show();

  if (!map) map = L.map('map').setView([0, 0], 3);

  map.eachLayer(function(layer) {
    map.removeLayer(layer);
  });

  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markers = L.markerClusterGroup();
  const geoJSONLayer = L.geoJSON(geoJSON, {
    onEachFeature: function(feature, layer) {
      if (feature.properties && feature.properties.id && feature.properties[tagToSearch]) {
        let phoneNumber = '';
        let validNumber = true;

        try {
          phoneNumber = phoneUtil.format(phoneUtil.parse(feature.properties[tagToSearch], countryCode), PNF.INTERNATIONAL);
        } catch (err) {
          phoneNumber = feature.properties[tagToSearch];
          validNumber = false;
        }

        layer.bindPopup(getMarkerText(feature.properties.id, feature.properties[tagToSearch], phoneNumber, validNumber), {
          maxWidth: 1000
        });
      }
    }
  });

  markers.addLayer(geoJSONLayer);
  map.addLayer(markers);
  map.fitBounds(markers.getBounds());
}

function getMarkerText(id, phone, newPhone, valid) {
  if (valid) {
    return '<h6>' + phone + ' -> ' + newPhone + '</h6>' +
      '<a href="http://www.openstreetmap.org/' + id + '" target="_blank">View on OpenStreetMap</a><br>' +
      '<a href="http://www.openstreetmap.org/edit?' + id.replace('/', '=') + '&comment=' + changesetComment +
      '" target="_blank">Open with editor</a><br>' +
      '<a href="#" class="copy-number" data-clipboard-text="' + newPhone + '">Copy new number to clipboard</a><br>' +
      '<a href="#" class="copy-number-and-open" data-clipboard-text="' + newPhone +
      '" data-url="http://www.openstreetmap.org/edit?' + id.replace('/', '=') + '&comment=' + changesetComment +
      '">Copy new number to clipboard and open editor</a>';
  } else {
    return '<h6>' + phone + '</h6><br>' +
      '<p>Number is not valid! Please fix it by hand!<i class="material-icons red-text invalid-tooltip">close</i></p><br>' +
      '<br><a href="http://www.openstreetmap.org/' + id +
      '" target="_blank">View on OpenStreetMap</a><br>' +
      '<a href="http://www.openstreetmap.org/edit?' + id.replace('/', '=') + '&comment=' + changesetComment +
      '" target="_blank">Open with editor</a>';
  }
}
