/* globals Common */
/* globals libphonenumber */
/* globals M */
/* globals osmapi */

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

const parser = new DOMParser();
const serializer = new XMLSerializer();

function process(elements, countryCode) {
  document.getElementById('elements').innerHTML = '';

  let numberOfElements = 0;
  const html = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.tags && element.tags[Common.TAG]) {
      let international;
      const old = element.tags[Common.TAG];
      let valid = true;

      try {
        international = phoneUtil.format(phoneUtil.parse(old, countryCode), libphonenumber.PhoneNumberFormat.INTERNATIONAL);
      } catch (err) {
        /* eslint-disable no-console */
        console.log(element.id);
        console.log(old);
        console.log(err.message);
        /* eslint-enable no-console */
        valid = false;
      }

      const id = `${element.type}/${element.id}`;

      html.push(getContent(id, element.tags.name, old, international, valid));
      numberOfElements++;
    }
  }

  document.getElementById('elements').innerHTML = html.join('');

  if (numberOfElements === 0) {
    elements.innerHTML = 'Congratulations! Everything seems to be fixed here!';
  }
  console.log(`Number of found elements: ${numberOfElements}`); // eslint-disable-line no-console
}

/* eslint-disable indent */
function getContent(id, name, old, international, valid) {
  return `
  <div class="col s12 m6 l4" data-id="${id}" data-phone="${international}">
    <div class="card white">
      <div class="card-content black-text">
        ${(n => {
          if(n) {
            return `<span class="card-title">${name}</span>`;
          }
          return '';
        })(name)}
        <div class="phone-number red-text">${old}</div>
        ${(v => {
          if(v) {
            return `<div class="phone-number new-number green-text" data-clipboard-text="${international}">${international}</div>`;
          }
          return '<div class="red-text">Invalid number</div>';
        })(valid)}
      </div>
      <div class="card-action">
        <a href="https://www.openstreetmap.org/${id}" target="_blank">View on OpenStreetMap</a>
        <a href="${Common.UI.editor(id)}" target="_blank">Open with editor</a><br><br>
        ${(v => {
          if(v) {
            return `<a class="waves-effect waves-light btn indigo" onclick="remove('${id}');">Remove</a>
            <a class="waves-effect waves-light btn indigo" onclick="upload('${id}', '${international}');">Upload</a>`;
          }
          return '';
        })(valid)}
      </div>
    </div>
  </div>`;
}
/* eslint-enable indent */

function remove(id) {
  const el = document.querySelector(`div[data-id="${id}"]`);
  el.style.display = 'none';
}

function upload(id, value) { // eslint-disable-line no-unused-vars
  osmapi.getElement(id, (data) => {
    console.log(data); // eslint-disable-line no-console

    const result = parser.parseFromString(data, 'text/xml');
    console.log(result); // eslint-disable-line no-console
    const el = result.querySelector(`tag[k="${Common.TAG}"]`);
    el.setAttribute('v', value);

    osmapi.createChangeset(Common.COMMENT, (changesetID) => {
      // set new id of changeset
      const s = id.split('/');
      const c = result.querySelector(`${s[0]}[id="${s[1]}"]`);
      c.setAttribute('changeset', changesetID);

      const xml = serializer.serializeToString(result);
      console.log(xml); // eslint-disable-line no-console

      osmapi.updateElement(id, xml, (data) => {
        console.log(data); // eslint-disable-line no-console
        osmapi.closeChangeset(changesetID);
        remove(id);
        M.toast({html: 'Uploaded successfully'}, 6000);
      });
    });

  });
}

window.process = process;
window.upload = upload;
window.remove = remove;
