/* globals L */
/* globals Task */

class Maps extends Task { // eslint-disable-line no-unused-vars
  constructor() {
    super();
    this.map = L.map('map', {
      minZoom: 2,
      maxZoom: 22,
      zoomControl: false
    }).setView([50, 10], 4);
    this.layer();
  }

  setComment(c) {
    this.COMMENT = c;
  }
  setTag(t) {
    this.TAG = t;
  }

  layer() {
    this.map.eachLayer((layer) => {
      this.map.removeLayer(layer);
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }

  show(elements) {
    this.layer();
    const markers = L.markerClusterGroup();

    for (let i = 0; i < elements.length; i++) {
      const marker = L.marker(elements[i].coordinates).bindPopup(super.content(true, elements[i]));
      markers.addLayer(marker);
    }

    this.map.addLayer(markers);
    this.map.fitBounds(markers.getBounds());
  }
}
