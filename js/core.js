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
    firma: 'digital', // antes: 'manuscrita' (impresos y firmados a mano)
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
  },
  labarra: {
    id: 'labarra',
    nombre: 'Grupo La Barra',
    razon: 'Inversiones BA AR, S.R.L.',
    directo: true, // contratación directa (no subcontratación)
    turnos: ['Mañana · 7:00 a. m. a 3:00 p. m.', 'Tarde · 3:00 p. m. a 11:00 p. m.', 'Noche · 11:00 p. m. a 7:00 a. m.', 'Rotativo'],
    pagina: 'lb.html', // página propia: el enlace por WhatsApp muestra Grupo La Barra
    marca: { nombre: 'Grupo La Barra', razon: 'Inversiones BA AR, S.R.L.', logo: 'LB', firmaRRHH: 'RRHH – Grupo La Barra' },
    colores: { pri: '#C91017', osc: '#981017', suave: '#FFF0F0' },
    firma: 'digital',
    formDeclaracion: 'labarra',
    plantillas: {},
    docs: ['datos', 'cedula', 'foto', 'estudios', 'conducta', 'ars', 'banco', 'declaracion', 'referencia', 'laboratorio', 'induccion'],
    orden: ['datos', 'cedula', 'referencia', 'laboratorio', 'evaluacion', 'foto', 'estudios', 'conducta', 'ars', 'banco', 'declaracion', 'induccion'],
    ajustes: {
      declaracion: { titulo: 'Declaración de relaciones e información personal', corto: 'Declaración' },
      referencia: { titulo: 'Referencia laboral (último trabajo)' }
    },
    tiendas: ['La Barra Atala', 'La Barra Atalaya', 'La Barra Miraflores', 'Zona Presidente', 'Food Shop Miraflores', 'Car Wash Miraflores'],
    tiendasPopular: ['Food Shop Miraflores', 'Car Wash Miraflores', 'Zona Presidente'],
    puestos: [
      { nombre: 'Colaborador de línea', salario: '17,701.25', propina: '5,000', propinaDespues: '5,000', entrenamientoDias: 15 },
      { nombre: 'Sandwichero/a', salario: '17,701.25', propina: '5,000', propinaDespues: '7,500' },
      { nombre: 'Líder de turno', salario: '17,701.25', propina: '', propinaDespues: '' }
    ],
    vacante: { posicion: 'Colaborador de línea', salario: '17,701.25', contratoMeses: 0 },
    protocoloUrl: ''
  }
};

/* Puesto de La Barra por nombre ('Servicio al cliente' es el nombre anterior de 'Colaborador de línea') */
function puestoDe(clienteId, nombre) {
  var c = CLIENTES[clienteId] || {}, n = String(nombre || '').toLowerCase();
  if (n === 'servicio al cliente') n = 'colaborador de línea';
  return (c.puestos || []).filter(function (p) { return p.nombre.toLowerCase() === n; })[0] || null;
}
/* Salario quincenal aproximado después de AFP (2.87%) y SFS (3.04%), y del ISR si aplica (escala anual DGII). */
function numeroRD(v) { return parseFloat(String(v || '').replace(/[^0-9.]/g, '')) || 0; }
function formatoRD(n) { return 'RD$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function netoQuincenal(salario) {
  var s = numeroRD(salario); if (!s) return null;
  var tss = Math.min(s, 232230) * 0.0304 + Math.min(s, 464460) * 0.0287, anual = (s - tss) * 12, isr = 0;
  if (anual > 867123.01) isr = 79776 + (anual - 867123) * 0.25;
  else if (anual > 624329.01) isr = 31216 + (anual - 624329) * 0.20;
  else if (anual > 416220.01) isr = (anual - 416220) * 0.15;
  var neto = s - tss - isr / 12;
  return { bruto: s / 2, aportes: tss / 2, isr: isr / 24, neto: neto / 2 };
}

/* Empresa que contrata y firma los mensajes: La Barra (directo) o Asesores Técnicos (tercerización) */
function empleador(clienteId) { var c = CLIENTES[clienteId]; return (c && c.marca) ? c.marca : { nombre: EMPRESA.nombre, razon: EMPRESA.razon, logo: 'ATE', firmaRRHH: EMPRESA.firmaRRHH }; }
function bancoDeTienda(clienteId, tienda) { var c = CLIENTES[clienteId] || {}; if (!c.tiendas) return 'Banco Popular'; return (c.tiendasPopular || []).indexOf(tienda) >= 0 ? 'Banco Popular' : 'Banco BHD'; }

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
    noAplicaMsg: 'Está bien, no es obligatoria. Puede seguir con su proceso.' },
  { id: 'datos', n: 12, titulo: 'Sus datos y contactos', corto: 'Datos y contactos', tipo: 'datos' },
  { id: 'induccion', n: 13, titulo: 'Conozca La Barra (inducción)', corto: 'Inducción', tipo: 'induccion' }
];
var DOCS_BASE = ['foto', 'solicitud', 'declaracion', 'cedula', 'estudios', 'conducta', 'banco', 'ars', 'laboratorio', 'referencia', 'covid'];

/* Documentos de un expediente según su cliente (con número y textos propios de ese cliente y tienda) */
function docsDe(rec) {
  var cli = CLIENTES[rec.cliente] || {}, ids = cli.docs || DOCS_BASE;
  return ids.map(function (id, i) {
    var d = mezclar(docPorId(id), (cli.ajustes || {})[id] || {}); d.n = i + 1;
    if (id === 'banco' && cli.tiendas) {
      var b = bancoDeTienda(rec.cliente, rec.tienda);
      d.titulo = 'Constancia de cuenta · ' + b; d.corto = 'Cuenta ' + b;
      d.ayuda = 'Debe verse su nombre y su número de cuenta de ' + b + '. Nunca envíe PIN ni contraseñas.';
      d.noAplica = 'No tengo cuenta en ' + b + ': necesito abrirla';
      d.noAplicaMsg = 'Está bien. Le enviaremos aquí una carta para que abra su cuenta en ' + b + '. Cuando la abra, vuelva a este paso y suba la constancia.';
    }
    return d;
  });
}
function docDe(rec, id) { var l = docsDe(rec); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
function ordenDe(rec) {
  var cli = CLIENTES[rec.cliente] || {}, ids = docsDe(rec).map(function (d) { return d.id; });
  return (cli.orden || ORDEN_CANDIDATO).filter(function (x) { return x === 'evaluacion' ? !!(rec.evaluacion && rec.evaluacion.url) : ids.indexOf(x) >= 0; });
}

/* Orden en que el candidato ve los pasos: cédula, y luego lo que toma tiempo (referencia y laboratorio). */
var ORDEN_CANDIDATO = ['cedula', 'referencia', 'laboratorio', 'evaluacion', 'foto', 'solicitud', 'declaracion', 'estudios', 'conducta', 'banco', 'ars', 'covid'];

/* Número de paso tal como lo ve el candidato */
function numeroPaso(rec, id) { return ordenDe(rec).indexOf(id) + 1; }

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
  if (cli.tiendas && cli.tiendas.indexOf(d.tienda) < 0) throw new Error('Elija la tienda');
  if (cli.turnos && !String(d.turno || '').trim()) throw new Error('Indique el turno');
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
    tienda: String(d.tienda || '').trim(),
    turno: String(d.turno || '').trim(),
    lider: String(d.lider || '').trim(),
    liderTelefono: String(d.liderTelefono || '').trim(),
    vacante: {
      posicion: d.posicion || cli.vacante.posicion,
      salario: d.salario || cli.vacante.salario,
      contratoMeses: cli.directo ? 0 : Number(d.contratoMeses || cli.vacante.contratoMeses || 6),
      propina: String(d.propina || '').trim(),
      propinaDespues: String(d.propinaDespues || '').trim()
    },
    estado: 'activo',          // activo | listo | enviado_cliente | descartado
    enviadoEn: '',             // cuando el candidato presiona "Enviar expediente"
    docs: {},
    lab: { prueba: pruebaLaboratorio(d.sexo), referimiento: false, referimientoEn: '', referimientoArchivo: null,
           asistio: false, fechaAsistencia: '', resultado: '', resultadoArchivo: null, notas: '' },
    referencia: { verificada: false, resultado: '', fecha: '', contacto: '', comentarios: '', verificadoPor: '' },
    familiares: { declara: '', detalle: '', verificado: false, conflicto: false, notas: '' },
    cartaBancoArchivo: null,
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
  var d = rec.docs[docId], def = docDe(rec, docId) || docPorId(docId);
  if (!d || !def) return false;
  if (d.estado === 'rechazado') return false;
  if (def.tipo === 'laboratorio') return !!rec.lab.asistio;
  if (def.tipo === 'datos' || def.tipo === 'induccion') return !!(d.datos && d.datos.completo);
  if (def.tipo === 'referencia') { var r0 = d.datos && d.datos.refs && d.datos.refs[0]; if (d.datos && d.datos.primerEmpleo) return !!(r0 && r0.nombre && r0.telefono && r0.relacion); return !!(r0 && r0.nombre && r0.telefono && r0.empresa && r0.trabajaAun); }
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
  var lista = docsDe(rec);
  lista.forEach(function (doc) { if (pasoHecho(rec, doc.id)) h++; });
  return { hechos: h, total: lista.length, pct: Math.round(h * 100 / lista.length) };
}

function venceEn(rec) { return new Date(new Date(rec.creado).getTime() + (EMPRESA.plazoDias + Number(rec.plazoExtraDias || 0)) * 86400000).toISOString(); }
function cedulaVencida(rec) { return !!rec.cedulaVence && new Date(rec.cedulaVence + 'T23:59:59') < new Date(); }
function alertas(rec) {
  var a = [], ref = ((rec.docs.referencia.datos || {}).refs || [])[0] || {}, t = rec.tareas || {};
  if (cedulaVencida(rec)) a.push({ t: 'Cédula vencida', mal: true });
  if ((rec.docs.referencia.datos || {}).primerEmpleo) a.push({ t: 'Primer empleo: verificar referencia personal' });
  else if (ref.trabajaAun === 'si') a.push({ t: 'Aún trabaja con la referencia', mal: true });
  if (rec.familiares.declara === 'si') a.push({ t: 'Familiar en la empresa', mal: true });
  if ((rec.docs.ars.datos || {}).noAplica && !t.ars) a.push({ t: 'Afiliar a ARS' });
  var cliA = CLIENTES[rec.cliente] || {};
  if ((rec.docs.banco.datos || {}).noAplica && !t.banco) a.push({ t: cliA.tiendas ? (rec.cartaBancoArchivo ? 'Cuenta ' + bancoDeTienda(rec.cliente, rec.tienda) + ' en trámite' : 'Enviar carta ' + bancoDeTienda(rec.cliente, rec.tienda)) : 'Abrir cuenta Popular' });
  return a;
}

/* Revisión de depuración: lo que debe estar OK antes de enviar al cliente */
function depuracion(rec) {
  var docsOk = true, pendientesRevision = 0;
  docsDe(rec).forEach(function (doc) {
    if (doc.tipo === 'laboratorio' || doc.tipo === 'referencia' || doc.tipo === 'induccion' || doc.tipo === 'datos') return;
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
  return { id: rec.id, nombre: rec.nombre, cedula: rec.cedula, telefono: rec.telefono, cliente: rec.cliente, tienda: rec.tienda || '', turno: rec.turno || '',
           posicion: rec.vacante.posicion, creado: rec.creado, actualizado: rec.actualizado, vence: venceEn(rec),
           enviadoEn: rec.enviadoEn, estado: rec.estado, etapa: etapa(rec), progreso: p, depuracion: dep,
           familiaresDeclara: rec.familiares.declara, alertas: alertas(rec) };
}

/* Lo único que ve el candidato (sin sexo, sin tipo de prueba, sin notas internas) */
function asegurarDocs(rec) { DOCS.forEach(function (doc) { if (!rec.docs[doc.id]) rec.docs[doc.id] = { estado: 'pendiente', archivos: [], datos: {}, nota: '', actualizado: '' }; }); }

function vistaCandidato(rec) {
  asegurarDocs(rec);
  var docs = {}, defs = docsDe(rec), emp = empleador(rec.cliente);
  defs.forEach(function (doc) {
    var d = rec.docs[doc.id];
    docs[doc.id] = { estado: d.estado, nota: d.estado === 'rechazado' ? d.nota : '', datos: limpiarDatosCand(d.datos),
                     archivos: (d.archivos || []).map(function (a) { return { nombre: a.nombre, lado: a.lado || '' }; }), hecho: pasoHecho(rec, doc.id) };
  });
  return { nombre: rec.nombre, cedula: rec.cedula, telefono: rec.telefono, correo: rec.correo, cliente: rec.cliente, vacante: rec.vacante, creado: rec.creado, vence: venceEn(rec),
           tienda: rec.tienda || '', turno: rec.turno || '', lider: rec.lider || '', liderTelefono: rec.liderTelefono || '', banco: bancoDeTienda(rec.cliente, rec.tienda), empleador: emp, defs: defs, orden: ordenDe(rec),
           cartaBanco: !!rec.cartaBancoArchivo,
           enviadoEn: rec.enviadoEn, cerrado: rec.estado !== 'activo', docs: docs, progreso: progreso(rec),
           lab: { listo: !!rec.lab.referimiento, referimiento: !!rec.lab.referimientoArchivo, asistio: !!rec.lab.asistio, fechaAsistencia: rec.lab.fechaAsistencia },
           evaluacion: rec.evaluacion && rec.evaluacion.url ? { url: rec.evaluacion.url, nombre: rec.evaluacion.nombre || '', instrucciones: rec.evaluacion.instrucciones || '',
             abierta: !!rec.evaluacion.abiertaEn, completada: !!rec.evaluacion.completadaEn } : null };
}
function limpiarDatosCand(d) { var o = {}; for (var k in (d || {})) if (k !== 'formulario') o[k] = d[k]; return o; }

function exigirAbierto(rec) { if (rec.estado !== 'activo') throw new Error('Este expediente ya fue cerrado. Si necesita ayuda, escríbanos por WhatsApp.'); }

function aplicarSubida(rec, docId, archivos, datos, reemplazar, porAdmin) {
  if (!porAdmin) exigirAbierto(rec);
  asegurarDocs(rec);
  var def = docDe(rec, docId) || docPorId(docId); if (!def || ['laboratorio', 'referencia', 'datos', 'induccion'].indexOf(def.tipo) >= 0) throw new Error('Paso no válido');
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
  asegurarDocs(rec);
  var def = docDe(rec, docId) || docPorId(docId); if (!def) throw new Error('Paso no válido');
  var d = rec.docs[docId];
  if (def.tipo === 'datos') {
    var x = datos || {}, falta = [];
    [['nacimiento', 'fecha de nacimiento'], ['correo', 'correo'], ['direccion', 'dirección'], ['emergenciaNombre', 'contacto de emergencia'], ['emergenciaTelefono', 'teléfono de emergencia']].forEach(function (c) { if (!String(x[c[0]] || '').trim()) falta.push(c[1]); });
    if (x.salud !== 'si' && x.salud !== 'no') falta.push('si padece alguna enfermedad');
    if (x.salud === 'si' && !String(x.saludDetalle || '').trim()) falta.push('cuál enfermedad');
    if (!x.consentimiento) falta.push('la autorización de uso de datos');
    if (falta.length) throw new Error('Complete: ' + falta.join(', '));
    d.datos = mezclar(x, { completo: true, guardadoEn: ahoraISO() }); d.estado = 'recibido'; d.actualizado = ahoraISO();
    if (x.correo && !rec.correo) rec.correo = String(x.correo).trim();
    registrar(rec, 'Candidato completó sus datos y contactos');
    return;
  }
  if (def.tipo === 'induccion') {
    var di = d.datos || {}; di.leidos = di.leidos || [];
    if (datos.modulo && di.leidos.indexOf(datos.modulo) < 0) di.leidos.push(datos.modulo);
    if (datos.quiz) { di.quiz = { respuestas: datos.quiz.respuestas || {}, correctas: Number(datos.quiz.correctas || 0), total: Number(datos.quiz.total || 0), en: ahoraISO() }; registrar(rec, 'Candidato respondió el cuestionario de inducción: ' + di.quiz.correctas + '/' + di.quiz.total); }
    if (datos.protocolo) di.protocolo = ahoraISO();
    var modTotal = Number(datos.modulosTotal || di.modulosTotal || 0); if (modTotal) di.modulosTotal = modTotal;
    var listo = di.modulosTotal && di.leidos.length >= di.modulosTotal && di.quiz && (!datos.requiereProtocolo && !di.requiereProtocolo || di.protocolo);
    if (datos.requiereProtocolo) di.requiereProtocolo = true;
    if (listo && !di.completo) { di.completo = true; registrar(rec, 'Candidato completó la inducción'); }
    d.datos = di; d.actualizado = ahoraISO(); rec.actualizado = ahoraISO();
    return;
  }
  if (def.tipo === 'laboratorio') {
    if (!rec.lab.referimiento) throw new Error('Su evaluación todavía no está lista. Le avisaremos.');
    rec.lab.asistio = true; rec.lab.fechaAsistencia = datos.fecha || ahoraISO().slice(0, 10);
    d.estado = 'recibido'; d.actualizado = ahoraISO();
    registrar(rec, 'Candidato confirmó que se realizó la evaluación pre empleo (' + rec.lab.fechaAsistencia + ')');
    return;
  }
  if (def.tipo === 'referencia') {
    var refs = (datos.refs || []).filter(function (r) { return r && r.nombre; });
    if (datos.primerEmpleo) {
      if (!refs.length || !refs[0].telefono || !refs[0].relacion) throw new Error('Escriba el nombre, teléfono y relación de su referencia personal');
      d.datos = { primerEmpleo: true, refs: refs }; d.estado = 'recibido'; d.actualizado = ahoraISO();
      registrar(rec, 'Candidato indicó que es su primer empleo y envió referencias personales');
      return;
    }
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
  var faltan = docsDe(rec).filter(function (doc) { return doc.tipo !== 'laboratorio' && doc.tipo !== 'induccion' && !pasoHecho(rec, doc.id); });
  if (faltan.length) throw new Error('Le falta completar: ' + faltan.map(function (f) { return f.n + '. ' + (f.corto || f.titulo); }).join(', '));
  rec.enviadoEn = ahoraISO();
  registrar(rec, 'Candidato envió su expediente: "Documentos enviados completos"');
}

var ASPECTOS_REF = ['Puntualidad', 'Responsabilidad', 'Calidad del trabajo', 'Comportamiento', 'Trabajo en equipo', 'Confiabilidad', 'Servicio / trato al cliente', 'Iniciativa'];
var NIVELES_REF = ['Excelente', 'Muy bueno', 'Bueno', 'Aceptable', 'Deficiente'];

/* Cambios del administrador: rutas permitidas */
var RUTAS_ADMIN = /^(tienda|turno|lider|liderTelefono|vacante\.(propina|propinaDespues)|nombre|cedula|cedulaVence|plazoExtraDias|tareas\.(ars|banco)|telefono|correo|sexo|notas|estado|vacante\.(posicion|salario|contratoMeses)|lab\.(referimiento|referimientoEn|asistio|fechaAsistencia|resultado|notas)|evaluacion\.(url|nombre|instrucciones|resultado|nota|abiertaEn|completadaEn)|referencia\.(verificada|resultado|fecha|contacto|comentarios|verificadoPor|formulario)|familiares\.(verificado|conflicto|notas)|enviadoEn)$/;
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
  asegurarDocs(rec);
  var def = docDe(rec, docId) || docPorId(docId); if (!def) throw new Error('Documento no válido');
  if (['pendiente', 'recibido', 'aprobado', 'rechazado'].indexOf(estado) < 0) throw new Error('Estado no válido');
  var d = rec.docs[docId]; d.estado = estado; d.nota = nota || ''; d.actualizado = ahoraISO();
  if (estado === 'rechazado' && rec.enviadoEn) rec.enviadoEn = ''; // vuelve al candidato
  registrar(rec, (estado === 'aprobado' ? 'Aprobado: ' : estado === 'rechazado' ? 'Rechazado: ' : 'Estado ' + estado + ': ') + def.titulo + (nota ? ' — ' + nota : ''));
}

function mezclar(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

function nombreArchivo(rec, docId, idx, ext, lado) {
  var def = docDe(rec, docId) || docPorId(docId), n = def ? (def.n < 10 ? '0' + def.n : def.n) : '00';
  return n + ' - ' + (def ? (def.corto || def.titulo) : docId) + (lado ? ' - ' + lado : (idx > 0 ? ' (' + (idx + 1) + ')' : '')) + (ext ? '.' + ext : '');
}

/* Para documentos de dos lados (cédula, carnet ARS): asigna Frente / Parte de atrás si no viene indicado */
function asignarLados(rec, docId, archivos) {
  var def = docDe(rec, docId) || docPorId(docId); if (!def || !def.lados) return archivos;
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
