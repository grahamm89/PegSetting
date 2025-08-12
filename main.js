fetch('data.json?_=' + Date.now())
  .then(res => res.json())
  .then(data => {
    const productSelect = document.getElementById('product');
    const methodSelect = document.getElementById('method');
    const pressureSelect = document.getElementById('pressure');
    const resultDiv = document.getElementById('result');
    function populateSelect(select, values) {
      select.innerHTML = "";
      values.forEach(val => {
        const opt = document.createElement("option");
        opt.value = val; opt.textContent = val;
        select.appendChild(opt);
      });
    }
    const unique = (arr, key) => [...new Set(arr.map(item => item[key]))];
    populateSelect(productSelect, unique(data, "Product"));
    populateSelect(methodSelect, unique(data, "Method"));
    populateSelect(pressureSelect, unique(data, "Pressure"));
    function updateResult() {
      const match = data.find(d =>
        d.Product === productSelect.value &&
        d.Method === methodSelect.value &&
        d.Pressure === pressureSelect.value
      );
      resultDiv.textContent = match ? `PEG Setting: ${match.PEG}, Dilution: ${match.Dilution}%` : "No data found.";
    }
    productSelect.onchange = updateResult;
    methodSelect.onchange = updateResult;
    pressureSelect.onchange = updateResult;

    // Admin overlay trigger
    let lastE = 0;
    document.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 'e') {
        const now = Date.now();
        if (now - lastE < 400) {
          const pass = prompt("Enter admin password:");
          if (pass === "apex-admin") {
            document.getElementById('adminOverlay').style.display = 'block';
            initAdmin(data);
          }
        }
        lastE = now;
      }
    });
  });
