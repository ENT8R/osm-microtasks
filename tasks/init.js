const url = new URL(window.location.href);
const task = url.searchParams.get('t') || url.searchParams.get('task');

if (!task) {
  window.open('../', '_self');
}

const script = document.createElement('script');
script.src = `${task}/${task}.js`;
document.body.appendChild(script);
