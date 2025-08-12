
const loginBox = document.getElementById('loginBox');
const adminBox = document.getElementById('adminBox');
const tbody = () => document.querySelector('#dataTable tbody');
let suggestedFilename = 'data.json';

document.getElementById('loginBtn').addEventListener('click', async () => {
  const pw = document.getElementById('password').value;
  if (pw !== 'apex-admin'){ alert('Wrong password'); return; }
  loginBox.style.display = 'none';
  adminBox.style.display = 'block';
  try {
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-cache'});
    const arr = await res.json();
    buildTable(arr);
  } catch { buildTable([]); }
});

function buildTable(arr){
  const tb = tbody();
  tb.innerHTML = '';
  arr.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td contenteditable>${row.Product ?? ''}</td>
      <td contenteditable>${row.Method ?? ''}</td>
      <td contenteditable>${row.Pressure ?? ''}</td>
      <td contenteditable>${row.PEG ?? ''}</td>
      <td contenteditable>${row.Dilution ?? ''}</td>
      <td><button class="del">X</button></td>
    `;
    tr.querySelector('.del').addEventListener('click', () => tr.remove());
    tb.appendChild(tr);
  });
}

function tableToJson(){
  const rows = Array.from(tbody().querySelectorAll('tr'));
  return rows.map(tr => {
    const tds = tr.querySelectorAll('td');
    return {
      Product: tds[0].innerText.trim(),
      Method: tds[1].innerText.trim(),
      Pressure: tds[2].innerText.trim(),
      PEG: tds[3].innerText.trim(),
      Dilution: parseFloat(tds[4].innerText.trim() || '0')
    };
  });
}

function downloadJson(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById('addRow').addEventListener('click', () => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td><button class="del">X</button></td>
  `;
  tr.querySelector('.del').addEventListener('click', () => tr.remove());
  tbody().appendChild(tr);
});

document.getElementById('downloadData').addEventListener('click', () => {
  const data = tableToJson();
  downloadJson(suggestedFilename, data);
});

document.getElementById('newVersion').addEventListener('click', () => {
  tbody().innerHTML = '';
  const stamp = new Date().toISOString().replace(/[-:T]/g,'').slice(0,12);
  suggestedFilename = prompt('Filename for new version:', `data-${stamp}.json`) || `data-${stamp}.json`;
});

document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('uploadInput').click();
});
document.getElementById('uploadInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    if (!Array.isArray(json)) throw new Error('JSON must be an array');
    buildTable(json);
    alert('Loaded JSON. Edit and Download to save.');
  } catch (err) {
    alert('Invalid JSON: ' + err.message);
  }
});
