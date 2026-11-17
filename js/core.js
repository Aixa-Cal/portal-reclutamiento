/* ============================================================
   NÚCLEO DEL PORTAL (compartido entre la web y Google Apps Script)
   Aquí se definen: clientes, documentos, etapas y reglas.
   Para agregar una empresa nueva, copie un bloque de CLIENTES.
   ============================================================ */

var EMPRESA = {
  nombre: 'Asesores Técnicos Empresariales',
  razon: 'Asesores Técnicos Empresariales, SRL',
  firmaRRHH: 'RRHH – Asesores Técnicos Empresariales, SRL',
  plazoDias: 3,
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
  { id: 'cedula', n: 4, titulo: 'Cédula de identidad (ambos lados)', tipo: 'archivo', max: 2,
    ayuda: 'Suba el frente y la parte de atrás. Puede ser un solo archivo o dos.' },
  { id: 'estudios', n: 5, titulo: 'Constancia de estudios', tipo: 'archivo', max: 3,
    ayuda: 'Título, récord de notas o certificación del centro de estudios.' },
  { id: 'conducta', n: 6, titulo: 'Carta de buena conducta', tipo: 'archivo', max: 2,
    ayuda: 'Tiene un costo de RD$800 y se saca en la Procuraduría General de la República. Puede pedirla en línea con el botón de abajo.',
    enlace: { texto: 'Solicitar en línea (PGR)', url: 'https://portal.servicios.pgr.gob.do/certificadonoantecedentespenales/visualizarcnap' } },
  { id: 'banco', n: 7, titulo: 'Constancia bancaria del Banco Popular', tipo: 'archivo', max: 2,
    ayuda: 'Debe verse su nombre y su número de cuenta.',
    noAplica: 'No tengo cuenta en el Banco Popular',
    noAplicaMsg: 'Está bien. Le orientaremos para abrirla el día de su ingreso.' },
  { id: 'ars', n: 8, titulo: 'Seguro médico (ARS)', tipo: 'archivo', max: 2,
    ayuda: 'Si tiene ARS, suba una foto de su carnet.',
    noAplica: 'No tengo ARS',
    noAplicaMsg: 'Está bien. Lo anotamos en su expediente.' },
  { id: 'laboratorio', n: 9, titulo: 'Evaluación pre empleo', tipo: 'laboratorio' },
  { id: 'referencia', n: 10, titulo: 'Contacto de su anterior supervisor', tipo: 'referencia' },
  { id: 'covid', n: 11, titulo: 'Constancia de vacunación Covid-19', tipo: 'archivo', max: 2,
    ayuda: 'Puede ser una imagen o captura de pantalla, siempre que se lea bien.' }
];

function docPorId(id) { for (var i = 0; i < DOCS.length; i++) if (DOCS[i].id === id) return DOCS[i]; return null; }

/* Prueba interna de laboratorio. NUNCA se muestra al candidato. */
function pruebaLaboratorio(sexo) { return sexo === 'F' ? 'Panel 2 + BHCG' : 'Panel 2'; }

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
    cedula: String(d.cedula || '').trim(),
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
  if (def.tipo === 'referencia') return !!(d.datos && d.datos.refs && d.datos.refs[0] && d.datos.refs[0].nombre && d.datos.refs[0].telefono);
  if (d.datos && d.datos.noAplica) return true;
  if (def.id === 'declaracion' && !(d.datos && d.datos.familiares)) return false;
  return d.archivos && d.archivos.length > 0;
}

function progreso(rec) {
  var h = 0;
  DOCS.forEach(function (doc) { if (pasoHecho(rec, doc.id)) h++; });
  return { hechos: h, total: DOCS.length, pct: Math.round(h * 100 / DOCS.length) };
}

function venceEn(rec) { return new Date(new Date(rec.creado).getTime() + EMPRESA.plazoDias * 86400000).toISOString(); }

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
  var docs = docsOk ? 'ok' : 'pendiente';
  return { docs: docs, pendientesRevision: pendientesRevision, lab: lab, referencia: ref, familiares: fam,
           listo: docs === 'ok' && lab === 'ok' && ref === 'ok' && fam === 'ok' };
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
           familiaresDeclara: rec.familiares.declara };
}

/* Lo único que ve el candidato (sin sexo, sin tipo de prueba, sin notas internas) */
function vistaCandidato(rec) {
  var docs = {};
  DOCS.forEach(function (doc) {
    var d = rec.docs[doc.id];
    docs[doc.id] = { estado: d.estado, nota: d.estado === 'rechazado' ? d.nota : '', datos: limpiarDatosCand(d.datos),
                     archivos: (d.archivos || []).map(function (a) { return { nombre: a.nombre }; }), hecho: pasoHecho(rec, doc.id) };
  });
  return { nombre: rec.nombre, cliente: rec.cliente, vacante: rec.vacante, creado: rec.creado, vence: venceEn(rec),
           enviadoEn: rec.enviadoEn, cerrado: rec.estado !== 'activo', docs: docs, progreso: progreso(rec),
           lab: { listo: !!rec.lab.referimiento, asistio: !!rec.lab.asistio, fechaAsistencia: rec.lab.fechaAsistencia } };
}
function limpiarDatosCand(d) { var o = {}; for (var k in (d || {})) if (k !== 'formulario') o[k] = d[k]; return o; }

function exigirAbierto(rec) { if (rec.estado !== 'activo') throw new Error('Este expediente ya fue cerrado. Si necesita ayuda, escríbanos por WhatsApp.'); }

function aplicarSubida(rec, docId, archivos, datos, reemplazar) {
  exigirAbierto(rec);
  var def = docPorId(docId); if (!def || def.tipo === 'laboratorio' || def.tipo === 'referencia') throw new Error('Paso no válido');
  var d = rec.docs[docId];
  if (reemplazar || d.estado === 'rechazado') d.archivos = [];
  d.archivos = d.archivos.concat(archivos);
  if (d.archivos.length > (def.max || 1)) d.archivos = d.archivos.slice(-(def.max || 1));
  d.datos = mezclar(d.datos || {}, datos || {}); delete d.datos.noAplica;
  d.estado = 'recibido'; d.nota = ''; d.actualizado = ahoraISO();
  if (docId === 'declaracion' && d.datos.familiares) { rec.familiares.declara = d.datos.familiares; rec.familiares.detalle = d.datos.familiaresDetalle || ''; }
  registrar(rec, 'Candidato subió: ' + def.titulo);
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
    if (!refs.length || !refs[0].telefono) throw new Error('Escriba el nombre y teléfono de su supervisor');
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
var RUTAS_ADMIN = /^(nombre|cedula|telefono|correo|sexo|notas|estado|vacante\.(posicion|salario|contratoMeses)|lab\.(referimiento|referimientoEn|asistio|fechaAsistencia|resultado|notas)|referencia\.(verificada|resultado|fecha|contacto|comentarios|verificadoPor|formulario)|familiares\.(verificado|conflicto|notas)|enviadoEn)$/;
function adminCambiar(rec, ruta, valor) {
  if (!RUTAS_ADMIN.test(ruta)) throw new Error('Campo no editable: ' + ruta);
  var p = ruta.split('.'), o = rec;
  for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
  o[p[p.length - 1]] = valor;
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

function nombreArchivo(rec, docId, idx, ext) {
  var def = docPorId(docId), n = def ? (def.n < 10 ? '0' + def.n : def.n) : '00';
  return n + ' - ' + (def ? (def.corto || def.titulo) : docId) + (idx > 0 ? ' (' + (idx + 1) + ')' : '') + (ext ? '.' + ext : '');
}
