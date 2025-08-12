fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const productSelect = document.getElementById("product");
    const methodSelect = document.getElementById("method");
    const pressureSelect = document.getElementById("pressure");
    const resultDiv = document.getElementById("result");

    function populateSelect(select, values) {
      select.innerHTML = "";
      values.forEach(val => {
        const option = document.createElement("option");
        option.value = val;
        option.textContent = val;
        select.appendChild(option);
      });
    }

    function updateResult() {
      const product = productSelect.value;
      const method = methodSelect.value;
      const pressure = pressureSelect.value;
      const match = data.find(d =>
        d.Product === product &&
        d.Method === method &&
        d.Pressure === pressure
      );
      if (match) {
        resultDiv.textContent = `PEG Setting: ${match.PEG}, Dilution: ${match.Dilution}%`;
      } else {
        resultDiv.textContent = "No data found for selection.";
      }
    }

    const unique = (arr, key) => [...new Set(arr.map(item => item[key]))];
    populateSelect(productSelect, unique(data, "Product"));
    populateSelect(methodSelect, unique(data, "Method"));
    populateSelect(pressureSelect, unique(data, "Pressure"));

    productSelect.addEventListener("change", updateResult);
    methodSelect.addEventListener("change", updateResult);
    pressureSelect.addEventListener("change", updateResult);
  });
