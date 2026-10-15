/* Fatturo — comportamento dos mockups mobile.
   1. Ocultar valores: alterna [data-valores] no <html> e troca "R$ 1.234,56" por "R$ •••••"
      em todo elemento .ft-money. A escolha fica no aparelho (localStorage).
   2. Folhas (<dialog class="ft-sheet">): abrem por [data-sheet="id"], fecham por [data-close],
      pelo fundo ou por Esc.
   3. Lançamentos: com linhas marcadas, a barra de seleção substitui a barra inferior.
   Para ver um estado direto: pagina.html#ocultos, #mais, #filtros, #selecao. */
(function () {
  var KEY = 'fatturo:valores';
  var root = document.documentElement;
  var money = Array.prototype.slice.call(document.querySelectorAll('.ft-money'));
  money.forEach(function (el) { el.dataset.valor = el.textContent; });
  var MONEY_RE = /R\$\s?[\d.]+(,\d+)?/g;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function apply(hidden) {
    root.dataset.valores = hidden ? 'ocultos' : 'visiveis';
    money.forEach(function (el) {
      el.textContent = hidden ? el.dataset.valor.replace(MONEY_RE, 'R$ •••••') : el.dataset.valor;
    });
    document.querySelectorAll('[data-toggle-valores]').forEach(function (b) {
      b.setAttribute('aria-pressed', hidden ? 'true' : 'false');
      b.title = hidden ? 'Mostrar valores' : 'Ocultar valores';
    });
  }

  var hash = (location.hash || '').slice(1);
  apply(hash === 'ocultos' || (hash !== 'visiveis' && read() === 'ocultos'));

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toggle-valores]');
    if (t) {
      var hidden = root.dataset.valores !== 'ocultos';
      apply(hidden); save(hidden ? 'ocultos' : 'visiveis');
      return;
    }
    var open = e.target.closest('[data-sheet]');
    if (open) {
      var d = document.getElementById(open.getAttribute('data-sheet'));
      if (d && d.showModal) { e.preventDefault(); d.showModal(); }
      return;
    }
    var close = e.target.closest('[data-close]');
    if (close) { var dlg = close.closest('dialog'); if (dlg) dlg.close(); return; }
    if (e.target.tagName === 'DIALOG') e.target.close(); // toque no fundo
  });
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(e.newValue === 'ocultos'); });

  // Seleção de lançamentos
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.js-sel'));
  var count = document.querySelector('.js-sel-count');
  function sync() {
    var n = boxes.filter(function (b) { return b.checked; }).length;
    document.body.classList.toggle('ft-selecting', n > 0);
    var bar = document.querySelector('.ft-selbar');
    if (bar) bar.hidden = n === 0;
    if (count) count.textContent = n === 1 ? '1 lançamento selecionado' : n + ' lançamentos selecionados';
  }
  boxes.forEach(function (b) { b.addEventListener('change', sync); });
  document.querySelectorAll('[data-clear-sel]').forEach(function (b) {
    b.addEventListener('click', function () { boxes.forEach(function (x) { x.checked = false; }); sync(); });
  });
  if (hash === 'selecao') boxes.filter(function (b) { return b.dataset.demo === '1'; }).forEach(function (b) { b.checked = true; });
  sync();

  // Estado inicial por âncora
  var target = hash && document.getElementById(hash);
  if (target && target.tagName === 'DIALOG' && target.showModal) target.showModal();
  if (target && target.tagName === 'DETAILS') { target.open = true; target.scrollIntoView(); }

  // "Paguei hoje"
  document.querySelectorAll('[data-hoje]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var f = document.getElementById(a.getAttribute('data-hoje'));
      var d = new Date();
      if (f) f.value = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    });
  });
  document.querySelectorAll('form').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });
})();
