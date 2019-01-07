/* globals libphonenumber */
/* globals Task */

class Fax extends Task { // eslint-disable-line no-unused-vars
  constructor() {
    super();
    this.COMMENT = 'Corrected fax number to be in international format (E.164)';
    this.TAG = 'fax';

    this.phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
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
      node(area.a)["${this.TAG}"]["${this.TAG}"!~"^[+][1-9]|110|112"];
      node(area.a)["${this.TAG}"]["${this.TAG}"~"-"];
      way(area.a)["${this.TAG}"]["${this.TAG}"!~"^[+][1-9]|110|112"];
      way(area.a)["${this.TAG}"]["${this.TAG}"~"-"];
    );
    out center;
    out skel;
    `;
  }
  /* eslint-enable indent */

  correct(old, country) {
    try {
      return this.phoneUtil.format(this.phoneUtil.parse(old, country), libphonenumber.PhoneNumberFormat.INTERNATIONAL);
    } catch (err) {
      return false;
    }
  }
}

new Fax().init();
