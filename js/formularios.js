/* Formularios digitales (firma moderna) y piezas reutilizables */

function inp(name, label, o) {
  o = o || {}; if (o.val == null && window.PREFILL && PREFILL[name]) o.val = PREFILL[name];
  var attrs = 'name="' + name + '" ' + (o.type ? 'type="' + o.type + '" ' : '') + (o.ph ? 'placeholder="' + esc(o.ph) + '" ' : '') + (o.req ? 'data-req="1" ' : '') + (o.val ? 'value="' + esc(o.val) + '" ' : '');
  var ctl = o.options ? '<select ' + attrs + '><option value="">Seleccione…</option>' + o.options.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>' : '<input ' + attrs + '>';
  return '<div class="campo"><label>' + esc(label) + (o.req ? ' *' : '') + '</label>' + ctl + '</div>';
}
function radioSN(name, label, req) {
  return '<div class="campo"><label>' + esc(label) + (req ? ' *' : '') + '</label><div class="radios" data-radio="' + name + '"' + (req ? ' data-req="1"' : '') + '>' +
    '<label><input type="radio" name="' + name + '" value="si"> Sí</label><label><input type="radio" name="' + name + '" value="no"> No</label></div></div>';
}
function repetible(name, cols, opts) {
  opts = opts || {};
  return '<div class="repetible" data-name="' + name + '" data-cols=\'' + esc(JSON.stringify(cols)) + '\' data-max="' + (opts.max || 10) + '">' +
    '<div class="filas"></div><button type="button" class="btn sm" data-agregar>+ Agregar ' + esc(opts.item || 'fila') + '</button></div>';
}
function filaRep(cols) {
  var html = '<div class="fila-rep">';
  cols.forEach(function (c) {
    var ctl = c.options ? '<select data-k="' + c.k + '"><option value=""></option>' + c.options.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>'
      : '<input data-k="' + c.k + '"' + (c.type ? ' type="' + c.type + '"' : '') + ' placeholder="' + esc(c.label) + '">';
    html += '<div><label class="tiny">' + esc(c.label) + '</label>' + ctl + '</div>';
  });
  return html + '<button type="button" class="quitar" data-quitar title="Quitar">×</button></div>';
}
function activarRepetibles(root, min) {
  $$('.repetible', root).forEach(function (r) {
    var cols = JSON.parse(r.getAttribute('data-cols')), filas = $('.filas', r), max = +r.getAttribute('data-max');
    function add() { if (filas.children.length >= max) return; filas.insertAdjacentHTML('beforeend', filaRep(cols)); }
    $('[data-agregar]', r).onclick = add;
    r.addEventListener('click', function (e) { if (e.target.hasAttribute('data-quitar')) { e.target.parentNode.remove(); } });
    r._add = add;
    for (var i = 0; i < (min == null ? 1 : min); i++) add();
  });
}
function leerForm(root) {
  var o = {};
  $$('input[name],select[name],textarea[name]', root).forEach(function (el) {
    if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = ''; }
    else if (el.type === 'checkbox') o[el.name] = el.checked;
    else o[el.name] = el.value.trim();
  });
  $$('.repetible', root).forEach(function (r) {
    o[r.getAttribute('data-name')] = $$('.fila-rep', r).map(function (f) {
      var x = {}, algo = false; $$('[data-k]', f).forEach(function (el) { x[el.getAttribute('data-k')] = el.value.trim(); if (el.value.trim()) algo = true; }); return algo ? x : null;
    }).filter(Boolean);
  });
  return o;
}
function llenarForm(root, o) {
  if (!o) return;
  $$('input[name],select[name],textarea[name]', root).forEach(function (el) {
    if (!(el.name in o)) return;
    if (el.type === 'radio') el.checked = o[el.name] === el.value; else if (el.type === 'checkbox') el.checked = !!o[el.name]; else el.value = o[el.name];
  });
  $$('.repetible', root).forEach(function (r) {
    var filas = o[r.getAttribute('data-name')]; if (!filas || !filas.length) return;
    $('.filas', r).innerHTML = '';
    filas.forEach(function (x) { r._add(); var f = $('.filas', r).lastElementChild; $$('[data-k]', f).forEach(function (el) { el.value = x[el.getAttribute('data-k')] || ''; }); });
  });
  $$('[data-radio]', root).forEach(function (g) { g.dispatchEvent(new Event('change', { bubbles: true })); });
}
function validarForm(root) {
  var faltan = [];
  $$('[data-req]', root).forEach(function (el) {
    if (el.hasAttribute('data-radio')) { if (!$('input:checked', el)) { faltan.push(el.parentNode.querySelector('label').textContent.replace(' *', '')); } }
    else if (!el.value.trim()) { faltan.push(el.parentNode.querySelector('label').textContent.replace(' *', '')); el.style.borderColor = 'var(--mal)'; }
    else el.style.borderColor = '';
  });
  return faltan;
}

/* ---------- Firma ---------- */
function padFirma(box) {
  box.innerHTML = '<canvas></canvas><button type="button" class="btn sm lim">Borrar</button>';
  var c = $('canvas', box), cx, dib = false, vacia = true, ult = null;
  function ajustar() { var r = c.getBoundingClientRect(), k = window.devicePixelRatio || 1; c.width = r.width * k; c.height = r.height * k; cx = c.getContext('2d'); cx.scale(k, k); cx.lineWidth = 2.2; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#0b2a6f'; vacia = true; }
  setTimeout(ajustar, 30);
  function pos(e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  c.addEventListener('pointerdown', function (e) { dib = true; ult = pos(e); c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', function (e) { if (!dib) return; var p = pos(e); cx.beginPath(); cx.moveTo(ult.x, ult.y); cx.lineTo(p.x, p.y); cx.stroke(); ult = p; vacia = false; });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { c.addEventListener(ev, function () { dib = false; }); });
  $('.lim', box).onclick = ajustar;
  return { vacia: function () { return vacia; }, png: function () { return c.toDataURL('image/png').split(',')[1]; } };
}

function metaFirma(datos) {
  var ua = navigator.userAgent, disp = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'Navegador';
  return { fecha: ahoraISO(), dispositivo: disp, codigo: huellaFirma([datos, ahoraISO()]) };
}

/* ---------- Plantillas HTML de los formularios digitales ---------- */
function htmlSolicitud(cli, vac, nombre) {
  return '<form data-form="solicitud" autocomplete="on">' +
    '<fieldset><legend>Información personal</legend><div class="grid g2">' +
    inp('apellidos', 'Apellidos', { req: 1 }) + inp('nombres', 'Nombres', { req: 1 }) + inp('cedula', 'Cédula', { req: 1, ph: '000-0000000-0' }) +
    inp('sexo', 'Sexo', { req: 1, options: ['Femenino', 'Masculino'] }) + inp('nacimiento', 'Fecha de nacimiento', { req: 1, type: 'date' }) + inp('lugarNac', 'Lugar de nacimiento') +
    inp('nacionalidad', 'Nacionalidad', { val: 'Dominicana' }) + inp('telefono', 'Teléfono móvil', { req: 1, type: 'tel' }) +
    inp('estadoCivil', 'Estado civil', { options: ['Soltero/a', 'Casado/a', 'Unión libre', 'Divorciado/a', 'Viudo/a'] }) + inp('correo', 'Correo electrónico', { type: 'email' }) +
    inp('conyuge', 'Nombre del cónyuge') + inp('telConyuge', 'Teléfono del cónyuge', { type: 'tel' }) + inp('hijos', 'Número de hijos', { type: 'number' }) +
    radioSN('parienteCliente', '¿Tiene algún pariente en ' + cli.nombre + '?', true) + '</div>' +
    inp('direccion', 'Dirección', { req: 1 }) + '<div class="grid g3">' + radioSN('auto', '¿Tiene automóvil?') + radioSN('licencia', '¿Licencia de conducir?') + radioSN('feriados', '¿Puede trabajar días feriados?', true) + '</div>' +
    '<div class="grid g3">' + inp('puesto', 'Puesto que solicita', { val: vac.posicion }) + inp('inicio', 'Fecha en que podría iniciar', { type: 'date' }) + inp('sueldo', 'Sueldo al que aspira') + '</div></fieldset>' +
    '<fieldset><legend>Composición familiar</legend>' + repetible('familia', [{ k: 'nombre', label: 'Nombre' }, { k: 'parentesco', label: 'Parentesco' }, { k: 'ocupacion', label: 'Ocupación' }], { item: 'familiar' }) + '</fieldset>' +
    '<fieldset><legend>Educación</legend>' + repetible('educacion', [{ k: 'nivel', label: 'Estudios', options: ['Bachillerato', 'Universidad', 'Técnico / Comercial', 'Otros'] }, { k: 'centro', label: 'Centro docente' }, { k: 'titulo', label: 'Título obtenido' }, { k: 'desde', label: 'Desde (año)' }, { k: 'hasta', label: 'Hasta (año)' }], { item: 'estudio' }) +
    inp('idiomas', 'Idiomas (lee / habla / escribe)', { ph: 'Ej.: Español nativo, inglés básico' }) + '</fieldset>' +
    '<fieldset><legend>Empleos anteriores</legend>' + repetible('empleos', [{ k: 'empresa', label: 'Empresa' }, { k: 'telefono', label: 'Teléfono' }, { k: 'cargo', label: 'Cargo desempeñado' }, { k: 'salario', label: 'Último salario' }, { k: 'jefe', label: 'Jefe inmediato y cargo' }, { k: 'ingreso', label: 'Fecha de ingreso' }, { k: 'salida', label: 'Fecha de salida' }, { k: 'causa', label: 'Causa de salida' }], { item: 'empleo', max: 3 }) + '</fieldset>' +
    '<fieldset><legend>Referencias personales</legend>' + repetible('refPersonales', [{ k: 'nombre', label: 'Nombre' }, { k: 'ocupacion', label: 'Ocupación' }, { k: 'lugar', label: 'Lugar' }, { k: 'telefono', label: 'Teléfono' }], { item: 'referencia', max: 3 }) + '</fieldset>' +
    '<fieldset><legend>Autorización y firma</legend><p class="small muted">Autorizo a ' + esc(cli.razon) + ' y a ' + esc(EMPRESA.razon) + ' a verificar mis referencias, récords e informaciones, y a solicitar mi reporte de crédito. Certifico que todo lo escrito es cierto. Esta autorización dura dos (2) años.</p>' +
    '<label class="check"><input type="checkbox" name="acepto"> Certifico que la información es verídica y acepto la autorización.</label><div style="height:10px"></div><div class="firma-box"></div></fieldset>' +
    '</form>';
}

function htmlDeclaracion(cli, nombre) {
  var c4 = function (t) { return [{ k: 'nombre', label: 'Nombre' }, { k: 'cedula', label: 'Cédula' }, { k: 'relacion', label: 'Relación' }, { k: 'entidad', label: t }]; };
  return '<form data-form="declaracion">' +
    '<div class="grid g2">' + inp('nombre', 'Su nombre completo', { req: 1, val: nombre }) + inp('cedula', 'Su cédula', { req: 1 }) + '</div>' +
    '<fieldset><legend>1. Sus familiares cercanos</legend><p class="small muted">Cónyuge o pareja, hijos, padres, hermanos y personas que dependen de usted.</p>' +
    repetible('familiares', [{ k: 'nombre', label: 'Nombre' }, { k: 'cedula', label: 'Cédula' }, { k: 'relacion', label: 'Relación' }], { item: 'familiar' }) + '</fieldset>' +
    '<fieldset><legend>2. Familiares en ' + esc(cli.nombre) + '</legend>' + radioSN('p2', '¿Tiene algún familiar (abuelos, padres, hijos, hermanos, primos, tíos, sobrinos) trabajando en ' + cli.nombre + ' o para un contratista de ' + cli.nombre + '?', true) +
    '<div data-si="p2" class="hidden">' + repetible('p2filas', c4('Área o contratista'), { item: 'familiar' }) + '</div></fieldset>' +
    '<fieldset><legend>3. Otros trabajos o negocios</legend>' + radioSN('p3', '¿Trabaja en otra empresa, como consultor, o tiene negocio propio?', true) +
    '<div data-si="p3" class="hidden">' + repetible('p3filas', c4('Entidad'), { item: 'fila' }) + '</div></fieldset>' +
    '<fieldset><legend>4. Empresas</legend>' + radioSN('p4', '¿Usted o un familiar cercano es dueño o controla alguna empresa?', true) +
    '<div data-si="p4" class="hidden">' + repetible('p4filas', c4('Entidad'), { item: 'fila' }) + '</div></fieldset>' +
    '<fieldset><legend>Declaración y firma</legend><label class="check"><input type="checkbox" name="acepto"> Certifico que la información es completa y verídica, y me comprometo a informar a Recursos Humanos cualquier cambio.</label>' +
    '<div style="height:10px"></div><div class="firma-box"></div></fieldset></form>';
}

function activarSiNo(root) {
  root.addEventListener('change', function () {
    $$('[data-si]', root).forEach(function (d) { var r = $('input[name="' + d.getAttribute('data-si') + '"]:checked', root); d.classList.toggle('hidden', !(r && r.value === 'si')); });
  });
}
