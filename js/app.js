let pegData = [];
async function loadData(){
  const res = await fetch('data.json?cacheBust=' + Date.now());
  pegData = await res.json();
  populateSelects();
}
function populateSelect(selectId, values){
  const sel = document.getElementById(selectId);
  sel.innerHTML = '';
  values.forEach(v=>{
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}
function populateSelects(){
  const products = [...new Set(pegData.map(d=>d.Product))];
  const methods = [...new Set(pegData.map(d=>d.Method))];
  const pressures = [...new Set(pegData.map(d=>d.Pressure))];
  populateSelect('product', products);
  populateSelect('method', methods);
  populateSelect('pressure', pressures);
}
function updateResult(){
  const product = document.getElementById('product').value;
  const method = document.getElementById('method').value;
  const pressure = document.getElementById('pressure').value;
  const match = pegData.find(d=>d.Product===product && d.Method===method && d.Pressure===pressure);
  document.getElementById('result').textContent = match ? 
    `PEG Setting: ${match.PEG}, Dilution: ${match.Dilution}%` : 'No data found for selection.';
}
['product','method','pressure'].forEach(id=>document.getElementById(id).addEventListener('change', updateResult));
loadData();
