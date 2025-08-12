
async function loadData() {
  const res = await fetch('data.json?cacheBust=' + Date.now());
  return await res.json();
}

function populateSelect(select, values) {
  select.innerHTML = "";
  values.forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
}

async function init() {
  const data = await loadData();
  const productSelect = document.getElementById("product");
  const methodSelect = document.getElementById("method");
  const pressureSelect = document.getElementById("pressure");
  const resultDiv = document.getElementById("result");

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

  productSelect.addEventListener("change", updateResult);
  methodSelect.addEventListener("change", updateResult);
  pressureSelect.addEventListener("change", updateResult);

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e') {
      if (!window.eeLastPress || Date.now() - window.eeLastPress < 400) {
        const pass = prompt("Enter admin password:");
        if (pass === "apex-admin") {
          document.getElementById('adminOverlay').style.display = 'block';
          buildAdminTable(data);
        }
      }
      window.eeLastPress = Date.now();
    }
  });
}

function buildAdminTable(data) {
  const adminTable = document.getElementById("adminTable");
  adminTable.innerHTML = "";
  data.forEach((row, idx) => {
    const tr = document.createElement("tr");
    Object.keys(row).forEach(k => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.value = row[k];
      input.onchange = () => row[k] = input.value;
      td.appendChild(input);
      tr.appendChild(td);
    });
    adminTable.appendChild(tr);
  });
}
window.onload = init;
