function login(){
  const pw = document.getElementById('password').value;
  if(pw === 'apex-admin'){
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminContainer').style.display = 'block';
    loadData();
  } else {
    alert('Wrong password');
  }
}

function loadData(){
  fetch('data.json').then(r=>r.json()).then(data => {
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';
    data.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td contenteditable>${row.Product}</td>
        <td contenteditable>${row.Method}</td>
        <td contenteditable>${row.Pressure}</td>
        <td contenteditable>${row.PEG}</td>
        <td contenteditable>${row.Dilution}</td>
        <td><button onclick="deleteRow(this)">X</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function addRow(){
  const tbody = document.querySelector('#dataTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td><button onclick="deleteRow(this)">X</button></td>
  `;
  tbody.appendChild(tr);
}

function deleteRow(btn){
  btn.closest('tr').remove();
}

function downloadData(){
  const rows = document.querySelectorAll('#dataTable tbody tr');
  const data = [];
  rows.forEach(tr => {
    const cells = tr.querySelectorAll('td');
    data.push({
      Product: cells[0].innerText.trim(),
      Method: cells[1].innerText.trim(),
      Pressure: cells[2].innerText.trim(),
      PEG: cells[3].innerText.trim(),
      Dilution: parseFloat(cells[4].innerText.trim())
    });
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'data.json';
  a.click();
}
