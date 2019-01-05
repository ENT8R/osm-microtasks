/* globals Common */
/* globals libphonenumber */
/* globals L */

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

const map = L.map('map', {
  minZoom: 2,
  maxZoom: 22,
  zoomControl: false
}).setView([50, 10], 4);

layer();

function process(elements, countryCode) {
  layer();

  const markers = L.markerClusterGroup();

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    if (element.tags && element.tags[Common.TAG]) {
      let international;
      const old = element.tags[Common.TAG];
      let valid = true;

      try {
        international = phoneUtil.format(phoneUtil.parse(old, countryCode), libphonenumber.PhoneNumberFormat.INTERNATIONAL);
      } catch (err) {
        valid = false;
      }

      const id = `${element.type}/${element.id}`;
      const coordinates = [];

      if (element.lat && element.lon) {
        coordinates.push(element.lat);
        coordinates.push(element.lon);
      } else {
        coordinates.push(element.center.lat);
        coordinates.push(element.center.lon);
      }

      const marker = L.marker(coordinates).bindPopup(getContent(id, old, international, valid));
      markers.addLayer(marker);
    }
  }
  map.addLayer(markers);
  map.fitBounds(markers.getBounds());
}

function layer() {
  map.eachLayer((layer) => {
    map.removeLayer(layer);
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

/* eslint-disable indent */
function getContent(id, old, international, valid) {
  return `
  <div class="phone-numbers">
    <div class="phone-number red-text">${old}</div>
    ${(v => {
      if(v) {
        return `<div class="phone-number new-number green-text" data-clipboard-text="${international}">${international}</div>`;
      }
      return '';
    })(valid)}
  </div>
  <div>
    <a href="https://www.openstreetmap.org/${id}" target="_blank">View on OpenStreetMap</a><br>
    <a href="${Common.UI.editor(id)}" target="_blank">Open with editor</a><br>
    ${(v => {
      if(v) {
        return `<a href="#" class="copy-number-and-open" data-clipboard-text="${international}" data-url="${Common.UI.editor(id)}">
        Copy new number to clipboard and open iD</a>`;
      }
      return '';
    })(valid)}
  </div>`;
}
/* eslint-enable indent */

window.process = process;
