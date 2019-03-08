/* globals M */
/* globals osmapi */

class Task { // eslint-disable-line no-unused-vars
  constructor() {
    this.HASHTAG = 'osmMicroTasks';
    this.MODES = {
      MAPS: 'MAPS',
      EXPERT: 'EXPERT'
    };
    this.overlay = document.getElementById('overlay');
  }

  init() {
    if (document.getElementById('login-modal') === null) {
      this.MODE = this.MODES.MAPS;
      this.UI = new Maps(); // eslint-disable-line no-undef
    } else {
      this.MODE = this.MODES.EXPERT;
      this.UI = new Expert(); // eslint-disable-line no-undef
    }
    this.parameter();
    this.select();
    this.listener();
  }

  setComment(c) {
    this.UI.setComment(c);
    this.COMMENT = c;
  }
  setTag(t) {
    this.UI.setTag(t);
    this.TAG = t;
  }

  parameter() {
    const url = new URL(window.location.href);
    const country = url.searchParams.get('country');

    if (country) {
      document.getElementById('country').value = country;
    }
  }

  select() {
    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    countrySelect.addEventListener('change', () => {
      const value = countrySelect.value;
      const states = document.getElementById('states');
      states.style.display = 'none';

      if (this.hasStates(value)) {
        // show the option to select a state of the selected country
        states.style.display = 'block';
        document.querySelector(`.states[data-country="${value}"]`).parentElement.style.display = 'block';
        M.FormSelect.init(document.querySelector(`.states[data-country="${value}"]`));
      } else {
        // a country was selected
        this.request(
          this.query(2, value),
          value
        );
      }
    });

    stateSelect.addEventListener('change', () => {
      this.request(
        this.query(4, stateSelect.value),
        stateSelect.getAttribute('data-country')
      );
    });

    if (countrySelect.value !== '') {
      countrySelect.dispatchEvent(new Event('change'));
    }
    if (stateSelect.value !== '') {
      stateSelect.dispatchEvent(new Event('change'));
    }
  }

  request(query, countryCode) {
    this.overlay.style.display = 'block';
    osmapi.overpass(query).then(data => {
      this.overlay.style.display = 'none';
      this.UI.show(this.process(data.elements, countryCode));
      this.buttons();
    }).catch(() => {
      return M.toast({html: 'Getting data from Overpass API failed'});
    });
  }

  clipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  listener() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t.classList.contains('more-information')) {
        this.information(t.closest('div[data-id]'));
      } else if (t.classList.contains('new-value')) {
        this.clipboard(t.innerText);
        M.toast({html: `Copied value: ${t.innerText}`}, 3000);
      } else if (t.classList.contains('copy-value-and-open')) {
        this.clipboard(t.dataset.clipboard);
        window.open(t.dataset.url, 'editor');
      }
    });

    const reload = document.getElementById('reload');
    reload.addEventListener('click', () => {
      const country = document.getElementById('country');
      const state = document.getElementById('state');

      if (this.hasStates(country.value)) {
        if (state.value === '') {
          return M.toast({html: 'Please select a state first!'});
        }
        this.request(
          this.query(4, state.value),
          state.getAttribute('data-country')
        );
      } else {
        if (country.value === '') {
          return M.toast({html: 'Please select a country first!'});
        }
        this.request(
          this.query(2, country.value),
          country.value
        );
      }
    });

    if (this.MODE === this.MODES.MAPS) {
      this.UI.map.on('popupopen', (p) => {
        // modify the position of the map in order to show the whole popup at once
        const position = p.popup.getLatLng();
        const zoom = this.UI.map.getZoom();
        const point = this.UI.map.options.crs.latLngToPoint(position, zoom);
        point.y = point.y - 150;
        this.UI.map.panTo(this.UI.map.options.crs.pointToLatLng(point, zoom));

        if (this.information) {
          this.overlay.style.display = 'block';
          // delay this because of the animation of the popup
          setTimeout(() => {
            this.information(document.querySelector('.leaflet-popup-content div'));
          }, 200);
        }
      });
    }
  }

  buttons() {
    const m = ['website'];
    if (m.includes(this.TAG)) {
      document.querySelectorAll('.btn.upload').forEach(b => {
        b.style.display = 'none';
      });
    } else {
      document.querySelectorAll('.btn.more-information').forEach(b => {
        b.style.display = 'none';
      });
    }
  }

  hasStates(c) {
    const countries = ['DE'];
    return countries.includes(c);
  }

  editor(id, position) {
    return {
      osm: `https://osm.org/edit?${id.replace('/', '=')}#map=${position}&comment=${this.COMMENT}&hashtags=${this.HASHTAG}`,
      level0: `http://level0.osmz.ru/?url=${id}&center=${position.split(/\/(.+)/)[1]}`
    };
  }

  process(data, countryCode) {
    const elements = [];

    for (let i = 0; i < data.length; i++) {
      const el = data[i];

      if (el.tags && el.tags[this.TAG]) {
        const old = el.tags[this.TAG];
        const correct = this.correct(old, countryCode);

        const coordinates = [];
        if (el.lat && el.lon) {
          coordinates.push(el.lat);
          coordinates.push(el.lon);
        } else {
          coordinates.push(el.center.lat);
          coordinates.push(el.center.lon);
        }

        const id = `${el.type}/${el.id}`;
        const position = `18/${coordinates.join('/')}`;
        const name = el.tags.name;

        elements.push({
          id,
          old,
          correct,
          position,
          name,
          coordinates
        });
      }
    }
    return elements;
  }

  /* eslint-disable indent */
  content(maps, data) {
    const editor = this.editor(data.id, data.position);

    if (maps) {
      return `
      <div data-id="${data.id}" data-value="${data.correct}">
        <div class="values">
          <div class="value red-text bold">${data.old}</div>
          ${(v => {
            if(v) {
              return `<div class="value new-value green-text bold">${data.correct}</div>`;
            }
            return '';
          })(data.correct)}
        </div>
        <div class="information bold"></div>
        <div class="links">
          <a href="https://www.openstreetmap.org/${data.id}" target="_blank">View on OpenStreetMap</a>
          <a href="${editor.osm}" target="editor">Open with editor</a>
          ${(v => {
            if(v) {
              return `
              <a href="#" class="copy-value-and-open" data-clipboard="${data.correct}" data-url="${editor.osm}">
              Copy to clipboard and open iD
              </a>
              <a href="#" class="copy-value-and-open" data-clipboard="${data.correct}" data-url="${editor.level0}">
              Copy to clipboard and open Level0
              </a>`;
            }
            return '';
          })(data.correct)}
        </div>
      </div>`;
    } else {
      return `
      <div class="col s12 m6 l4" data-id="${data.id}" data-value="${data.correct}">
        <div class="card white">
          <div class="card-content black-text">
            ${(n => {
              if(n) {
                return `<span class="card-title">${data.name}</span>`;
              }
              return '';
            })(data.name)}
            <div class="values">
              <div class="value red-text bold">${data.old}</div>
              ${(v => {
                if(v) {
                  return `<div class="value new-value green-text bold">${data.correct}</div>`;
                }
                return '<div class="red-text">Invalid value</div>';
              })(data.correct)}
            </div>
            <div class="information bold"></div>
          </div>
          <div class="card-action">
            <div>
              <a href="https://www.openstreetmap.org/${data.id}" target="_blank">View on OpenStreetMap</a>
              <a href="${editor.osm}" target="editor">Open with editor</a><br><br>
            </div>
            <div>
              ${(v => {
                if(v) {
                  return `
                  <a class="waves-effect waves-light btn indigo remove">Hide</a>
                  <a class="waves-effect waves-light btn indigo upload">Upload</a>
                  `;
                }
                return '';
              })(data.correct)}
              <a class="waves-effect waves-light btn indigo more-information">More Information</a>
            </div>
          </div>
        </div>
      </div>`;
    }
  }
  /* eslint-enable indent */
}
