const welcome = document.getElementById('welcome');
const dataBox = document.getElementById('data-box');
const adminBox = document.getElementById('admin-box');
const logoutBtn = document.getElementById('logout-btn');

async function getJSON(url){
  const res = await fetch(url); const body = await res.json().catch(()=>({})); return { ok: res.ok, body };
}

async function load(){
  const me = await getJSON('/api/auth/me');
  if (!me.ok) return location.href = '/';
  document.getElementById('welcome').textContent = `Signed in as ${me.body.email} (role: ${me.body.role})`;
  const d = await getJSON('/api/dashboard-data');
  if (d.ok) dataBox.textContent = d.body.secret;
  const a = await getJSON('/api/admin-data');
  if (a.ok) { adminBox.classList.remove('hidden'); adminBox.textContent = a.body.message; }
}

logoutBtn.addEventListener('click', async ()=>{ await fetch('/api/auth/logout', { method:'POST' }); location.href = '/'; });
load();
