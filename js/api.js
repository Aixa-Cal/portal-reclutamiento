/* Conexión con el servidor (Google Apps Script) o modo demostración (solo este navegador). */
var API = (function () {
  var url = (window.PORTAL_CONFIG || {}).API_URL || '';
  var demo = !url;

  async function remoto(action, payload) {
    var res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: action }, payload || {})) });
    var j = await res.json();
    if (!j.ok) throw new Error(j.error || 'Error del servidor');
    return j.data;
  }

  /* ---------- Modo demostración ---------- */
  var KEY = 'portal_ate_demo_v1';
  function cargar() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function guardar(db) { localStorage.setItem(KEY, JSON.stringify(db)); }
  function idb() {
    return new Promise(function (ok, mal) {
      var r = indexedDB.open('portal_ate_demo_files', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('f'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error); };
    });
  }
  async function fput(id, v) { var db = await idb(); return new Promise(function (ok, mal) { var tx = db.transaction('f', 'readwrite'); tx.objectStore('f').put(v, id); tx.oncomplete = ok; tx.onerror = function () { mal(tx.error); }; }); }
  async function fget(id) { var db = await idb(); return new Promise(function (ok, mal) { var q = db.transaction('f').objectStore('f').get(id); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { mal(q.error); }; }); }
  async function guardarArch(rec, nombre, f) { var id = 'F' + generarToken(16); await fput(id, f); return { fileId: id, nombre: nombre, mime: f.mime, subido: ahoraISO() }; }
  function ext(n, m) { var x = /\.([a-z0-9]{2,5})$/i.exec(n || ''); return x ? x[1].toLowerCase() : (/pdf/.test(m) ? 'pdf' : /png/.test(m) ? 'png' : 'jpg'); }
  function porToken(db, t) { for (var k in db) if (db[k].token === t) return db[k]; throw new Error('Enlace no válido o vencido. Escríbanos por WhatsApp.'); }
  function porId(db, id) { if (!db[id]) throw new Error('Candidato no encontrado'); return db[id]; }
  var CLAVE_DEMO = 'demo';

  var A = {
    'cand.ver': async function (db, r) { return vistaCandidato(porToken(db, r.token)); },
    'cand.subir': async function (db, r) {
      var rec = porToken(db, r.token); exigirAbierto(rec);
      var base = (rec.docs[r.doc].estado === 'rechazado' || r.reemplazar) ? 0 : rec.docs[r.doc].archivos.length, metas = [];
      for (var i = 0; i < (r.archivos || []).length; i++) metas.push(await guardarArch(rec, nombreArchivo(rec, r.doc, base + i, ext(r.archivos[i].nombre, r.archivos[i].mime)), r.archivos[i]));
      aplicarSubida(rec, r.doc, metas, r.datos || {}, !!r.reemplazar); guardar(db); return vistaCandidato(rec);
    },
    'cand.datos': async function (db, r) { var rec = porToken(db, r.token); aplicarDatos(rec, r.doc, r.datos || {}); guardar(db); return vistaCandidato(rec); },
    'cand.enviar': async function (db, r) { var rec = porToken(db, r.token); enviarExpediente(rec); guardar(db); return vistaCandidato(rec); },
    'admin.lista': async function (db) { return Object.keys(db).map(function (k) { return resumen(db[k]); }).sort(function (a, b) { return a.actualizado < b.actualizado ? 1 : -1; }); },
    'admin.ver': async function (db, r) { return porId(db, r.id); },
    'admin.crear': async function (db, r) { var rec = nuevoCandidato(r.datos || {}); db[rec.id] = rec; guardar(db); return rec; },
    'admin.cambiar': async function (db, r) { var rec = porId(db, r.id); (r.cambios || []).forEach(function (c) { adminCambiar(rec, c[0], c[1]); }); guardar(db); return rec; },
    'admin.docEstado': async function (db, r) { var rec = porId(db, r.id); adminDocEstado(rec, r.doc, r.estado, r.nota); guardar(db); return rec; },
    'admin.subirLab': async function (db, r) {
      var rec = porId(db, r.id), campo = r.campo === 'resultado' ? 'resultadoArchivo' : 'referimientoArchivo';
      rec.lab[campo] = await guardarArch(rec, (campo === 'resultadoArchivo' ? '09 - Resultado evaluación pre empleo' : 'INTERNO - Referimiento laboratorio') + '.' + ext(r.archivo.nombre, r.archivo.mime), r.archivo);
      if (campo === 'referimientoArchivo' && !rec.lab.referimiento) { rec.lab.referimiento = true; rec.lab.referimientoEn = ahoraISO(); }
      registrar(rec, 'Admin subió ' + (campo === 'resultadoArchivo' ? 'resultado de laboratorio' : 'referimiento de laboratorio'));
      guardar(db); return rec;
    },
    'admin.subirDoc': async function (db, r) {
      var rec = porId(db, r.id), base = rec.docs[r.doc].archivos.length, metas = [];
      for (var i = 0; i < (r.archivos || []).length; i++) metas.push(await guardarArch(rec, nombreArchivo(rec, r.doc, base + i, ext(r.archivos[i].nombre, r.archivos[i].mime)), r.archivos[i]));
      aplicarSubida(rec, r.doc, metas, {}, false, true); guardar(db); return rec;
    },
    'admin.archivo': async function (db, r) { var f = await fget(r.fileId); if (!f) throw new Error('Archivo no encontrado'); return f; },
    'admin.guardarExpediente': async function () { return { url: '', carpeta: '' }; },
    'admin.carpeta': async function () { return { url: '' }; }
  };

  async function local(action, payload) {
    payload = payload || {};
    if (action.indexOf('admin.') === 0 && payload.key !== CLAVE_DEMO) throw new Error('Clave incorrecta (en modo demostración la clave es: demo)');
    var fn = A[action]; if (!fn) throw new Error('Acción no válida');
    var db = cargar();
    var out = await fn(db, payload);
    return JSON.parse(JSON.stringify(out));
  }

  return { demo: demo, call: function (a, p) { return demo ? local(a, p) : remoto(a, p); } };
})();

/* ---------- utilidades comunes ---------- */
function $(s, el) { return (el || document).querySelector(s); }
function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fechaCorta(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fechaHora(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function toast(msg, tipo) {
  var t = document.createElement('div'); t.className = 'toast ' + (tipo || ''); t.textContent = msg; document.body.appendChild(t);
  setTimeout(function () { t.classList.add('show'); }, 10);
  setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3800);
}
function b64aBytes(b64) { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function bytesAB64(bytes) { var s = '', ch = 0x8000; for (var i = 0; i < bytes.length; i += ch) s += String.fromCharCode.apply(null, bytes.subarray(i, i + ch)); return btoa(s); }

/* Lee un archivo; si es imagen la reduce (máx 1800px) para que suba rápido. */
async function prepararArchivo(file) {
  if (/^image\//.test(file.type) && !/gif|svg/.test(file.type)) {
    var url = URL.createObjectURL(file);
    try {
      var img = await new Promise(function (ok, mal) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = mal; i.src = url; });
      var max = 1800, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(img, 0, 0, c.width, c.height);
      var data = c.toDataURL('image/jpeg', 0.86);
      return { nombre: file.name.replace(/\.[^.]+$/, '') + '.jpg', mime: 'image/jpeg', b64: data.split(',')[1] };
    } finally { URL.revokeObjectURL(url); }
  }
  if (file.size > 12 * 1024 * 1024) throw new Error('El archivo es muy pesado (máximo 12 MB).');
  var buf = new Uint8Array(await file.arrayBuffer());
  return { nombre: file.name, mime: file.type || 'application/pdf', b64: bytesAB64(buf) };
}

/* Línea gráfica de cada empresa: cambia los colores de la página */
function aplicarTema(clienteId) {
  var c = (CLIENTES[clienteId] || {}).colores || EMPRESA.colores, r = document.documentElement.style;
  r.setProperty('--azul', c.pri); r.setProperty('--azul2', c.osc); r.setProperty('--azul-s', c.suave);
}
function chipCliente(clienteId, extra) {
  var c = CLIENTES[clienteId]; if (!c) return '';
  return '<span class="pill" style="background:' + c.colores.suave + ';color:' + c.colores.osc + ';border:1px solid ' + c.colores.pri + '33">' + '<i style="width:8px;height:8px;border-radius:50%;background:' + c.colores.pri + ';display:inline-block"></i>' + esc(c.nombre) + (extra || '') + '</span>';
}
