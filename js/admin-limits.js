
const loginBox = document.getElementById('loginBox');
const adminBox = document.getElementById('adminBox');
const tBody = () => document.querySelector('#limitsTable tbody');
const statusEl = document.getElementById('status');

let data = [];      // [{Product, Min, Max}]
let products = [];  // pulled from data.json for convenience

function setStatus(msg){ statusEl.textContent = msg || ''; }

function makeRow(row={Product:'', Min:'', Max:''}){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable="true">${row.Product||''}</td>
    <td contenteditable="true">${row.Min||''}</td>
    <td contenteditable="true">${row.Max||''}</td>
    <td><button class="del">✕</button></td>
  `;
  tr.querySelector('.del').addEventListener('click', () => tr.remove());
  return tr;
}

function buildTable(arr){
  const body = tBody();
  body.innerHTML = '';
  arr.forEach(r => body.appendChild(makeRow(r)));
  setStatus(arr.length + ' rows loaded');
}

function readTable(){
  const rows = [...tBody().querySelectorAll('tr')];
  return rows.map(tr => {
    const tds = tr.querySelectorAll('td');
    return { Product: tds[0].innerText.trim(), Min: tds[1].innerText.trim(), Max: tds[2].innerText.trim() };
  }).filter(r => r.Product);
}

async function fetchProducts(){
  try {
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-cache'});
    const arr = await res.json();
    products = Array.from(new Set(arr.map(x => x.Product))).sort();
  } catch(e){ products = []; }
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const pw = document.getElementById('password').value;
  if (pw !== 'apex-admin'){ alert('Wrong password'); return; }
  loginBox.style.display = 'none';
  adminBox.style.display = 'block';
  await fetchProducts();
  try {
    const res = await fetch('limits.json?v=' + Date.now(), {cache:'no-cache'});
    data = await res.json();
    buildTable(data);
  } catch {
    data = [];
    buildTable([]);
  }
});

document.getElementById('addRow').addEventListener('click', () => {
  tBody().appendChild(makeRow());
});

document.getElementById('addMissing').addEventListener('click', () => {
  const current = new Set(readTable().map(r => r.Product));
  const toAdd = products.filter(p => !current.has(p));
  toAdd.forEach(p => tBody().appendChild(makeRow({Product:p, Min:'', Max:''})));
  setStatus('Added ' + toAdd.length + ' missing products');
});

document.getElementById('download').addEventListener('click', () => {
  const arr = readTable();
  const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'limits.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  setStatus('Downloaded limits.json (' + arr.length + ' rows)');
});
