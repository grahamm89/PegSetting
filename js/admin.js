let lastKeyTime=0;
document.addEventListener('keydown',e=>{
  if(e.key.toLowerCase()==='e'){
    const now=Date.now();
    if(now-lastKeyTime<400){
      const pass=prompt('Enter admin password:');
      if(pass==='apex-admin'){
        openAdmin();
      }
    }
    lastKeyTime=now;
  }
});
function openAdmin(){
  document.getElementById('adminModal').style.display='block';
  document.getElementById('dataEditor').value = JSON.stringify(pegData,null,2);
}
document.getElementById('closeAdmin').onclick=()=>document.getElementById('adminModal').style.display='none';
document.getElementById('saveData').onclick=()=>{
  try{
    pegData=JSON.parse(document.getElementById('dataEditor').value);
    alert('Data updated locally. Upload updated data.json to make permanent.');
    document.getElementById('adminModal').style.display='none';
    populateSelects();
  }catch(err){alert('Invalid JSON');}
};
