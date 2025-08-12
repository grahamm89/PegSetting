
const state = { data: [] };
const productSelect = document.getElementById("product");
const methodSelect = document.getElementById("method");
const pressureSelect = document.getElementById("pressure");
const resultDiv = document.getElementById("result");

function unique(arr, key){ return [...new Set(arr.map(item => item[key]))]; }
function populateSelect(select, values){
  select.innerHTML = "";
  values.forEach(val => { const o=document.createElement("option"); o.value=val; o.textContent=val; select.appendChild(o); });
}

function updateResult(){
  const product = productSelect.value;
  const method = methodSelect.value;
  const pressure = pressureSelect.value;
  const match = state.data.find(d => d.Product===product && d.Method===method && d.Pressure===pressure);
  resultDiv.textContent = match ? `PEG Setting: ${match.PEG}, Dilution: ${match.Dilution}%` : "No data found for selection.";
}

function initSelectors(){
  populateSelect(productSelect, unique(state.data, "Product"));
  populateSelect(methodSelect, unique(state.data, "Method"));
  populateSelect(pressureSelect, unique(state.data, "Pressure"));
  productSelect.addEventListener("change", updateResult);
  methodSelect.addEventListener("change", updateResult);
  pressureSelect.addEventListener("change", updateResult);
  if (productSelect.value && methodSelect.value && pressureSelect.value) updateResult();
}

async function loadData(){
  const res = await fetch('data.json?v=' + Date.now(), { cache: 'no-cache' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const arr = await res.json();
  if (!Array.isArray(arr)) throw new Error('data.json is not an array');
  state.data = arr;
  initSelectors();
}

document.getElementById('stamp')?.append('Updated: ' + new Date().toLocaleString());
loadData().catch(err => { resultDiv.textContent = 'Failed to load data.json: ' + err.message; });
