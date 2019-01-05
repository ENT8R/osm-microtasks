/* globals ClipboardJS */
/* globals Common */
/* globals M */
/* globals osmapi */

window.Common = {
  COMMENT: 'Corrected phone number to be in international format (E.164)',
  TAG: 'phone',
  HASHTAG: 'osmMicroTasks',

  Query: (() => {
    const me = {};

    const overlay = document.getElementById('overlay');

    me.build = (level, area) => { // eslint-disable-line consistent-return
      const query = {
        country: `
        [out:json][timeout:3600];
          area["ISO3166-1"="${area}"][admin_level=2]->.a;
          (
            node(area.a)["${Common.TAG}"]["${Common.TAG}"!~"^[+][1-9]|110|112"];
            node(area.a)["${Common.TAG}"]["${Common.TAG}"~"-"];
            way(area.a)["${Common.TAG}"]["${Common.TAG}"!~"^[+][1-9]|110|112"];
            way(area.a)["${Common.TAG}"]["${Common.TAG}"~"-"];
          );
          out center;
          out skel;`,
        state: `[out:json][timeout:3600];
          area["ISO3166-2"="${area}"][admin_level=4]->.a;
          (
            node(area.a)["${Common.TAG}"]["${Common.TAG}"!~"^[+][1-9]|110|112"];
            node(area.a)["${Common.TAG}"]["${Common.TAG}"~"-"];
            way(area.a)["${Common.TAG}"]["${Common.TAG}"!~"^[+][1-9]|110|112"];
            way(area.a)["${Common.TAG}"]["${Common.TAG}"~"-"];
          );
          out center;
          out skel;`
      };

      switch (level) {
      case 2:
        return query.country;
      case 4:
        return query.state;
      }
    };

    me.get = (query, countryCode) => {
      overlay.style.display = 'block';
      osmapi.overpass(query, (data) => {
        overlay.style.display = 'none';
        data = JSON.parse(data).elements;
        process(data, countryCode);
      });
    };

    me.hasStates = (country) => {
      const countries = ['DE'];
      if (countries.includes(country)) {
        return true;
      } else {
        return false;
      }
    };

    return me;
  })(),

  UI: (() => {
    const me = {};

    me.editor = (id) => {
      return `https://osm.org/edit?${id.replace('/', '=')}&comment=${Common.COMMENT}&hashtags=${Common.HASHTAG}`;
    };

    function search() {
      const url = new URL(window.location.href);
      const country = url.searchParams.get('country');

      if (country) {
        document.getElementById('country').value = country;
      }
    }

    function select() {
      const countrySelect = document.getElementById('country');
      const stateSelect = document.getElementById('state');
      countrySelect.addEventListener('change', () => {
        const value = countrySelect.value;
        const states = document.getElementById('states');
        states.style.display = 'none';

        if (Common.Query.hasStates(value)) {
          // show the option to select a state of the selected country
          states.style.display = 'block';
          document.querySelector(`.states[data-country="${value}"]`).parentElement.style.display = 'block';
          M.FormSelect.init(document.querySelector(`.states[data-country="${value}"]`));
        } else {
          // a country was selected
          Common.Query.get(
            Common.Query.build(2, value),
            value
          );
        }
      });

      stateSelect.addEventListener('change', () => {
        Common.Query.get(
          Common.Query.build(4, stateSelect.value),
          stateSelect.getAttribute('data-country')
        );
      });
    }

    function clipboard() {
      new ClipboardJS('.new-number').on('success', (e) => {
        M.toast({html: `Copied number: ${e.text}`}, 3000);
      });
      new ClipboardJS('.copy-number-and-open').on('success', (e) => {
        window.open(e.trigger.getAttribute('data-url'));
      });
    }

    function login() {
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

    me.init = () => {
      search();
      select();
      clipboard();
      if (document.getElementById('login-modal') !== null) {
        login();
      }
    };

    return me;
  })()
};

Common.UI.init();
