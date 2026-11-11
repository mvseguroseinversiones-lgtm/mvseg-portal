/* Desplegables de Marca → Año → Modelo con el catálogo de Visred (archivos estáticos en data/).
 * Los campos siguen siendo de texto con sugerencias: si algo no figura en la lista se puede escribir a mano.
 * Si el catálogo no carga, el formulario funciona igual que antes. */
(function () {
  'use strict';
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return (s ? s.replace(/[^/]*$/, '') : '') + 'data/';
  })();
  var cache = {};
  function getJSON(rel) {
    if (!cache[rel]) cache[rel] = fetch(BASE + rel).then(function (r) { if (!r.ok) throw new Error(rel); return r.json(); });
    return cache[rel];
  }
  var norm = function (s) { return String(s || '').trim().toLowerCase(); };
  var seguro = function (s) { return String(s).replace(/[^a-zA-Z0-9_-]+/g, '_'); };

  function dl(input, suffix) {
    var id = input.id + '_' + suffix;
    var d = document.getElementById(id);
    if (!d) { d = document.createElement('datalist'); d.id = id; input.parentNode.appendChild(d); }
    input.setAttribute('list', id);
    input.setAttribute('autocomplete', 'off');
    return d;
  }
  function llenar(d, valores) {
    d.innerHTML = '';
    valores.forEach(function (v) { var o = document.createElement('option'); o.value = v; d.appendChild(o); });
  }
  // "0km-2026" → "2026 0km" (o solo "2026" si el campo es numérico); "2024" → "2024"
  function etiquetaAnio(a, soloNumero) {
    return /^0km-/.test(a.id) ? a.id.replace(/^0km-/, '') + (soloNumero ? '' : ' 0km') : a.id;
  }
  function anioDe(texto) {
    var m = String(texto).trim().match(/^(\d{4})( 0km)?$/i);
    return m ? m[1] : '';
  }
  function numeroDe(a) { return parseInt(String(a.id).replace('0km-', ''), 10); }

  /* opts: { tipo: 'auto'|'moto' (o una función que lo devuelve), marca: id, anio: id, modelo: id,
   *         anioNumerico: true → los años salen como número simple (el 0km se funde con su año) }
   * Devuelve { refrescar() } para llamar cuando cambia el tipo. */
  window.VehiculoCatalogo = {
    init: function (opts) {
      var marcaEl = document.getElementById(opts.marca), anioEl = document.getElementById(opts.anio);
      var modeloEl = opts.modelo ? document.getElementById(opts.modelo) : null;
      if (!marcaEl || !anioEl) return { refrescar: function () {} };
      var dMarca = dl(marcaEl, 'marcas'), dAnio = dl(anioEl, 'anios'), dModelo = modeloEl ? dl(modeloEl, 'modelos') : null;
      var indice = [], marcaActual = null, todo = null;
      var tipoActual = function () { return typeof opts.tipo === 'function' ? opts.tipo() : opts.tipo; };

      function actualizarModelos() {
        if (!dModelo) return;
        if (!marcaActual) { llenar(dModelo, []); return; }
        var anio = anioDe(anioEl.value), nombres = {};
        marcaActual.anios.forEach(function (a) {
          if (anio && String(numeroDe(a)) !== anio) return;
          (a.modelos || []).forEach(function (m) { nombres[m.n] = 1; });
        });
        llenar(dModelo, Object.keys(nombres).sort());
      }
      function alCambiarMarca() {
        var n = norm(marcaEl.value);
        var m = indice.filter(function (x) { return norm(x.n) === n; })[0];
        if (!m) { marcaActual = null; llenar(dAnio, []); actualizarModelos(); return; }
        var tipo = tipoActual();
        getJSON(tipo + '/' + seguro(m.id) + '.json').then(function (d) {
          if (tipo !== tipoActual() || norm(marcaEl.value) !== n) return; // cambió mientras cargaba
          marcaActual = d;
          var anios = d.anios.slice().sort(function (a, b) {
            return (/^0km/.test(b.id) - /^0km/.test(a.id)) || (numeroDe(b) - numeroDe(a));
          });
          var vistos = {}, lista = [];
          anios.forEach(function (a) {
            var e = etiquetaAnio(a, opts.anioNumerico);
            if (!vistos[e]) { vistos[e] = 1; lista.push(e); }
          });
          llenar(dAnio, lista);
          actualizarModelos();
        }).catch(function () { marcaActual = null; });
      }
      function cargarTipo() {
        if (!todo) return;
        indice = (todo.tipos && todo.tipos[tipoActual()]) || [];
        llenar(dMarca, indice.map(function (x) { return x.n; }).sort());
        marcaActual = null;
        alCambiarMarca();
      }
      ['input', 'change'].forEach(function (ev) {
        marcaEl.addEventListener(ev, alCambiarMarca);
        anioEl.addEventListener(ev, actualizarModelos);
      });
      getJSON('vehiculos-indice.json').then(function (d) { todo = d; cargarTipo(); })
        .catch(function () { /* sin catálogo: queda como texto libre */ });
      return { refrescar: cargarTipo };
    }
  };
})();
