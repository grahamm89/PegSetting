fetch('data.json')
.then(r => r.json())
.then(data => {
  const productSelect = document.getElementById('product');
  const methodSelect = document.getElementById('method');
  const pressureSelect = document.getElementById('pressure');
  const resultDiv = document.getElementById('result');

  function populate(select, values) {
    select.innerHTML = '';
    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  const unique = (arr, key) => [...new Set(arr.map(i => i[key]))];
  populate(productSelect, unique(data, 'Product'));
  populate(methodSelect, unique(data, 'Method'));
  populate(pressureSelect, unique(data, 'Pressure'));

  function updateResult() {
    const match = data.find(d => 
      d.Product === productSelect.value &&
      d.Method === methodSelect.value &&
      d.Pressure === pressureSelect.value
    );
    resultDiv.textContent = match ? `PEG Setting: ${match.PEG}, Dilution: ${match.Dilution}%` : 'No data found';
  }

  productSelect.onchange = methodSelect.onchange = pressureSelect.onchange = updateResult;
});