/* Estimador de suma asegurada de INCENDIO EDIFICIO (Hogar y Comercio).
 * Valor de construcción por m² según Apymeco (data/construccion.json, se actualiza solo cada mes).
 * m² cubiertos × $/m² = sugerencia en la cobertura «Incendio edificio». Es estimativa y editable.
 * Si el dato no carga se usa el último valor conocido; el formulario sigue funcionando igual. */
(function () {
  'use strict';
  var BASE = (function () { var s = document.currentScript && document.currentScript.src; return (s ? s.replace(/[^/]*$/, '') : '') + 'data/'; })();
  var D = { mes: 'OCT/26', valorM2: 2534060.94 };   // respaldo
  var CFG = { hogar: { m2: 'hoM2', suma: 'hoC01' }, comercio: { m2: 'coM2', suma: 'coC01' } };
  var fmt = function (n) { return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var cargado = fetch(BASE + 'construccion.json?d=' + new Date().toISOString().slice(0, 10))
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) { if (j && j.valorM2 > 0) D = j; }).catch(function () {});

  function calc(c) {
    var m2 = parseFloat((document.getElementById(c.m2) || {}).value);
    return m2 > 0 ? Math.round(m2 * D.valorM2) : 0;
  }
  function pintar(c, box) {
    var est = calc(c), out = box.querySelector('[data-est]'), btn = box.querySelector('button');
    box.querySelector('[data-val]').textContent = fmt(D.valorM2) + ' / m² (' + D.mes + ')';
    out.textContent = est ? fmt(est) : 'Ingresá los m² cubiertos';
    btn.disabled = !est;
  }
  function aplicar(c, box, manual) {
    var t = document.getElementById(c.suma), est = calc(c);
    if (!t || !est) return;
    if (!manual && t.value && t.dataset.autoCon !== '1') return;   // no pisar lo que cargó el asesor
    t.value = est; t.dataset.autoCon = '1';
    t.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function montar(tipo) {
    var c = CFG[tipo], m2 = document.getElementById(c.m2);
    if (!m2 || document.getElementById('apyBox_' + tipo)) return;
    var host = m2.closest('.grid2') || m2.parentNode;
    var box = document.createElement('div');
    box.id = 'apyBox_' + tipo; box.className = 'banner';
    box.innerHTML = '🏗️ <b>Estimación de Incendio edificio</b> (referencia Apymeco: valor de construcción)<br>' +
      'Valor por m²: <b data-val></b><br>Suma estimada = m² cubiertos × valor por m²: <b data-est></b> ' +
      '<button type="button" class="btn" style="margin-left:8px">Usar en «Incendio edificio»</button>' +
      '<br><small>Es un valor <b>estimativo</b> (no incluye terreno ni IVA). Se carga en la cobertura A y podés <b>editarlo</b> libremente; el valor lo actualiza Apymeco cada mes.</small>';
    host.parentNode.insertBefore(box, host.nextSibling);
    var t = document.getElementById(c.suma);
    if (t) t.addEventListener('input', function (e) { if (e.isTrusted) t.dataset.autoCon = '0'; });
    box.querySelector('button').addEventListener('click', function () { aplicar(c, box, true); });
    m2.addEventListener('input', function () { pintar(c, box); aplicar(c, box, false); });
    cargado.then(function () { pintar(c, box); aplicar(c, box, false); });
    pintar(c, box);
  }
  function revisar() { montar('hogar'); montar('comercio'); }
  document.addEventListener('DOMContentLoaded', function () {
    var rf = document.getElementById('riskFields'); if (!rf) return;
    new MutationObserver(revisar).observe(rf, { childList: true });
    revisar();
  });
})();
