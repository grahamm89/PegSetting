async function loadData(){
  const res = await fetch('data.json?v=' + Date.now());
  return res.json();
}
function populateSelect(select, values){
  select.innerHTML = "";
  values.forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    select.appendChild(opt);
  });
}
function updateResult(data, productSelect, methodSelect, pressureSelect, resultDiv){
  const match = data.find(d => d.Product === productSelect.value && d.Method === methodSelect.value && d.Pressure === pressureSelect.value);
  if(match){
    resultDiv.textContent = `PEG Setting: ${match.PEG}, Dilution: ${match.Dilution}%`;
  } else {
    resultDiv.textContent = "No data found for selection.";
  }
}
loadData().then(data => {
  const productSelect = document.getElementById("product");
  const methodSelect = document.getElementById("method");
  const pressureSelect = document.getElementById("pressure");
  const resultDiv = document.getElementById("result");
  const unique = (arr, key) => [...new Set(arr.map(item => item[key]))];
  populateSelect(productSelect, unique(data, "Product"));
  populateSelect(methodSelect, unique(data, "Method"));
  populateSelect(pressureSelect, unique(data, "Pressure"));
  productSelect.addEventListener("change", () => updateResult(data, productSelect, methodSelect, pressureSelect, resultDiv));
  methodSelect.addEventListener("change", () => updateResult(data, productSelect, methodSelect, pressureSelect, resultDiv));
  pressureSelect.addEventListener("change", () => updateResult(data, productSelect, methodSelect, pressureSelect, resultDiv));
});
// Hidden admin access: double-tap 'E'
let lastPress = 0;
document.addEventListener('keydown', (e) => {
  if(e.key.toLowerCase() === 'e'){
    const now = Date.now();
    if(now - lastPress < 400){
      window.location.href = 'admin.html';
    }
    lastPress = now;
  }
});
