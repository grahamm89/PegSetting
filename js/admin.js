
const adminOverlay = document.getElementById('adminOverlay');
const dataEditor = document.getElementById('dataEditor');
const applyPreview = document.getElementById('applyPreview');
const downloadData = document.getElementById('downloadData');
const closeAdmin = document.getElementById('closeAdmin');

function openAdmin(){
  dataEditor.value = JSON.stringify(state.data, null, 2);
  adminOverlay.style.display = 'flex';
}
function closeModal(){ adminOverlay.style.display = 'none'; }

let lastPress = 0;
document.addEventListener('keydown', (e) => {
  if ((e.key||'').toLowerCase() === 'e') {
    const now = Date.now();
    if (now - lastPress < 400) {
      const pass = prompt('Enter admin password:');
      if (pass === 'apex-admin') openAdmin();
    }
    lastPress = now;
  }
});

if (closeAdmin) closeAdmin.addEventListener('click', closeModal);
if (applyPreview) applyPreview.addEventListener('click', () => {
  try {
    const next = JSON.parse(dataEditor.value);
    if (!Array.isArray(next)) throw new Error('data.json must be an array');
    state.data = next;
    initSelectors();
    alert('Preview updated. Remember to Download and upload data.json to GitHub.');
  } catch (err) {
    alert('Invalid JSON: ' + err.message);
  }
});
if (downloadData) downloadData.addEventListener('click', () => {
  try {
    const blob = new Blob([dataEditor.value], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Could not create download: ' + err.message);
  }
});
