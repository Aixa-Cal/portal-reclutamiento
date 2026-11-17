/* ============================================================
   SERVIDOR DEL PORTAL – Google Apps Script
   Guarda los candidatos en una hoja de Google Sheets y los
   documentos en carpetas de Google Drive (privadas, en su cuenta).
   ------------------------------------------------------------
   CLAVE DEL PANEL: la primera clave con la que entre al panel
   (mínimo 8 caracteres) queda guardada como clave de RRHH.
   Para cambiarla: Configuración del proyecto → Propiedades del
   script → borre ADMIN_KEY y entre de nuevo con la clave nueva.
   ============================================================ */
var CORREO_AVISOS = 'aixa@alconia.com'; // a dónde llega el aviso cuando un candidato termina
var URL_PANEL = 'https://aixa-cal.github.io/portal-reclutamiento/';

function doGet() { return salida_({ ok: true, app: 'Portal de Reclutamiento ATE', hora: ahoraISO() }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse(e.postData.contents);
    var a = String(req.action || '');
    if (a.indexOf('admin.') === 0) {
      var guardada = props_().getProperty('ADMIN_KEY'), dada = String(req.key || '').trim();
      if (!guardada) {
        if (dada.length < 8) throw new Error('Primera vez: elija una clave de al menos 8 caracteres. Esa será su clave del panel.');
        props_().setProperty('ADMIN_KEY', dada); guardada = dada;
      }
      // No distingue mayúsculas/minúsculas ni espacios al inicio o al final
      if (dada.toLowerCase() !== String(guardada).trim().toLowerCase()) throw new Error('Clave incorrecta');
    }
    var fn = ACCIONES_[a];
    if (!fn) throw new Error('Acción no válida');
    lock.waitLock(25000);
    return salida_({ ok: true, data: fn(req) });
  } catch (err) {
    return salida_({ ok: false, error: String(err && err.message || err) });
  } finally { try { lock.releaseLock(); } catch (x) {} }
}

var ACCIONES_ = {
  'cand.ver': function (r) { return vistaCandidato(porToken_(r.token)); },
  'cand.subir': function (r) {
    var rec = porToken_(r.token); exigirAbierto(rec);
    var def = docPorId(r.doc); if (!def) throw new Error('Paso no válido');
    var base = (rec.docs[r.doc].estado === 'rechazado' || r.reemplazar) ? 0 : (rec.docs[r.doc].archivos || []).length;
    var metas = asignarLados(rec, r.doc, r.archivos || []).map(function (f, i) { var m = guardarArchivo_(rec, nombreArchivo(rec, r.doc, base + i, ext_(f.nombre, f.mime), f.lado), f); if (f.lado) m.lado = f.lado; return m; });
    aplicarSubida(rec, r.doc, metas, r.datos || {}, !!r.reemplazar);
    guardar_(rec); return vistaCandidato(rec);
  },
  'cand.referimiento': function (r) {
    var rec = porToken_(r.token), a = rec.lab.referimientoArchivo; if (!a) throw new Error('Su referimiento todavía no está listo.');
    var b = DriveApp.getFileById(a.fileId).getBlob();
    return { nombre: 'Referimiento - ' + rec.nombre + '.' + ext_(a.nombre, b.getContentType()), mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
  },
  'cand.datos': function (r) { var rec = porToken_(r.token); aplicarDatos(rec, r.doc, r.datos || {}); guardar_(rec); return vistaCandidato(rec); },
  'cand.enviar': function (r) {
    var rec = porToken_(r.token); enviarExpediente(rec); guardar_(rec);
    try {
      MailApp.sendEmail(CORREO_AVISOS || Session.getEffectiveUser().getEmail(),
        'Documentos enviados completos – ' + rec.nombre + ' (' + CLIENTES[rec.cliente].nombre + ')',
        rec.nombre + ' completó su expediente para ' + rec.vacante.posicion + ' – ' + CLIENTES[rec.cliente].nombre + '.\n\nRevíselo en el panel: ' + URL_PANEL);
    } catch (x) {}
    return vistaCandidato(rec);
  },
  'admin.lista': function () { return todos_().map(resumen); },
  'admin.ver': function (r) { return porId_(r.id); },
  'admin.crear': function (r) { var rec = nuevoCandidato(r.datos || {}); guardar_(rec); return rec; },
  'admin.cambiar': function (r) { var rec = porId_(r.id); (r.cambios || []).forEach(function (c) { adminCambiar(rec, c[0], c[1]); }); guardar_(rec); return rec; },
  'admin.docEstado': function (r) { var rec = porId_(r.id); adminDocEstado(rec, r.doc, r.estado, r.nota); guardar_(rec); return rec; },
  'admin.subirLab': function (r) {
    var rec = porId_(r.id), campo = r.campo === 'resultado' ? 'resultadoArchivo' : 'referimientoArchivo';
    var nombre = (campo === 'resultadoArchivo' ? '09 - Resultado evaluación pre empleo' : 'Referimiento laboratorio') + '.' + ext_(r.archivo.nombre, r.archivo.mime);
    rec.lab[campo] = guardarArchivo_(rec, nombre, r.archivo);
    if (campo === 'referimientoArchivo' && !rec.lab.referimiento) { rec.lab.referimiento = true; rec.lab.referimientoEn = ahoraISO(); }
    registrar(rec, 'Admin subió ' + (campo === 'resultadoArchivo' ? 'resultado de laboratorio' : 'referimiento de laboratorio'));
    guardar_(rec); return rec;
  },
  'admin.subirDoc': function (r) {
    var rec = porId_(r.id), def = docPorId(r.doc); if (!def) throw new Error('Documento no válido');
    var base = (rec.docs[r.doc].archivos || []).length;
    var metas = asignarLados(rec, r.doc, r.archivos || []).map(function (f, i) { var m = guardarArchivo_(rec, nombreArchivo(rec, r.doc, base + i, ext_(f.nombre, f.mime), f.lado), f); if (f.lado) m.lado = f.lado; return m; });
    aplicarSubida(rec, r.doc, metas, {}, false, true); guardar_(rec); return rec;
  },
  'admin.archivo': function (r) {
    var f = DriveApp.getFileById(r.fileId), b = f.getBlob();
    return { nombre: f.getName(), mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
  },
  'admin.guardarExpediente': function (r) {
    var rec = porId_(r.id), carpeta = carpetaCandidato_(rec);
    var blob = Utilities.newBlob(Utilities.base64Decode(r.b64), 'application/pdf', r.nombre);
    var viejos = carpeta.getFilesByName(r.nombre); while (viejos.hasNext()) viejos.next().setTrashed(true);
    var f = carpeta.createFile(blob); registrar(rec, 'Expediente PDF guardado en Drive'); guardar_(rec);
    return { url: f.getUrl(), carpeta: carpeta.getUrl() };
  },
  'admin.carpeta': function (r) { return { url: carpetaCandidato_(porId_(r.id)).getUrl() }; }
};

/* ---------------- almacenamiento ---------------- */
function props_() { return PropertiesService.getScriptProperties(); }

function hoja_() {
  var id = props_().getProperty('SHEET_ID'), ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create('Portal Reclutamiento ATE – Base de datos');
    var sh = ss.getSheets()[0]; sh.setName('Candidatos');
    sh.appendRow(['ID', 'Token', 'Nombre', 'Cédula', 'Cliente', 'Etapa', 'Actualizado', 'Datos (no editar)']);
    sh.setFrozenRows(1);
    DriveApp.getFileById(ss.getId()).moveTo(raiz_());
    props_().setProperty('SHEET_ID', ss.getId());
  }
  return ss.getSheetByName('Candidatos');
}

function raiz_() {
  var id = props_().getProperty('ROOT_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = DriveApp.createFolder('Portal Reclutamiento ATE');
  props_().setProperty('ROOT_ID', f.getId());
  return f;
}

function sub_(padre, nombre) { var it = padre.getFoldersByName(nombre); return it.hasNext() ? it.next() : padre.createFolder(nombre); }

function carpetaCandidato_(rec) {
  if (rec.carpetaId) { try { return DriveApp.getFolderById(rec.carpetaId); } catch (e) {} }
  var c = sub_(sub_(raiz_(), CLIENTES[rec.cliente].nombre), rec.nombre + (rec.cedula ? ' – ' + rec.cedula : '') + ' – ' + rec.id);
  rec.carpetaId = c.getId();
  return c;
}

function guardarArchivo_(rec, nombre, f) {
  if (!f || !f.b64) throw new Error('Archivo vacío');
  var blob = Utilities.newBlob(Utilities.base64Decode(f.b64), f.mime || 'application/octet-stream', nombre);
  var file = carpetaCandidato_(rec).createFile(blob);
  return { fileId: file.getId(), nombre: nombre, mime: f.mime, subido: ahoraISO() };
}

function ext_(nombre, mime) {
  var m = /\.([a-z0-9]{2,5})$/i.exec(nombre || '');
  if (m) return m[1].toLowerCase();
  if (/pdf/.test(mime)) return 'pdf'; if (/png/.test(mime)) return 'png'; return 'jpg';
}

function filas_() { var sh = hoja_(), n = sh.getLastRow(); return n < 2 ? [] : sh.getRange(2, 1, n - 1, 8).getValues(); }
function todos_() { return filas_().map(function (f) { return JSON.parse(f[7]); }).sort(function (a, b) { return a.actualizado < b.actualizado ? 1 : -1; }); }

function buscarFila_(col, valor) {
  if (!valor) return -1;
  var f = filas_();
  for (var i = 0; i < f.length; i++) if (f[i][col] === valor) return i + 2;
  return -1;
}
function porId_(id) { var r = buscarFila_(0, id); if (r < 0) throw new Error('Candidato no encontrado'); return JSON.parse(hoja_().getRange(r, 8).getValue()); }
function porToken_(t) { var r = buscarFila_(1, t); if (r < 0) throw new Error('Enlace no válido o vencido. Escríbanos por WhatsApp.'); return JSON.parse(hoja_().getRange(r, 8).getValue()); }

function guardar_(rec) {
  carpetaCandidato_(rec);
  var fila = [rec.id, rec.token, rec.nombre, rec.cedula, CLIENTES[rec.cliente].nombre, etapa(rec).texto, rec.actualizado, JSON.stringify(rec)];
  var sh = hoja_(), r = buscarFila_(0, rec.id);
  if (r < 0) sh.appendRow(fila); else sh.getRange(r, 1, 1, 8).setValues([fila]);
}

function salida_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* Ejecute esta función una vez desde el editor para dar permisos y crear la carpeta y la hoja. */
function instalar() {
  hoja_(); raiz_();
  Logger.log('Listo. Carpeta: ' + raiz_().getUrl());
}
