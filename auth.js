/**
 * auth.js — Password gate for Municipal Markets dashboard.
 * Password: 1950 | sessionStorage per tab — never remove or bypass.
 */
(function () {
  const SESSION_KEY = 'mm_auth';
  const PASSWORD    = '1950';

  if (sessionStorage.getItem(SESSION_KEY) === 'true') return;

  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:#002B3C',
    'display:flex', 'align-items:center', 'justify-content:center',
    'z-index:9999', 'font-family:"Public Sans",Arial,sans-serif',
  ].join(';');

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:44px 40px;
                text-align:center;width:340px;box-shadow:0 8px 32px rgba(0,0,0,.4);">
      <img src="assets/halff_logo.png" alt="Halff"
           style="height:44px;margin-bottom:20px;" onerror="this.style.display='none'">
      <h2 style="margin:0 0 6px;color:#1C355E;font-size:20px;font-weight:600;">
        Municipal Markets
      </h2>
      <p style="margin:0 0 24px;color:#68949E;font-size:13px;">
        Halff Internal — Enter password to continue
      </p>
      <input id="mm-pw" type="password" placeholder="Password"
             autocomplete="current-password"
             style="width:100%;box-sizing:border-box;padding:10px 14px;
                    border:1.5px solid #D9DAE4;border-radius:6px;
                    font-size:15px;outline:none;margin-bottom:10px;
                    color:#002B3C;">
      <button id="mm-submit"
              style="width:100%;padding:11px;background:#1C355E;color:#fff;
                     border:none;border-radius:6px;font-size:15px;
                     cursor:pointer;font-weight:600;letter-spacing:.3px;">
        Enter
      </button>
      <p id="mm-error"
         style="color:#FC6758;font-size:12px;margin:8px 0 0;display:none;">
        Incorrect password — try again
      </p>
    </div>`;

  document.body.appendChild(overlay);

  function tryAuth() {
    if (document.getElementById('mm-pw').value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      overlay.remove();
    } else {
      const err = document.getElementById('mm-error');
      const inp = document.getElementById('mm-pw');
      err.style.display = 'block';
      inp.value = '';
      inp.style.borderColor = '#FC6758';
      inp.focus();
      setTimeout(() => { inp.style.borderColor = '#D9DAE4'; }, 1500);
    }
  }

  document.getElementById('mm-submit').addEventListener('click', tryAuth);
  document.getElementById('mm-pw').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tryAuth();
  });

  setTimeout(() => document.getElementById('mm-pw').focus(), 100);
})();
