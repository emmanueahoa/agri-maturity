async function postJSON(url, data){
  const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
  const body = await res.json().catch(()=>({}));
  return { ok: res.ok, body };
}

const form = document.getElementById('login-form');
const msg = document.getElementById('message');
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = form.email.value.trim();
  const password = form.password.value;
  const { ok, body } = await postJSON('/api/auth/login', { email, password });
  if (ok) location.href = '/dashboard';
  else msg.textContent = body.error || 'Login failed';
});
