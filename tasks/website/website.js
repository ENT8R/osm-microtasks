/* globals Task */

class Website extends Task { // eslint-disable-line no-unused-vars
  constructor() {
    super();
    this.COMMENT = 'Corrected URL to be in a proper format (RFC 1738)';
    this.TAG = 'website';
  }

  init() {
    super.init();
    super.setComment(this.COMMENT);
    super.setTag(this.TAG);
  }

  /* eslint-disable indent */
  query(level, area) {
    return `
    [out:json][timeout:3600];
    ${(l => {
      if(l === 2) {
        return `area["ISO3166-1"="${area}"][admin_level=2]->.a;`;
      } else {
        return `area["ISO3166-2"="${area}"][admin_level=4]->.a;`;
      }
    })(level)}
    (
      node(area.a)["${this.TAG}"]["${this.TAG}"!~"^(https?):\\/\\/"];
      way(area.a)["${this.TAG}"]["${this.TAG}"!~"^(https?):\\/\\/"];
    );
    out center;
    out skel;
    `;
  }
  /* eslint-enable indent */

  correct(old) {
    return `https://${old}`.replace(/\/$/, '');
  }

  information(el) {
    this.overlay.style.display = 'block';

    const correct = el.querySelector('.value.new-value');
    const info = el.querySelector('.information');
    const copy = el.querySelectorAll('.copy-value-and-open');
    const upload = el.querySelector('.btn.upload');
    const informationButton = el.querySelector('.btn.more-information');

    const old = el.dataset.value;

    fetch(`https://ent8r.lima-city.de/httpschecker/status?url=${old.replace(/^(?:https?:\/\/)?/i, '')}`, {
      method: 'GET'
    }).then((response) => {
      return response.json();
    }).then(response => {

      this.overlay.style.display = 'none';

      if (response.status !== 200) {
        throw new Error('Website could not be loaded');
      } else {
        const url = response.url.replace(/\/$/, '');
        el.dataset.value = url;
        correct.innerText = url;

        if (upload !== null) {
          upload.style.display = 'inline-block';
        }
        if (informationButton !== null) {
          informationButton.style.display = 'none';
        }
        if (copy !== null) {
          for (let i = 0; i < copy.length; i++) {
            copy[i].dataset.clipboard = url;
          }
        }

        if (url.length >= old.length + 5) {
          info.innerText = 'The new URL is longer than the old one. Please make sure that it is still valid';
        }
      }
    }).catch(() => {
      this.overlay.style.display = 'none';

      info.classList.add('red-text');
      info.classList.remove('bold');
      info.innerText = 'The website is probably not accessible anymore. Please fix it by hand!';
      correct.innerText = '';
      if (copy !== null) {
        for (let i = 0; i < copy.length; i++) {
          copy[i].dataset.clipboard = '';
        }
      }
    });
  }
}

new Website().init();
