/* Generación de PDFs: formularios digitales y expediente completo. Requiere vendor/pdf-lib.min.js */
var AZUL = [0.07, 0.30, 0.78], GRIS = [0.42, 0.45, 0.5], NEGRO = [0.1, 0.12, 0.16], LINEA = [0.85, 0.88, 0.93];

function limpiarTxt(s) {
  s = String(s == null ? '' : s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/—/g, '-').replace(/\t/g, ' ');
  return s.replace(/[^\x0A\x20-\x7E\xA0-\xFF–•€]/g, '');
}

function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; }
async function nuevoLienzo(colorHex) {
  var L = PDFLib, doc = await L.PDFDocument.create();
  var f = await doc.embedFont(L.StandardFonts.Helvetica), fb = await doc.embedFont(L.StandardFonts.HelveticaBold);
  var W = 595.28, H = 841.89, M = 46;
  var AC = hexRgb(colorHex || EMPRESA.colores.pri);
  var z = { doc: doc, f: f, fb: fb, W: W, H: H, M: M, page: null, y: 0, pie: '', acento: AC };
  function rgb(c) { return L.rgb(c[0], c[1], c[2]); }
  z.rgb = rgb;
  z.pagina = function () {
    z.page = doc.addPage([W, H]); z.y = H - M;
    if (z.pie) z.page.drawText(limpiarTxt(z.pie), { x: M, y: 24, size: 7.5, font: f, color: rgb(GRIS) });
    return z.page;
  };
  z.espacio = function (h) { if (z.y - h < M + 14) z.pagina(); };
  z.envolver = function (txt, size, font, ancho) {
    var out = [];
    limpiarTxt(txt).split('\n').forEach(function (par) {
      var pal = par.split(' '), linea = '';
      pal.forEach(function (p) {
        var prueba = linea ? linea + ' ' + p : p;
        if (font.widthOfTextAtSize(prueba, size) > ancho && linea) { out.push(linea); linea = p; } else linea = prueba;
      });
      out.push(linea);
    });
    return out;
  };
  z.texto = function (txt, o) {
    o = o || {}; var size = o.size || 9.5, font = o.bold ? fb : f, x = o.x || M, ancho = o.ancho || (W - M - x), lh = size * 1.38;
    z.envolver(txt, size, font, ancho).forEach(function (ln) {
      z.espacio(lh); z.page.drawText(ln, { x: x, y: z.y - size, size: size, font: font, color: rgb(o.color || NEGRO) }); z.y -= lh;
    });
  };
  z.encabezado = function (titulo, sub) {
    z.pagina();
    z.page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: rgb(AC) });
    z.page.drawText(limpiarTxt(EMPRESA.nombre.toUpperCase()), { x: M, y: H - 36, size: 8, font: fb, color: rgb(AC) });
    z.y = H - 50;
    z.texto(titulo, { size: 16, bold: true });
    if (sub) z.texto(sub, { size: 9, color: GRIS });
    z.y -= 6;
  };
  z.seccion = function (t) {
    z.espacio(34); z.y -= 8;
    z.page.drawText(limpiarTxt(t.toUpperCase()), { x: M, y: z.y - 9, size: 8.5, font: fb, color: rgb(AC) });
    z.y -= 14; z.page.drawLine({ start: { x: M, y: z.y }, end: { x: W - M, y: z.y }, thickness: 0.6, color: rgb(LINEA) }); z.y -= 6;
  };
  /* filas de campos: [[etiqueta, valor], ...] en n columnas */
  z.campos = function (pares, cols) {
    cols = cols || 2; var ancho = (W - 2 * M) / cols;
    for (var i = 0; i < pares.length; i += cols) {
      var fila = pares.slice(i, i + cols), alto = 0, bloques = fila.map(function (p) {
        var ls = z.envolver(p[1] || '—', 9.5, f, ancho - 10); alto = Math.max(alto, 12 + ls.length * 12.5); return ls;
      });
      z.espacio(alto + 4);
      fila.forEach(function (p, j) {
        var x = M + j * ancho;
        z.page.drawText(limpiarTxt(p[0]), { x: x, y: z.y - 7, size: 7, font: fb, color: rgb(GRIS) });
        bloques[j].forEach(function (ln, k) { z.page.drawText(ln, { x: x, y: z.y - 19 - k * 12.5, size: 9.5, font: f, color: rgb(NEGRO) }); });
      });
      z.y -= alto + 4;
    }
  };
  z.tabla = function (cab, filas, anchos) {
    var total = W - 2 * M; anchos = anchos || cab.map(function () { return 1 / cab.length; });
    function dibujar(celdas, bold, fondo) {
      var ls = celdas.map(function (c, i) { return z.envolver(c || '', 8.5, bold ? fb : f, anchos[i] * total - 8); });
      var alto = Math.max.apply(null, ls.map(function (l) { return l.length; })) * 11 + 7;
      z.espacio(alto);
      if (fondo) z.page.drawRectangle({ x: M, y: z.y - alto, width: total, height: alto, color: rgb([0.93, 0.95, 0.99]) });
      var x = M;
      ls.forEach(function (l, i) { l.forEach(function (ln, k) { z.page.drawText(ln, { x: x + 4, y: z.y - 11 - k * 11, size: 8.5, font: bold ? fb : f, color: rgb(NEGRO) }); }); x += anchos[i] * total; });
      z.y -= alto; z.page.drawLine({ start: { x: M, y: z.y }, end: { x: W - M, y: z.y }, thickness: 0.4, color: rgb(LINEA) });
    }
    dibujar(cab, true, true);
    if (!filas.length) dibujar(['Ninguno'].concat(cab.slice(1).map(function () { return ''; })), false);
    filas.forEach(function (fl) { dibujar(fl, false); });
    z.y -= 4;
  };
  z.firma = async function (pngB64, nombre, cedula, fecha, nota) {
    z.espacio(130); z.y -= 10;
    if (pngB64) {
      var img = await doc.embedPng(b64aBytes(pngB64)), k = Math.min(200 / img.width, 70 / img.height);
      z.page.drawImage(img, { x: M, y: z.y - img.height * k, width: img.width * k, height: img.height * k }); z.y -= img.height * k;
    }
    z.page.drawLine({ start: { x: M, y: z.y - 2 }, end: { x: M + 230, y: z.y - 2 }, thickness: 0.8, color: rgb(NEGRO) }); z.y -= 6;
    z.texto((nombre || '') + (cedula ? '   ·   Cédula ' + cedula : ''), { size: 9, bold: true });
    z.texto('Firmado y aceptado digitalmente el ' + fecha, { size: 8, color: GRIS });
    if (nota) z.texto(nota, { size: 7, color: GRIS });
  };
  return z;
}

function huellaFirma(datos) {
  var s = JSON.stringify(datos), h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8).toUpperCase();
}
function fechaLarga(iso) { return new Date(iso).toLocaleString('es-DO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function siNo(v) { return v === 'si' ? 'Sí' : v === 'no' ? 'No' : (v || ''); }

/* ---------- Solicitud de empleo digital ---------- */
async function pdfSolicitud(d, cli, firma, meta) {
  var z = await nuevoLienzo(cli.colores.pri); z.pie = 'Solicitud de empleo · ' + d.nombres + ' ' + d.apellidos + ' · Código de verificación ' + meta.codigo;
  z.encabezado('Solicitud de empleo', 'Posición: ' + meta.posicion + ' · Cliente: ' + cli.razon + ' · Fecha: ' + fechaCorta(meta.fecha));
  z.seccion('Información personal');
  z.campos([['Apellidos', d.apellidos], ['Nombres', d.nombres], ['Cédula', d.cedula], ['Sexo', d.sexo], ['Fecha de nacimiento', d.nacimiento], ['Lugar de nacimiento', d.lugarNac],
    ['Nacionalidad', d.nacionalidad], ['Teléfono móvil', d.telefono], ['Estado civil', d.estadoCivil], ['Correo', d.correo], ['Nombre del cónyuge', d.conyuge], ['Teléfono del cónyuge', d.telConyuge],
    ['Número de hijos', d.hijos], ['¿Tiene algún pariente en ' + cli.nombre + '?', siNo(d.parienteCliente)], ['Dirección', d.direccion], ['¿Tiene automóvil? / Licencia', siNo(d.auto) + ' / ' + siNo(d.licencia)],
    ['Puesto que solicita', d.puesto], ['Fecha en que podría iniciar', d.inicio], ['Sueldo al que aspira', d.sueldo], ['¿Puede trabajar días feriados?', siNo(d.feriados)]], 2);
  z.seccion('Composición familiar');
  z.tabla(['Nombre', 'Parentesco', 'Ocupación'], (d.familia || []).map(function (r) { return [r.nombre, r.parentesco, r.ocupacion]; }), [0.45, 0.25, 0.3]);
  z.seccion('Educación');
  z.tabla(['Estudios', 'Desde', 'Hasta', 'Centro docente', 'Título obtenido'], (d.educacion || []).map(function (r) { return [r.nivel, r.desde, r.hasta, r.centro, r.titulo]; }), [0.18, 0.1, 0.1, 0.32, 0.3]);
  z.campos([['Idiomas', d.idiomas]], 1);
  z.seccion('Empleos anteriores');
  z.tabla(['Empresa / Teléfono', 'Jefe inmediato y cargo', 'Cargo desempeñado / Salario', 'Ingreso - Salida', 'Causa de salida'],
    (d.empleos || []).map(function (r) { return [r.empresa + (r.telefono ? ' · ' + r.telefono : ''), r.jefe, r.cargo + (r.salario ? ' · RD$' + r.salario : ''), (r.ingreso || '') + ' - ' + (r.salida || ''), r.causa]; }), [0.22, 0.2, 0.22, 0.16, 0.2]);
  z.seccion('Referencias personales');
  z.tabla(['Nombre', 'Ocupación', 'Lugar', 'Teléfono'], (d.refPersonales || []).map(function (r) { return [r.nombre, r.ocupacion, r.lugar, r.telefono]; }), [0.32, 0.24, 0.24, 0.2]);
  z.seccion('Autorización');
  z.texto('YO AUTORIZO a ' + cli.razon + ' y a ' + EMPRESA.razon + ' a inquirir cualquier persona mencionada como referencia, incluyendo récords personales, información o evaluación que la persona tenga a mi nombre. De igual forma, de ser contratado puedo ser sometido a cualquier proceso de investigación que se requiera y a las acciones que se deriven de la misma, durante el desempeño de mis funciones. CERTIFICO Y DOY FE QUE todas las informaciones que he puesto en esta solicitud son ciertas y autorizo a verificar las mismas. Así como también AUTORIZO solicitar y obtener el reporte de crédito de la base de datos de las Sociedades de Información Crediticia. Reconozco que esta autorización tiene una vigencia de dos (02) años a partir de su otorgamiento o hasta que finalice la relación jurídica, en caso de que esta se formalice.', { size: 8.5 });
  await z.firma(firma, d.nombres + ' ' + d.apellidos, d.cedula, fechaLarga(meta.fecha), 'Aceptación: marcó "Certifico que la información es verídica y acepto la autorización". Dispositivo: ' + meta.dispositivo + '. Código ' + meta.codigo + '.');
  return await z.doc.save();
}

/* ---------- Declaración de relaciones personales y comerciales digital ---------- */
async function pdfDeclaracion(d, cli, firma, meta) {
  var z = await nuevoLienzo(cli.colores.pri); z.pie = 'Declaración de relaciones · ' + d.nombre + ' · Código de verificación ' + meta.codigo;
  z.encabezado('Formulario de declaración de relaciones personales y comerciales', cli.razon + ' · ' + EMPRESA.razon + ' · Fecha: ' + fechaCorta(meta.fecha));
  z.texto('Propósito: identificar relaciones personales y comerciales del colaborador y sus familiares cercanos que puedan estar vinculadas a ' + cli.nombre + ', sus suplidores o relacionados comerciales. Esta información no se divulga públicamente; se obtiene únicamente para fines internos.', { size: 8.5, color: GRIS });
  z.seccion('1. Familiares cercanos (cónyuge/pareja, hijos, padres, hermanos, dependientes)');
  z.tabla(['Nombre', 'Cédula', 'Relación'], (d.familiares || []).map(function (r) { return [r.nombre, r.cedula, r.relacion]; }), [0.45, 0.25, 0.3]);
  z.seccion('2. ¿Tiene familiares trabajando en ' + cli.nombre + ' o para un contratista exclusivo?  Respuesta: ' + siNo(d.p2));
  if (d.p2 === 'si') z.tabla(['Nombre', 'Cédula', 'Relación', 'Área / Contratista'], (d.p2filas || []).map(function (r) { return [r.nombre, r.cedula, r.relacion, r.entidad]; }), [0.32, 0.2, 0.2, 0.28]);
  z.seccion('3. ¿Desempeña otros puestos fuera de su función (empleo, consultoría, negocio propio)?  Respuesta: ' + siNo(d.p3));
  if (d.p3 === 'si') z.tabla(['Nombre', 'Cédula', 'Entidad', 'Responsabilidad'], (d.p3filas || []).map(function (r) { return [r.nombre, r.cedula, r.entidad, r.relacion]; }), [0.3, 0.2, 0.25, 0.25]);
  z.seccion('4. ¿Usted o sus familiares cercanos controlan alguna entidad?  Respuesta: ' + siNo(d.p4));
  if (d.p4 === 'si') z.tabla(['Nombre', 'Cédula', 'Entidad', 'Relación'], (d.p4filas || []).map(function (r) { return [r.nombre, r.cedula, r.entidad, r.relacion]; }), [0.3, 0.2, 0.25, 0.25]);
  z.seccion('Declaración');
  z.texto('Certifico que la información proporcionada en este documento está completa y es verídica. Me comprometo a reportar al departamento de Recursos Humanos cualquier novedad respecto a los puntos tratados en el documento que se presente luego de la entrega del mismo.', { size: 9 });
  await z.firma(firma, d.nombre, d.cedula, fechaLarga(meta.fecha), 'Aceptación: marcó "Certifico que la información es completa y verídica". Dispositivo: ' + meta.dispositivo + '. Código ' + meta.codigo + '.');
  return await z.doc.save();
}

/* ---------- Solicitud de referencias laborales ---------- */
function dibujarReferencia(z, rec) {
  var F = rec.referencia.formulario, refs = ((rec.docs.referencia.datos || {}).refs || []);
  z.encabezado('Solicitud de referencias laborales', 'Candidato: ' + rec.nombre + (rec.cedula ? ' · Cédula ' + rec.cedula : '') + ' · ' + CLIENTES[rec.cliente].nombre);
  if (!F) {
    z.texto('Referencia pendiente de verificar. Contactos suministrados por el candidato:', { size: 9, color: GRIS });
    refs.forEach(function (r, k) { z.seccion('Supervisor ' + (k + 1)); z.campos([['Nombre', r.nombre], ['Cargo', r.cargo], ['Empresa', r.empresa], ['Teléfono', r.telefono]], 2); });
    return;
  }
  z.seccion('Datos del empleo');
  z.campos([['Empresa', F.empresa], ['Teléfono', F.telefono], ['Período laborado', F.periodo], ['Supervisor', F.supervisor], ['Posición que ocupó', F.posicion], ['Último salario', F.salario]], 3);
  z.seccion('Evaluación');
  z.tabla(['Aspecto'].concat(NIVELES_REF), ASPECTOS_REF.map(function (a) { return [a].concat(NIVELES_REF.map(function (n) { return (F.calif || {})[a] === n ? 'X' : ''; })); }), [0.34, 0.132, 0.132, 0.132, 0.132, 0.132]);
  z.campos([['Fortalezas identificadas', F.fortalezas], ['Debilidades identificadas', F.debilidades], ['Motivo de salida', F.motivo], ['¿Lo volvería a contratar?', F.recontratar]], 2);
  z.campos([['Comentarios adicionales', F.comentarios]], 1);
  z.seccion('Validación');
  z.campos([['Datos suministrados por', F.suministrado], ['Posición', F.suministradoPos], ['Fecha', F.fecha], ['Resultado', { positiva: 'Positiva', negativa: 'Negativa', no_localizable: 'No localizable' }[rec.referencia.resultado] || ''],
    ['Verificado por', (F.verificadoPor || '') + ' – ' + EMPRESA.firmaRRHH], ['Medio', 'Llamada telefónica']], 3);
}
async function pdfReferencia(rec) {
  var z = await nuevoLienzo(CLIENTES[rec.cliente].colores.pri); z.pie = 'Referencia laboral · ' + rec.nombre + ' · ' + EMPRESA.razon;
  dibujarReferencia(z, rec); return await z.doc.save();
}

/* ---------- Expediente completo para el cliente ---------- */
async function pdfExpediente(rec, traerArchivo, progresoCb) {
  var L = PDFLib, cli = CLIENTES[rec.cliente], dep = depuracion(rec);
  var z = await nuevoLienzo(cli.colores.pri); z.pie = 'Expediente · ' + rec.nombre + ' · ' + cli.nombre + ' · ' + EMPRESA.razon;
  z.encabezado('Expediente del candidato', cli.razon + ' · Subcontratación a través de ' + EMPRESA.razon);
  z.seccion('Candidato');
  z.campos([['Nombre', rec.nombre], ['Cédula', rec.cedula], ['Teléfono', rec.telefono], ['Correo', rec.correo], ['Posición', rec.vacante.posicion],
    ['Salario mensual', rec.vacante.salario ? 'RD$' + rec.vacante.salario : ''], ['Contrato', rec.vacante.contratoMeses + ' meses'], ['Fecha del expediente', fechaCorta(ahoraISO())]], 2);
  z.seccion('Depuración');
  function est(v) { return v === 'ok' ? 'Completado' : v === 'mal' ? 'Con observación' : 'Pendiente'; }
  var ref0 = ((rec.docs.referencia.datos || {}).refs || [])[0] || {};
  z.campos([['Documentos', est(dep.docs)], ['Evaluación pre empleo', rec.lab.resultado === 'apto' ? 'APTO para trabajar' : rec.lab.resultado === 'no_apto' ? 'NO APTO' : 'Pendiente'],
    ['Referencia laboral', rec.referencia.verificada ? (rec.referencia.resultado === 'negativa' ? 'Verificada – negativa' : rec.referencia.resultado === 'no_localizable' ? 'No localizable' : 'Verificada – positiva') : 'Pendiente'],
    ['Relaciones / familiares en ' + cli.nombre, rec.familiares.verificado ? (rec.familiares.conflicto ? 'Con conflicto' : rec.familiares.declara === 'si' ? 'Relación declarada – verificada sin conflicto' : 'Sin familiares en la empresa – verificado') : 'Pendiente']], 2);
  if (rec.referencia.verificada) z.campos([['Referencia', (ref0.nombre || '') + (ref0.cargo ? ', ' + ref0.cargo : '') + (ref0.empresa ? ' – ' + ref0.empresa : '') + (ref0.telefono ? ' · ' + ref0.telefono : '')],
    ['Comentarios de la referencia', rec.referencia.comentarios]], 1);
  z.seccion('Contenido');
  var lista = [];
  DOCS.forEach(function (doc) {
    var d = rec.docs[doc.id];
    if (doc.tipo === 'laboratorio') { if (rec.lab.resultadoArchivo) lista.push({ n: doc.n, t: doc.titulo + ' (resultado)', archivos: [rec.lab.resultadoArchivo] }); else lista.push({ n: doc.n, t: doc.titulo, nota: rec.lab.resultado === 'apto' ? 'Apto – resultado recibido del laboratorio' : 'Pendiente' }); return; }
    if (doc.tipo === 'referencia') { lista.push({ n: doc.n, t: doc.titulo, pagina: true }); return; }
    if (d.datos && d.datos.noAplica) { lista.push({ n: doc.n, t: doc.titulo, nota: 'No aplica – ' + doc.noAplica }); return; }
    lista.push({ n: doc.n, t: doc.titulo, archivos: ordenarLados(doc, d.archivos) });
  });
  z.tabla(['#', 'Documento', 'Observación'], lista.map(function (x) { return [String(x.n), x.t, x.nota || (x.archivos && x.archivos.length ? x.archivos.length + ' archivo(s)' : x.pagina ? 'Incluido' : 'Falta')]; }), [0.06, 0.6, 0.34]);
  z.y -= 8; z.texto('Preparado por ' + EMPRESA.firmaRRHH, { size: 8.5, color: GRIS });

  var total = lista.reduce(function (s, x) { return s + (x.archivos ? x.archivos.length : 0); }, 0), hechos = 0;
  for (var i = 0; i < lista.length; i++) {
    var x = lista[i];
    if (x.pagina) { dibujarReferencia(z, rec); continue; }
    for (var j = 0; j < (x.archivos || []).length; j++) {
      var a = x.archivos[j]; if (progresoCb) progresoCb(++hechos, total, x.t);
      var f = await traerArchivo(a.fileId), bytes = b64aBytes(f.b64), mime = f.mime || a.mime || '';
      try {
        if (/pdf/.test(mime)) {
          var src = await L.PDFDocument.load(bytes, { ignoreEncryption: true });
          var pags = await z.doc.copyPages(src, src.getPageIndices()); pags.forEach(function (p) { z.doc.addPage(p); });
        } else {
          var img = /png/.test(mime) ? await z.doc.embedPng(bytes) : await z.doc.embedJpg(bytes);
          var pg = z.doc.addPage([z.W, z.H]), maxW = z.W - 2 * z.M, maxH = z.H - 2 * z.M - 30, k2 = Math.min(maxW / img.width, maxH / img.height, 1.6);
          if (x.n === 1) k2 = Math.min(k2, 200 / img.width);
          pg.drawText(limpiarTxt(x.n + '. ' + x.t), { x: z.M, y: z.H - z.M + 6, size: 10, font: z.fb, color: z.rgb(z.acento) });
          pg.drawImage(img, { x: (z.W - img.width * k2) / 2, y: z.H - z.M - 20 - img.height * k2, width: img.width * k2, height: img.height * k2 });
        }
      } catch (err) {
        var pe = z.doc.addPage([z.W, z.H]); pe.drawText(limpiarTxt('No se pudo incluir: ' + a.nombre + ' (' + err.message + ')'), { x: z.M, y: z.H - 80, size: 10, font: z.f });
      }
    }
  }
  return await z.doc.save();
}
