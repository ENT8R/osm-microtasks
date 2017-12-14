const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const Mustache = require('mustache');
const osmtogeojson = require('osmtogeojson');
const osmAPI = require('../../osm/index.js');
const xml2js = require('xml2js');

const builder = new xml2js.Builder();
const parser = new xml2js.Parser();

//const osmTestURL = 'https://master.apis.dev.openstreetmap.org';
let osm;

$(document).ready(function() {
  $('select').material_select();

  $('#login-modal').modal({
    dismissible: false
  });
  $('#login-modal').modal('open');

  $('#login-form').validate({
    validClass: 'valid',
    errorClass: 'invalid',
    errorPlacement: function(error, element) {
      element.next('label').attr('data-error', error.contents().text());
    },
    submitHandler: function(form, e) {
      e.preventDefault();
      osm = new osmAPI({
        user: $('#user').val(),
        pass: $('#password').val()
      });
      $('#login-modal').modal('close');
    }
  });

  //Set listeners
  //TODO: Implement OAuth
  $('#login-button').click(function() {
    $('#login-form').submit();
  });
  $('#view-on-map').click(function() {
    viewOnMap();
  });
  $('#upload-immediately').click(function() {
    uploadImmediately();
  });

  $('#area').change(function() {
    query($('#area').val());
  });
});

let geoJSON = '';

let tagToSearch = 'phone';
const changesetComment = 'Corrected phone number to be in international format (E.164)';

function query(areaCode) {
  $('#elements').empty();
  $('.progress').show();

  const query = '[out:json][timeout:3600];' +
    'area["ISO3166-2"="' + areaCode + '"][admin_level=4]->.a;' +
    '(' +
    'node(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
    'way(area.a)["' + tagToSearch + '"]["' + tagToSearch + '"!~"^[+][1-9]|110|112"];' +
    ');' +
    'out;';

  osm.overpass(query, function(data) {
    $('.progress').fadeOut();

    let numberOfElements = 0;
    let elements = JSON.parse(data).elements;
    geoJSON = osmtogeojson(JSON.parse(data));

    for (i = 0; i < elements.length; i++) {
      appendElement(elements[i].id, elements[i].tags[tagToSearch], elements[i].type);
      numberOfElements++;
    }

    $('.invalid-tooltip').tooltip({
      delay: 50,
      position: 'bottom',
      tooltip: 'Invalid number (needs to be fixed with an external editor)'
    });

    if (numberOfElements == 0) {
      $('#elements').append("Congratulations! Everything seems to be fixed here!");
    }
    console.log('Number of found elements: ' + numberOfElements);
  });
}

function appendElement(id, phone, element) {
  let template = $('#element-template').html();
  Mustache.parse(template);
  let rendered = '';

  try {
    rendered = Mustache.render(template, {
      id: id,
      phone: phone,
      valid: true,
      new_phone: phoneUtil.format(phoneUtil.parse(phone, 'DE'), PNF.INTERNATIONAL),
      element: element
    });
  } catch (err) {
    console.log(id);
    console.log(phone);
    console.log(err.message);
    rendered = Mustache.render(template, {
      id: id,
      phone: phone,
      valid: false,
      element: element
    });
  }

  $('#elements').append(rendered);
}

function upload(id, phone, element) {
  osm.getElement(element, id, function(data) {
    console.log(data);

    parser.parseString(data, function(err, result) {
      console.log(result);

      for (i = 0; i < result.osm[element][0].tag.length; i++) {
        if (result.osm[element][0].tag[i].$.k == tagToSearch) {
          result.osm[element][0].tag[i].$.v = phone;
        }
      }

      osm.createChangeset(changesetComment, function(changesetID) {
        //Set new id of changeset
        result.osm[element][0].$.changeset = changesetID;

        const xml = builder.buildObject(result);
        console.log(xml);

        osm.updateElement(element, id, xml, function(data) {
          console.log(data);
          osm.closeChangeset(changesetID);
          Materialize.toast("Uploaded successfully", 6000);
        });
      });
    });
  });
}
window.upload = upload;

//TODO: Implement method to display all elements on a map
function viewOnMap() {
  $('#elements').hide();
  $('#map').show();

  const map = L.map('map').setView([52, -10], 5);
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.geoJSON(geoJSON, {
    onEachFeature: function(feature, layer) {
      if (feature.properties && feature.properties.type && feature.properties.tags[tagToSearch]) {
        layer.bindPopup('<a href="http://www.openstreetmap.org?' + feature.properties.type + '=' + feature.properties.tags[tagToSearch] + '" target="_blank">Open on OSM</a>');
      }
    }
  }).addTo(map);
}
