(function(){
  const key = 'po_theme';
  function getDefault(){
    const saved = localStorage.getItem(key);
    if(saved) return saved;
    const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefers ? 'dark' : 'light';
  }
  function apply(theme){
    if(theme === 'dark') document.body.setAttribute('data-theme','dark');
    else document.body.removeAttribute('data-theme');
    localStorage.setItem(key, theme);
  }
  window.toggleTheme = function(){
    const cur = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    apply(cur === 'dark' ? 'light' : 'dark');
  };
  document.addEventListener('DOMContentLoaded', () => {
    apply(getDefault());
    const btn = document.getElementById('btn-theme');
    if(btn) btn.addEventListener('click', () => {
      toggleTheme();
      btn.classList.add('active');
      setTimeout(()=>btn.classList.remove('active'),300);
    });
  });
})();