/* Global loader injected synchronously so it appears early during page parse.
   Uses document.write to ensure the markup + styles are in place before rendering. */
(function(){
  try {
    var css = '\n<style id="global-loader-style">\n#global-loader{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.92);z-index:99999;transition:opacity .28s ease;opacity:1} \n#global-loader.hidden{opacity:0;pointer-events:none} \n#global-loader .loader-box{width:84px;height:84px;border-radius:16px;background:linear-gradient(180deg,#ffffff,#fbfbfb);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(16,24,40,0.06);} \n/* modern spinner: rotating ring */\n#global-loader .ring{width:44px;height:44px;border-radius:50%;border:4px solid rgba(0,0,0,0.08);border-top-color:#F5A64B;animation:gm-spin 900ms linear infinite} \n@keyframes gm-spin{to{transform:rotate(360deg)}}\n#global-loader .label{margin-top:10px;font-size:13px;color:#6B7280;font-weight:600;text-align:center} \n</style>\n';

    var html = '\n<div id="global-loader" role="status" aria-live="polite">\n  <div>\n    <div class="loader-box">\n      <div class="ring" aria-hidden="true"></div>\n    </div>\n    <div class="label">Chargement...</div>\n  </div>\n</div>\n';

    document.write(css + html);
  } catch (e) {
    // fallback: if document.write unavailable, create elements dynamically
    try {
      var s = document.createElement('style'); s.id='global-loader-style'; s.textContent = css.replace(/^\n|\n$/g,''); document.head.appendChild(s);
      var d = document.createElement('div'); d.id='global-loader'; d.setAttribute('role','status'); d.innerHTML = '<div><div class="loader-box"><div class="ring"></div></div><div class="label">Chargement...</div></div>'; document.body.appendChild(d);
    } catch (e2) { /* ignore */ }
  }

  function hideLoader() {
    var el = document.getElementById('global-loader');
    if (!el) return;
    el.classList.add('hidden');
    setTimeout(function(){ el.remove(); var s=document.getElementById('global-loader-style'); if(s) s.remove(); }, 400);
  }

  // Ensure loader is removed when DOM is ready or on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // small delay to ensure scripts have a chance to run their init
    setTimeout(hideLoader, 120);
  } else {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(hideLoader, 80); });
    window.addEventListener('load', function(){ setTimeout(hideLoader, 20); });
  }
})();
