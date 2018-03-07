const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const Mustache = require('mustache');
const osmAPI = require('../../../osm/index.js');
const xml2js = require('xml2js');

const builder = new xml2js.Builder();
const parser = new xml2js.Parser();

const osm = new osmAPI({
  key: 'sGSxWmOF7JYttUCO41YoQD2VJNqBlTjcjETAOmrW',
  secret: 'cqpLFpQtEigD46EiAmaXnJqCaafNaEuz5Ow7l8ba'
});

let tagToSearch = 'phone';
const changesetComment = 'Corrected phone number to be in international format (E.164)';

$(document).ready(function() {
  $('#login-modal').modal({
    dismissible: false
  });
  if (!osm.authenticated()) {
    $('#login-modal').modal('open');
  }

  //Set listeners
  $('#login-button').click(function() {
    osm.authenticate(function() {
      Materialize.toast("Logged in successfully!", 6000);
      $('#login-modal').modal('close');
    })
  });
  $('#logout').click(function() {
    osm.logout();
    $('#elements').empty();
    $('#login-modal').modal('open');
    Materialize.toast("Logged out successfully!", 6000);
  });
  $('#upload-immediately').click(function() {
    uploadImmediately();
  });

  $('#country').change(function() {
    $('#states').hide();

    if (hasStates($(this).val())) {
      //Show the option to select a state of the selected country
      $('#elements').empty();
      $('#states').show();
      $('.states[data-country="' + $(this).val() + '"]').parent().show();
      $('.states[data-country="' + $(this).val() + '"]').material_select();
    } else {
      //A country was selected
      query(buildQuery(2, $(this).val()), $(this).val());
    }
  });

  $('.states').change(function() {
    query(buildQuery(4, $(this).val()), $(this).attr('data-country'));
  });

  init();
});

//Get the URL params and use them to e.g. show the data on the map
function init() {
  const url = new URL(window.location.href);

  const country = url.searchParams.get('country');

  if (country) {
    $('#country').val(country);
  }
}

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
  $('#elements').empty();
  $('.progress').show();
  $('#elements').show();

  osm.overpass(query, function(data) {
    $('.progress').fadeOut();

    let numberOfElements = 0;
    let elements = JSON.parse(data).elements;

    for (i = 0; i < elements.length; i++) {
      appendElement(elements[i].id, elements[i].tags[tagToSearch], elements[i].tags.name, elements[i].type, countryCode);
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

function appendElement(id, phone, name, element, countryCode) {
  let template = $('#element-template').html();
  Mustache.parse(template);
  let rendered = '';

  try {
    rendered = Mustache.render(template, {
      id: id,
      phone: phone,
      valid: true,
      new_phone: phoneUtil.format(phoneUtil.parse(phone, countryCode), PNF.INTERNATIONAL),
      element: element,
      comment: changesetComment,
      name: name
    });
  } catch (err) {
    console.log(id);
    console.log(phone);
    console.log(err.message);
    rendered = Mustache.render(template, {
      id: id,
      phone: phone,
      valid: false,
      confidence: '0%',
      element: element,
      comment: changesetComment,
      name: name
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