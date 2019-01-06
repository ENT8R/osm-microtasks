/* globals M */
/* globals osmapi */
/* globals Task */

class Expert extends Task { // eslint-disable-line no-unused-vars
  constructor() {
    super();
    this.login();
    this.listener();
  }

  setComment(c) {
    this.COMMENT = c;
  }
  setTag(t) {
    this.TAG = t;
  }

  login() {
    const modal = M.Modal.init(document.getElementById('login-modal'), {
      dismissible: false
    });
    if (!osmapi.authenticated()) {
      modal.open();
    }

    // set listeners
    document.getElementById('login-button').addEventListener('click', () => {
      osmapi.authenticate(() => {
        M.toast({html: 'Logged in successfully!'}, 6000);
        modal.close();
      });
    });

    document.getElementById('logout').addEventListener('click', () => {
      osmapi.logout();
      document.getElementById('elements').innerHTML = '';
      modal.open();
      M.toast({html: 'Logged out successfully!'}, 6000);
    });
  }

  listener() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t.classList.contains('upload')) {
        const el = t.closest('div[data-id]');
        this.upload(el.dataset.id, el.dataset.value);
      } else if (t.classList.contains('remove')) {
        const el = t.closest('div[data-id]');
        this.remove(el.dataset.id);
      }
    });
  }

  show(elements) {
    const html = [];

    for (let i = 0; i < elements.length; i++) {
      html.push(super.content(false, elements[i]));
    }

    document.getElementById('elements').innerHTML = html.join('');
    if (elements.length === 0) {
      elements.innerHTML = 'Congratulations! Everything seems to be fixed here!';
    }
    console.log(`Number of found elements: ${elements.length}`); // eslint-disable-line no-console
  }

  remove(id) {
    const el = document.querySelector(`div[data-id="${id}"]`);
    el.style.display = 'none';
  }

  upload(id, value) { // eslint-disable-line no-unused-vars
    const parser = new DOMParser();
    const serializer = new XMLSerializer();

    osmapi.getElement(id, (data) => {
      console.log(data); // eslint-disable-line no-console

      const result = parser.parseFromString(data, 'text/xml');
      console.log(result); // eslint-disable-line no-console
      const el = result.querySelector(`tag[k="${this.TAG}"]`);
      el.setAttribute('v', value);

      osmapi.createChangeset(this.COMMENT, (changesetID) => {
        // set new id of changeset
        const s = id.split('/');
        const c = result.querySelector(`${s[0]}[id="${s[1]}"]`);
        c.setAttribute('changeset', changesetID);

        const xml = serializer.serializeToString(result);
        console.log(xml); // eslint-disable-line no-console

        osmapi.updateElement(id, xml, (data) => {
          console.log(data); // eslint-disable-line no-console
          osmapi.closeChangeset(changesetID);
          this.remove(id);
          M.toast({html: 'Uploaded successfully'}, 6000);
        });
      });
    });
  }
}
