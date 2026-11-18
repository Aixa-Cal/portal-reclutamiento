/* ARCHIVO GENERADO: copie TODO este contenido en Code.gs de Google Apps Script */
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
  'cand.evaluacion': function (r) { var rec = porToken_(r.token); aplicarEvaluacion(rec, r.accion); guardar_(rec); return vistaCandidato(rec); },
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
  'admin.subirRRHH': function (r) {
    var rec = porId_(r.id); if (!TIPOS_RRHH[r.tipo]) throw new Error('Tipo no válido');
    var base = ((rec.rrhh || {})[r.tipo] || []).length;
    var metas = (r.archivos || []).map(function (f, i) { return guardarArchivo_(rec, nombreRRHH(rec, r.tipo, base + i, ext_(f.nombre, f.mime)), f); });
    aplicarRRHH(rec, r.tipo, metas); guardar_(rec); return rec;
  },
  'admin.quitarRRHH': function (r) { var rec = porId_(r.id); quitarRRHH(rec, r.tipo, r.fileId); guardar_(rec); return rec; },
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

/* ======= NÚCLEO COMPARTIDO (js/core.js) ======= */
/* ============================================================
   NÚCLEO DEL PORTAL (compartido entre la web y Google Apps Script)
   Aquí se definen: clientes, documentos, etapas y reglas.
   Para agregar una empresa nueva, copie un bloque de CLIENTES.
   ============================================================ */

var EMPRESA = {
  nombre: 'Asesores Técnicos Empresariales',
  razon: 'Asesores Técnicos Empresariales, SRL',
  firmaRRHH: 'RRHH – Asesores Técnicos Empresariales, SRL',
  plazoDias: 2,
  colores: { pri: '#1350D6', osc: '#0B3AA8', suave: '#EAF1FF' }
};

var CLIENTES = {
  altice: {
    id: 'altice',
    nombre: 'Altice Dominicana',
    razon: 'Altice Dominicana, S.A.',
    colores: { pri: '#028BFF', osc: '#0070D1', suave: '#E6F3FF' },
    firma: 'manuscrita', // documentos impresos y firmados a mano
    plantillas: {
      solicitud: 'formularios/altice-solicitud-empleo.pdf',
      declaracion: 'formularios/altice-declaracion-relaciones.pdf'
    },
    vacante: { posicion: 'Host de Servicio al Cliente', salario: '13,744.80', contratoMeses: 6 }
  },
  crecer: {
    id: 'crecer',
    nombre: 'Seguros Crecer',
    razon: 'Seguros Crecer',
    colores: { pri: '#01AC66', osc: '#018A52', suave: '#E6F7EF' },
    firma: 'digital', // formulario en línea con firma y aceptación digital
    plantillas: {},
    vacante: { posicion: '', salario: '', contratoMeses: 6 }
  }
};

var DOCS = [
  { id: 'foto', n: 1, titulo: 'Foto 2x2 con fondo blanco', tipo: 'archivo', max: 1, soloImagen: true,
    ayuda: 'Foto de frente, con fondo blanco. Sin gorra ni lentes oscuros.' },
  { id: 'solicitud', n: 2, titulo: 'Solicitud de empleo', tipo: 'formulario', max: 3 },
  { id: 'declaracion', n: 3, titulo: 'Formulario de declaración de relaciones personales y comerciales', corto: 'Formulario de conocimiento', tipo: 'formulario', max: 3 },
  { id: 'cedula', n: 4, titulo: 'Cédula de identidad (ambos lados)', tipo: 'archivo', max: 2, lados: ['Frente', 'Parte de atrás'],
    ayuda: 'Suba una foto de cada lado. Que se lea bien y se vean las 4 esquinas.' },
  { id: 'estudios', n: 5, titulo: 'Constancia de estudios', tipo: 'archivo', max: 3,
    ayuda: 'Título, récord de notas o certificación del centro de estudios.' },
  { id: 'conducta', n: 6, titulo: 'Carta de buena conducta', tipo: 'archivo', max: 2,
    ayuda: 'Tiene un costo de RD$800 y se saca en la Procuraduría General de la República. Puede pedirla en línea con el botón de abajo.',
    enlace: { texto: 'Solicitar en línea (PGR)', url: 'https://portal.servicios.pgr.gob.do/certificadonoantecedentespenales/visualizarcnap' } },
  { id: 'banco', n: 7, titulo: 'Constancia bancaria del Banco Popular', tipo: 'archivo', max: 2,
    ayuda: 'Debe verse su nombre y su número de cuenta.',
    noAplica: 'No tengo cuenta en el Banco Popular',
    noAplicaMsg: 'Está bien. Le orientaremos para abrirla el día de su ingreso.' },
  { id: 'ars', n: 8, titulo: 'Seguro médico (ARS)', tipo: 'archivo', max: 2, lados: ['Frente', 'Parte de atrás'],
    ayuda: 'Si tiene ARS, suba una foto de cada lado de su carnet.',
    noAplica: 'No tengo ARS',
    noAplicaMsg: 'No se preocupe. Nosotros le haremos la solicitud de afiliación a una ARS cuando ingrese.' },
  { id: 'laboratorio', n: 9, titulo: 'Evaluación pre empleo', tipo: 'laboratorio' },
  { id: 'referencia', n: 10, titulo: 'Contacto de su anterior supervisor', tipo: 'referencia' },
  { id: 'covid', n: 11, titulo: 'Constancia de vacunación Covid-19 (opcional)', corto: 'Vacuna Covid-19', tipo: 'archivo', max: 2,
    ayuda: 'No es obligatoria. Si la tiene, súbala: puede ser una foto de la tarjeta o una captura legible. Si la perdió, puede ver su certificado digital en la página del Gobierno con su cédula.',
    enlace: { texto: 'Ver mi certificado digital (Vacúnate RD)', url: 'https://vacunate.gob.do' },
    noAplica: 'No la tengo',
    noAplicaMsg: 'Está bien, no es obligatoria. Puede seguir con su proceso.' }
];

/* Orden en que el candidato ve los pasos: cédula, y luego lo que toma tiempo (referencia y laboratorio). */
var ORDEN_CANDIDATO = ['cedula', 'referencia', 'laboratorio', 'evaluacion', 'foto', 'solicitud', 'declaracion', 'estudios', 'conducta', 'banco', 'ars', 'covid'];

/* Número de paso tal como lo ve el candidato */
function numeroPaso(rec, id) {
  var orden = ORDEN_CANDIDATO.filter(function (x) { return x !== 'evaluacion' || (rec.evaluacion && rec.evaluacion.url); });
  return orden.indexOf(id) + 1;
}

function docPorId(id) { for (var i = 0; i < DOCS.length; i++) if (DOCS[i].id === id) return DOCS[i]; return null; }

/* Prueba interna de laboratorio. NUNCA se muestra al candidato. */
function pruebaLaboratorio(sexo) { return sexo === 'F' ? 'Panel 2 + BHCG' : 'Panel 2'; }

function formatoCedula(c) { var d = String(c || '').replace(/\D/g, ''); return d.length === 11 ? d.slice(0, 3) + '-' + d.slice(3, 10) + '-' + d.slice(10) : String(c || '').trim(); }

function ahoraISO() { return new Date().toISOString(); }

function generarToken(n) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', s = '';
  for (var i = 0; i < (n || 24); i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
  return s;
}

function nuevoCandidato(d) {
  var cli = CLIENTES[d.cliente];
  if (!cli) throw new Error('Cliente no válido');
  if (!d.nombre) throw new Error('Falta el nombre');
  if (d.sexo !== 'F' && d.sexo !== 'M') throw new Error('Indique el sexo (uso interno)');
  var rec = {
    id: 'C' + Date.now().toString(36).toUpperCase() + generarToken(3).toUpperCase(),
    token: generarToken(28),
    creado: ahoraISO(),
    actualizado: ahoraISO(),
    cliente: d.cliente,
    nombre: String(d.nombre).trim(),
    cedula: formatoCedula(d.cedula),
    cedulaVence: String(d.cedulaVence || '').trim(),
    plazoExtraDias: 0,
    tareas: { ars: false, banco: false },
    telefono: String(d.telefono || '').trim(),
    correo: String(d.correo || '').trim(),
    sexo: d.sexo,
    vacante: {
      posicion: d.posicion || cli.vacante.posicion,
      salario: d.salario || cli.vacante.salario,
      contratoMeses: Number(d.contratoMeses || cli.vacante.contratoMeses || 6)
    },
    estado: 'activo',          // activo | listo | enviado_cliente | descartado
    enviadoEn: '',             // cuando el candidato presiona "Enviar expediente"
    docs: {},
    lab: { prueba: pruebaLaboratorio(d.sexo), referimiento: false, referimientoEn: '', referimientoArchivo: null,
           asistio: false, fechaAsistencia: '', resultado: '', resultadoArchivo: null, notas: '' },
    referencia: { verificada: false, resultado: '', fecha: '', contacto: '', comentarios: '', verificadoPor: '' },
    familiares: { declara: '', detalle: '', verificado: false, conflicto: false, notas: '' },
    evaluacion: d.evaluacionUrl ? { url: String(d.evaluacionUrl).trim(), nombre: String(d.evaluacionNombre || '').trim() } : {},
    notas: '',
    historial: []
  };
  DOCS.forEach(function (doc) { rec.docs[doc.id] = { estado: 'pendiente', archivos: [], datos: {}, nota: '', actualizado: '' }; });
  registrar(rec, 'Candidato creado y enlace generado');
  return rec;
}

function registrar(rec, msg) {
  rec.historial = rec.historial || [];
  rec.historial.push({ t: ahoraISO(), msg: msg });
  rec.actualizado = ahoraISO();
}

/* ¿El candidato ya hizo su parte en este paso? */
function pasoHecho(rec, docId) {
  var d = rec.docs[docId], def = docPorId(docId);
  if (!d || !def) return false;
  if (d.estado === 'rechazado') return false;
  if (def.tipo === 'laboratorio') return !!rec.lab.asistio;
  if (def.tipo === 'referencia') { var r0 = d.datos && d.datos.refs && d.datos.refs[0]; return !!(r0 && r0.nombre && r0.telefono && r0.empresa && r0.trabajaAun); }
  if (d.datos && d.datos.noAplica) return true;
  if (def.id === 'declaracion' && !(d.datos && d.datos.familiares)) return false;
  if (def.lados && d.estado !== 'aprobado') {
    var ls = (d.archivos || []).map(function (a) { return a.lado; });
    return def.lados.every(function (l) { return ls.indexOf(l) >= 0; }) || (d.archivos || []).some(function (a) { return /pdf/.test(a.mime || ''); });
  }
  return d.archivos && d.archivos.length > 0;
}

function progreso(rec) {
  var h = 0;
  DOCS.forEach(function (doc) { if (pasoHecho(rec, doc.id)) h++; });
  return { hechos: h, total: DOCS.length, pct: Math.round(h * 100 / DOCS.length) };
}

function venceEn(rec) { return new Date(new Date(rec.creado).getTime() + (EMPRESA.plazoDias + Number(rec.plazoExtraDias || 0)) * 86400000).toISOString(); }
function cedulaVencida(rec) { return !!rec.cedulaVence && new Date(rec.cedulaVence + 'T23:59:59') < new Date(); }
function alertas(rec) {
  var a = [], ref = ((rec.docs.referencia.datos || {}).refs || [])[0] || {}, t = rec.tareas || {};
  if (cedulaVencida(rec)) a.push({ t: 'Cédula vencida', mal: true });
  if (ref.trabajaAun === 'si') a.push({ t: 'Aún trabaja con la referencia', mal: true });
  if (rec.familiares.declara === 'si') a.push({ t: 'Familiar en la empresa', mal: true });
  if ((rec.docs.ars.datos || {}).noAplica && !t.ars) a.push({ t: 'Afiliar a ARS' });
  if ((rec.docs.banco.datos || {}).noAplica && !t.banco) a.push({ t: 'Abrir cuenta Popular' });
  return a;
}

/* Revisión de depuración: lo que debe estar OK antes de enviar al cliente */
function depuracion(rec) {
  var docsOk = true, pendientesRevision = 0;
  DOCS.forEach(function (doc) {
    if (doc.tipo === 'laboratorio' || doc.tipo === 'referencia') return;
    var d = rec.docs[doc.id];
    if (d.datos && d.datos.noAplica) return;
    if (d.estado !== 'aprobado') { docsOk = false; if (d.estado === 'recibido') pendientesRevision++; }
  });
  var lab = rec.lab.resultado === 'apto' ? 'ok' : (rec.lab.resultado === 'no_apto' ? 'mal' : 'pendiente');
  var ref = rec.referencia.verificada ? (rec.referencia.resultado === 'negativa' ? 'mal' : 'ok') : 'pendiente';
  var fam = rec.familiares.verificado ? (rec.familiares.conflicto ? 'mal' : 'ok') : 'pendiente';
  var docs = docsOk ? 'ok' : 'pendiente', ev = rec.evaluacion || {};
  var eva = !ev.url ? 'na' : ev.completadaEn ? 'ok' : 'pendiente'; // constancia de conocimientos: sin nota
  return { docs: docs, pendientesRevision: pendientesRevision, lab: lab, referencia: ref, familiares: fam, evaluacion: eva,
           listo: docs === 'ok' && lab === 'ok' && ref === 'ok' && fam === 'ok' && (eva === 'ok' || eva === 'na') };
}

function etapa(rec) {
  if (rec.estado === 'descartado') return { clave: 'descartado', texto: 'Descartado' };
  if (rec.estado === 'enviado_cliente') return { clave: 'enviado_cliente', texto: 'Enviado al cliente' };
  if (rec.estado === 'listo') return { clave: 'listo', texto: 'Expediente listo' };
  if (rec.enviadoEn) return { clave: 'depuracion', texto: 'En depuración' };
  var p = progreso(rec);
  if (p.hechos === 0) return { clave: 'enlace', texto: 'Enlace enviado' };
  return { clave: 'completando', texto: 'Completando ' + p.hechos + '/' + p.total };
}

function resumen(rec) {
  var p = progreso(rec), dep = depuracion(rec);
  return { id: rec.id, nombre: rec.nombre, cedula: rec.cedula, telefono: rec.telefono, cliente: rec.cliente,
           posicion: rec.vacante.posicion, creado: rec.creado, actualizado: rec.actualizado, vence: venceEn(rec),
           enviadoEn: rec.enviadoEn, estado: rec.estado, etapa: etapa(rec), progreso: p, depuracion: dep,
           familiaresDeclara: rec.familiares.declara, alertas: alertas(rec) };
}

/* Lo único que ve el candidato (sin sexo, sin tipo de prueba, sin notas internas) */
function vistaCandidato(rec) {
  var docs = {};
  DOCS.forEach(function (doc) {
    var d = rec.docs[doc.id];
    docs[doc.id] = { estado: d.estado, nota: d.estado === 'rechazado' ? d.nota : '', datos: limpiarDatosCand(d.datos),
                     archivos: (d.archivos || []).map(function (a) { return { nombre: a.nombre, lado: a.lado || '' }; }), hecho: pasoHecho(rec, doc.id) };
  });
  return { nombre: rec.nombre, cedula: rec.cedula, telefono: rec.telefono, correo: rec.correo, cliente: rec.cliente, vacante: rec.vacante, creado: rec.creado, vence: venceEn(rec),
           enviadoEn: rec.enviadoEn, cerrado: rec.estado !== 'activo', docs: docs, progreso: progreso(rec),
           lab: { listo: !!rec.lab.referimiento, referimiento: !!rec.lab.referimientoArchivo, asistio: !!rec.lab.asistio, fechaAsistencia: rec.lab.fechaAsistencia },
           evaluacion: rec.evaluacion && rec.evaluacion.url ? { url: rec.evaluacion.url, nombre: rec.evaluacion.nombre || '', instrucciones: rec.evaluacion.instrucciones || '',
             abierta: !!rec.evaluacion.abiertaEn, completada: !!rec.evaluacion.completadaEn } : null };
}
function limpiarDatosCand(d) { var o = {}; for (var k in (d || {})) if (k !== 'formulario') o[k] = d[k]; return o; }

function exigirAbierto(rec) { if (rec.estado !== 'activo') throw new Error('Este expediente ya fue cerrado. Si necesita ayuda, escríbanos por WhatsApp.'); }

function aplicarSubida(rec, docId, archivos, datos, reemplazar, porAdmin) {
  if (!porAdmin) exigirAbierto(rec);
  var def = docPorId(docId); if (!def || def.tipo === 'laboratorio' || def.tipo === 'referencia') throw new Error('Paso no válido');
  var d = rec.docs[docId];
  if (def.lados && archivos.length && archivos[0].lado) {
    var nuevos = archivos.map(function (a) { return a.lado; });
    d.archivos = (reemplazar ? [] : d.archivos).filter(function (a) { return nuevos.indexOf(a.lado) < 0; }).concat(archivos);
  } else {
    if (reemplazar || d.estado === 'rechazado') d.archivos = [];
    d.archivos = d.archivos.concat(archivos);
  }
  if (d.archivos.length > (def.max || 1)) d.archivos = d.archivos.slice(-(def.max || 1));
  d.datos = mezclar(d.datos || {}, datos || {}); delete d.datos.noAplica;
  d.estado = porAdmin ? 'aprobado' : 'recibido'; d.nota = ''; d.actualizado = ahoraISO();
  if (docId === 'declaracion' && d.datos.familiares) { rec.familiares.declara = d.datos.familiares; rec.familiares.detalle = d.datos.familiaresDetalle || ''; }
  registrar(rec, (porAdmin ? 'RRHH subió: ' : 'Candidato subió: ') + def.titulo);
}

function aplicarDatos(rec, docId, datos) {
  exigirAbierto(rec);
  var def = docPorId(docId); if (!def) throw new Error('Paso no válido');
  var d = rec.docs[docId];
  if (def.tipo === 'laboratorio') {
    if (!rec.lab.referimiento) throw new Error('Su evaluación todavía no está lista. Le avisaremos.');
    rec.lab.asistio = true; rec.lab.fechaAsistencia = datos.fecha || ahoraISO().slice(0, 10);
    d.estado = 'recibido'; d.actualizado = ahoraISO();
    registrar(rec, 'Candidato confirmó que se realizó la evaluación pre empleo (' + rec.lab.fechaAsistencia + ')');
    return;
  }
  if (def.tipo === 'referencia') {
    var refs = (datos.refs || []).filter(function (r) { return r && r.nombre; });
    if (!refs.length || !refs[0].telefono || !refs[0].empresa) throw new Error('Escriba el nombre, teléfono y empresa de su supervisor');
    if (!refs[0].trabajaAun) throw new Error('Indique si todavía trabaja en esa empresa');
    d.datos = { refs: refs }; d.estado = 'recibido'; d.actualizado = ahoraISO();
    registrar(rec, 'Candidato envió contacto de referencia laboral');
    return;
  }
  if (datos.noAplica) {
    if (!def.noAplica) throw new Error('Este documento es obligatorio');
    d.datos = { noAplica: true }; d.archivos = []; d.estado = 'recibido'; d.actualizado = ahoraISO();
    registrar(rec, 'Candidato indicó: ' + def.noAplica);
    return;
  }
  d.datos = mezclar(d.datos || {}, datos);
  if (docId === 'declaracion' && d.datos.familiares) { rec.familiares.declara = d.datos.familiares; rec.familiares.detalle = d.datos.familiaresDetalle || ''; }
  d.actualizado = ahoraISO(); rec.actualizado = ahoraISO();
}

function aplicarEvaluacion(rec, accion) {
  exigirAbierto(rec);
  var ev = rec.evaluacion || {}; if (!ev.url) throw new Error('No tiene evaluación asignada.');
  if (accion === 'abrir') { if (!ev.abiertaEn) { ev.abiertaEn = ahoraISO(); registrar(rec, 'Candidato abrió la evaluación del puesto'); } }
  else if (accion === 'completar') { ev.completadaEn = ahoraISO(); registrar(rec, 'Candidato indicó que completó la evaluación del puesto'); }
  else throw new Error('Acción no válida');
  rec.evaluacion = ev; rec.actualizado = ahoraISO();
}

/* Archivos de RRHH (CV y reportes de evaluación): solo los ve RRHH y van en el expediente */
var TIPOS_RRHH = { cv: { n: 0, titulo: 'Currículum (CV)' }, reportes: { n: 12, titulo: 'Reportes de evaluación' } };
function aplicarRRHH(rec, tipo, metas) {
  if (!TIPOS_RRHH[tipo]) throw new Error('Tipo no válido');
  rec.rrhh = rec.rrhh || {}; rec.rrhh[tipo] = (rec.rrhh[tipo] || []).concat(metas);
  registrar(rec, 'RRHH subió: ' + TIPOS_RRHH[tipo].titulo + ' (' + metas.length + ')');
}
function quitarRRHH(rec, tipo, fileId) {
  rec.rrhh = rec.rrhh || {}; var antes = (rec.rrhh[tipo] || []).length;
  rec.rrhh[tipo] = (rec.rrhh[tipo] || []).filter(function (a) { return a.fileId !== fileId; });
  if (rec.rrhh[tipo].length !== antes) registrar(rec, 'RRHH quitó un archivo de ' + TIPOS_RRHH[tipo].titulo + ' (sigue en Drive)');
}
function nombreRRHH(rec, tipo, idx, ext) {
  var t = TIPOS_RRHH[tipo], n = t.n < 10 ? '0' + t.n : String(t.n);
  return n + ' - ' + t.titulo + ' - ' + rec.nombre + (idx > 0 ? ' (' + (idx + 1) + ')' : '') + (ext ? '.' + ext : '');
}

function enviarExpediente(rec) {
  exigirAbierto(rec);
  var faltan = DOCS.filter(function (doc) { return doc.tipo !== 'laboratorio' && !pasoHecho(rec, doc.id); });
  if (faltan.length) throw new Error('Le falta completar: ' + faltan.map(function (f) { return f.n + '. ' + (f.corto || f.titulo); }).join(', '));
  rec.enviadoEn = ahoraISO();
  registrar(rec, 'Candidato envió su expediente: "Documentos enviados completos"');
}

/* Cambios del administrador: rutas permitidas */
var ASPECTOS_REF = ['Puntualidad', 'Responsabilidad', 'Calidad del trabajo', 'Comportamiento', 'Trabajo en equipo', 'Confiabilidad', 'Servicio / trato al cliente', 'Iniciativa'];
var NIVELES_REF = ['Excelente', 'Muy bueno', 'Bueno', 'Aceptable', 'Deficiente'];

/* Cambios del administrador: rutas permitidas */
var RUTAS_ADMIN = /^(nombre|cedula|cedulaVence|plazoExtraDias|tareas\.(ars|banco)|telefono|correo|sexo|notas|estado|vacante\.(posicion|salario|contratoMeses)|lab\.(referimiento|referimientoEn|asistio|fechaAsistencia|resultado|notas)|evaluacion\.(url|nombre|instrucciones|resultado|nota|abiertaEn|completadaEn)|referencia\.(verificada|resultado|fecha|contacto|comentarios|verificadoPor|formulario)|familiares\.(verificado|conflicto|notas)|enviadoEn)$/;
function adminCambiar(rec, ruta, valor) {
  if (!RUTAS_ADMIN.test(ruta)) throw new Error('Campo no editable: ' + ruta);
  var p = ruta.split('.'), o = rec;
  for (var i = 0; i < p.length - 1; i++) { if (o[p[i]] == null) o[p[i]] = {}; o = o[p[i]]; }
  o[p[p.length - 1]] = valor;
  if (ruta === 'cedula') rec.cedula = formatoCedula(valor);
  if (ruta === 'sexo') rec.lab.prueba = pruebaLaboratorio(valor);
  if (ruta === 'lab.referimiento' && valor) rec.lab.referimientoEn = ahoraISO();
  registrar(rec, 'Admin actualizó ' + ruta + (typeof valor === 'boolean' ? (valor ? ' ✓' : ' ✗') : (ruta === 'notas' ? '' : ': ' + String(valor).slice(0, 60))));
}

function adminDocEstado(rec, docId, estado, nota) {
  var def = docPorId(docId); if (!def) throw new Error('Documento no válido');
  if (['pendiente', 'recibido', 'aprobado', 'rechazado'].indexOf(estado) < 0) throw new Error('Estado no válido');
  var d = rec.docs[docId]; d.estado = estado; d.nota = nota || ''; d.actualizado = ahoraISO();
  if (estado === 'rechazado' && rec.enviadoEn) rec.enviadoEn = ''; // vuelve al candidato
  registrar(rec, (estado === 'aprobado' ? 'Aprobado: ' : estado === 'rechazado' ? 'Rechazado: ' : 'Estado ' + estado + ': ') + def.titulo + (nota ? ' — ' + nota : ''));
}

function mezclar(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

function nombreArchivo(rec, docId, idx, ext, lado) {
  var def = docPorId(docId), n = def ? (def.n < 10 ? '0' + def.n : def.n) : '00';
  return n + ' - ' + (def ? (def.corto || def.titulo) : docId) + (lado ? ' - ' + lado : (idx > 0 ? ' (' + (idx + 1) + ')' : '')) + (ext ? '.' + ext : '');
}

/* Para documentos de dos lados (cédula, carnet ARS): asigna Frente / Parte de atrás si no viene indicado */
function asignarLados(rec, docId, archivos) {
  var def = docPorId(docId); if (!def || !def.lados) return archivos;
  var usados = (rec.docs[docId].archivos || []).map(function (a) { return a.lado; });
  return (archivos || []).map(function (f) {
    if (!f.lado || def.lados.indexOf(f.lado) < 0) { f.lado = def.lados.filter(function (l) { return usados.indexOf(l) < 0; })[0] || def.lados[def.lados.length - 1]; }
    usados.push(f.lado); return f;
  });
}
function ordenarLados(def, archivos) {
  if (!def || !def.lados) return archivos || [];
  return (archivos || []).slice().sort(function (a, b) { return def.lados.indexOf(a.lado) - def.lados.indexOf(b.lado); });
}
