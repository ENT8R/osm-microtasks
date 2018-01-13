const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const Mustache = require('mustache');
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
const map = L.map('map', {
  minZoom: 2,
  maxZoom: 22
}).setView([50, 10], 4);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  maxZoom: 22,
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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
      'node(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"~"-"];' +
      'way(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
      'way(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"~"-"];' +
      ');' +
      'out center;' +
      'out skel;',
    state: '[out:json][timeout:3600];' +
      'area["ISO3166-2"="' + area + '"][admin_level=4]->.a;' +
      '(' +
      'node(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
      'node(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"~"-"];' +
      'way(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
      'way(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"~"-"];' +
      ');' +
      'out center;' +
      'out skel;'
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
    viewOnMap(JSON.parse(data).elements, countryCode);
  });
}

function viewOnMap(elements, countryCode) {
  map.eachLayer(function(layer) {
    map.removeLayer(layer);
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 22,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markers = L.markerClusterGroup();

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    if (element.tags && element.tags[tagToSearch]) {
      let phoneNumber = '';
      const number = element.tags[tagToSearch];
      let validNumber = true;

      try {
        phoneNumber = phoneUtil.format(phoneUtil.parse(number, countryCode), PNF.INTERNATIONAL);
      } catch (err) {
        phoneNumber = number;
        validNumber = false;
      }

      const type = element.type;
      const id = type + '/' + element.id;
      let coordinates = [];

      if (element.lat && element.lon) {
        coordinates.push(element.lat);
        coordinates.push(element.lon);
      } else {
        coordinates.push(element.center.lat);
        coordinates.push(element.center.lon);
      }

      const marker = L.marker(coordinates)
        .bindPopup(getMarkerText(id, number, phoneNumber, validNumber));
      markers.addLayer(marker);
    }
  }
  map.addLayer(markers);
  map.fitBounds(markers.getBounds());
}

function getMarkerText(id, phone, newPhone, valid) {
  if (valid) {
    return '<h6>' + phone + ' -> ' + newPhone + '</h6>' +
      '<a href="http://www.openstreetmap.org/' + id + '" target="_blank">View on OpenStreetMap</a><br>' +
      '<a href="http://osm.org/edit?' + id.replace('/', '=') + '&comment=' + changesetComment +
      '" target="_blank">Open with editor</a><br>' +
      '<a href="#" class="copy-number" data-clipboard-text="' + newPhone + '">Copy new number to clipboard</a><br>' +
      '<a href="#" class="copy-number-and-open" data-clipboard-text="' + newPhone +
      '" data-url="http://osm.org/edit?editor=id&' + id.replace('/', '=') + '&comment=' + changesetComment +
      '">Copy new number to clipboard and open iD</a>';
  } else {
    return '<h6>' + phone + '</h6><br>' +
      '<p>Number is not valid! Please fix it by hand!<i class="material-icons red-text invalid-tooltip">close</i></p><br>' +
      '<br><a href="http://www.openstreetmap.org/' + id + '" target="_blank">View on OpenStreetMap</a><br>' +
      '<a href="http://osm.org/edit?' + id.replace('/', '=') + '&comment=' + changesetComment +
      '" target="_blank">Open with editor</a>';
  }
}
