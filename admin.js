function initAdmin(data) {
  const tableBody = document.querySelector('#adminTable tbody');
  function renderTable() {
    tableBody.innerHTML = '';
    data.forEach((row, idx) => {
      const tr = document.createElement('tr');
      ['Product','Method','Pressure','PEG','Dilution'].forEach(key => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.value = row[key];
        input.oninput = e => row[key] = e.target.value;
        td.appendChild(input);
        tr.appendChild(td);
      });
      const tdAct = document.createElement('td');
      const btnDel = document.createElement('button');
      btnDel.textContent = 'Delete';
      btnDel.onclick = () => { data.splice(idx,1); renderTable(); };
      tdAct.appendChild(btnDel);
      tr.appendChild(tdAct);
      tableBody.appendChild(tr);
    });
  }
  document.getElementById('addRow').onclick = () => { data.push({Product:'',Method:'',Pressure:'',PEG:'',Dilution:''}); renderTable(); };
  document.getElementById('downloadData').onclick = () => {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
  };
  renderTable();
}
// If standalone admin.html, fetch data first
if (!document.getElementById('adminOverlay')) {
  const pass = prompt("Enter admin password:");
  if (pass === "apex-admin") {
    fetch('data.json?_=' + Date.now()).then(r=>r.json()).then(d => initAdmin(d));
  } else {
    document.body.innerHTML = "<h2>Access Denied</h2>";
  }
}
