/* Panel de administración RRHH */
(function () {
  var app = $('#app'), cfg = window.PORTAL_CONFIG || {}, KEY = (localStorage.getItem('ate_admin_key') || sessionStorage.getItem('ate_admin_key')) || '';
  var LISTA = [], REC = null, filtros = { cliente: '', etapa: '', q: '' };
  if (API.demo) $('#demo').classList.remove('hidden');

  function call(a, p) { return API.call(a, Object.assign({ key: KEY }, p || {})); }
  function enlace(rec) { return new URL('c.html?t=' + rec.token, location.href.split('?')[0].replace(/index\.html$/, '')).href; }
  function telWa(t) { var d = String(t || '').replace(/\D/g, ''); if (d.length === 10) d = '1' + d; return d; }
  function primer(n) { return String(n || '').split(' ')[0]; }
  function wa(rec, texto) { return 'https://wa.me/' + telWa(rec.telefono) + '?text=' + encodeURIComponent(texto); }
  function copiar(t) { navigator.clipboard.writeText(t).then(function () { toast('Copiado', 'ok'); }, function () { prompt('Copie:', t); }); }

  function msgInvitacion(rec) {
    var c = CLIENTES[rec.cliente];
    return 'Hola ' + primer(rec.nombre) + ', le saluda RRHH de ' + EMPRESA.nombre + '.\n\n' +
      'Tenemos el placer de informarle que ' + c.nombre + ' desea continuar con la fase de depuración y completación de su expediente para la posición de *' + rec.vacante.posicion + '*.\n\n' +
      'Complete sus documentos aquí, paso a paso:\n' + enlace(rec) + '\n\n' +
      'Lo primero: envíenos el contacto de su supervisor anterior (paso 1). Cuando le avisemos, vaya cuanto antes a Laboratorios Referencia para su evaluación pre empleo.\n\n' +
      'Tiene un plazo de ' + EMPRESA.plazoDias + ' días. Mientras antes lo complete, más rápido avanzamos con su posible fecha de ingreso.\n\n' + EMPRESA.firmaRRHH;
  }
  function msgRecordatorio(rec) {
    var falta = DOCS.filter(function (d) { return d.tipo !== 'laboratorio' && !pasoHecho(rec, d.id); }).map(function (d) { return '• ' + d.n + '. ' + (d.corto || d.titulo) + (rec.docs[d.id].estado === 'rechazado' ? ' (corregir: ' + rec.docs[d.id].nota + ')' : ''); });
    return 'Hola ' + primer(rec.nombre) + ', le recordamos completar su expediente para ' + CLIENTES[rec.cliente].nombre + '.\n\n' + (falta.length ? 'Le falta:\n' + falta.join('\n') + '\n\n' : '') + 'Su enlace:\n' + enlace(rec) + '\n\n' + EMPRESA.firmaRRHH;
  }
  function msgLab(rec) {
    return 'Hola ' + primer(rec.nombre) + ', ya puede ir a su evaluación pre empleo.\n\n• Vaya a Laboratorios Referencia con su cédula.\n• Diga que va de parte de ' + EMPRESA.nombre + '.\n• No tiene que pagar nada.\n\nCuando vaya, márquelo en su enlace (paso 9):\n' + enlace(rec) + '\n\n' + EMPRESA.firmaRRHH;
  }

  /* ---------------- Login ---------------- */
  function login() {
    $('#nav').classList.add('hidden'); $('#salir').classList.add('hidden');
    app.innerHTML = '<div class="card login"><h2>Entrar al panel</h2><p class="muted small">Solo para RRHH.</p><div class="campo"><label>Clave</label><input type="password" id="clave" autofocus></div><button class="btn pri block" id="entrar">Entrar</button></div>';
    async function entrar() { KEY = $('#clave').value; try { LISTA = await call('admin.lista'); localStorage.setItem('ate_admin_key', KEY); inicio(); } catch (e) { toast(e.message, 'mal'); } }
    $('#entrar').onclick = entrar; $('#clave').onkeydown = function (e) { if (e.key === 'Enter') entrar(); };
  }
  $('#salir').onclick = function () { localStorage.removeItem('ate_admin_key'); sessionStorage.removeItem('ate_admin_key'); KEY = ''; login(); };
  $$('#nav .tab').forEach(function (t) { t.onclick = function () { $$('#nav .tab').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); t.getAttribute('data-vista') === 'nuevo' ? vistaNuevo() : vistaLista(); }; });

  async function inicio() { $('#nav').classList.remove('hidden'); $('#salir').classList.remove('hidden'); vistaLista(); }

  /* ---------------- Lista ---------------- */
  async function recargar() { LISTA = await call('admin.lista'); }
  function dot(v, t) { return '<span title="' + t + '" class="pill ' + (v === 'ok' ? 'ok' : v === 'mal' ? 'mal' : 'gris') + '" style="padding:2px 7px">' + t + '</span>'; }
  function pillEtapa(e) { var m = { enlace: 'gris', completando: '', depuracion: 'pend', listo: 'ok', enviado_cliente: 'ok', descartado: 'mal' }; return '<span class="pill ' + (m[e.clave] || '') + '">' + esc(e.texto) + '</span>'; }

  async function vistaLista(sinRecargar) {
    if (!sinRecargar) { app.innerHTML = '<div class="vacio">Cargando…</div>'; try { await recargar(); } catch (e) { if (/Clave/.test(e.message)) return login(); toast(e.message, 'mal'); } }
    var ahora = new Date(), act = LISTA.filter(function (r) { return r.estado !== 'descartado' && r.estado !== 'enviado_cliente'; });
    var k = { act: act.length, comp: act.filter(function (r) { return r.etapa.clave === 'enlace' || r.etapa.clave === 'completando'; }).length,
      dep: act.filter(function (r) { return r.etapa.clave === 'depuracion'; }).length, listo: LISTA.filter(function (r) { return r.estado === 'listo'; }).length,
      venc: act.filter(function (r) { return !r.enviadoEn && r.estado === 'activo' && new Date(r.vence) < ahora; }).length };
    var filas = LISTA.filter(function (r) {
      if (filtros.cliente && r.cliente !== filtros.cliente) return false;
      if (filtros.etapa && r.etapa.clave !== filtros.etapa) return false;
      if (filtros.q && (r.nombre + ' ' + r.cedula + ' ' + r.telefono).toLowerCase().indexOf(filtros.q.toLowerCase()) < 0) return false;
      return true;
    });
    app.innerHTML = '<div class="kpis">' +
      '<div class="kpi"><b>' + k.act + '</b><span>En proceso</span></div><div class="kpi"><b>' + k.comp + '</b><span>Completando documentos</span></div>' +
      '<div class="kpi"><b>' + k.dep + '</b><span>En depuración (revisar)</span></div><div class="kpi"><b>' + k.listo + '</b><span>Expedientes listos</span></div>' +
      '<div class="kpi"><b style="color:' + (k.venc ? 'var(--mal)' : 'inherit') + '">' + k.venc + '</b><span>Plazo vencido</span></div></div>' +
      '<div class="card" style="padding:0"><div style="display:flex;gap:10px;padding:14px;flex-wrap:wrap;border-bottom:1px solid var(--linea)">' +
      '<input id="fq" placeholder="Buscar nombre, cédula o teléfono" style="max-width:300px" value="' + esc(filtros.q) + '">' +
      '<select id="fc" style="max-width:190px"><option value="">Todos los clientes</option>' + Object.keys(CLIENTES).map(function (id) { return '<option value="' + id + '"' + (filtros.cliente === id ? ' selected' : '') + '>' + esc(CLIENTES[id].nombre) + '</option>'; }).join('') + '</select>' +
      '<select id="fe" style="max-width:200px"><option value="">Todas las etapas</option>' + [['enlace', 'Enlace enviado'], ['completando', 'Completando'], ['depuracion', 'En depuración'], ['listo', 'Expediente listo'], ['enviado_cliente', 'Enviado al cliente'], ['descartado', 'Descartado']].map(function (x) { return '<option value="' + x[0] + '"' + (filtros.etapa === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
      '<div class="sp"></div><button class="btn sm" id="refrescar">↻ Actualizar</button></div>' +
      (filas.length ? '<div style="overflow:auto"><table class="lista"><thead><tr><th>Candidato</th><th>Cliente · Posición</th><th>Etapa</th><th style="width:150px">Documentos</th><th>Depuración</th><th>Plazo</th></tr></thead><tbody>' +
        filas.map(function (r) {
          var venc = !r.enviadoEn && r.estado === 'activo' && new Date(r.vence) < ahora, d = r.depuracion;
          return '<tr class="fila" data-id="' + r.id + '"><td><b>' + esc(r.nombre) + '</b><div class="tiny muted">' + esc(r.cedula || r.telefono) + '</div></td>' +
            '<td>' + chipCliente(r.cliente) + '<div class="tiny muted" style="margin-top:4px">' + esc(r.posicion) + '</div></td><td>' + pillEtapa(r.etapa) + ((r.alertas || []).map(function (x) { return ' <span class="pill ' + (x.mal ? 'mal' : 'pend') + '" style="margin-top:4px">' + esc(x.t) + '</span>'; }).join('')) + '</td>' +
            '<td><div class="tiny muted">' + r.progreso.hechos + '/' + r.progreso.total + (d.pendientesRevision ? ' · <b style="color:var(--pend)">' + d.pendientesRevision + ' por revisar</b>' : '') + '</div><div class="barra"><i style="width:' + r.progreso.pct + '%"></i></div></td>' +
            '<td style="white-space:nowrap">' + dot(d.docs, 'Docs') + ' ' + dot(d.lab, 'Lab') + ' ' + dot(d.referencia, 'Ref') + ' ' + dot(d.familiares, 'Fam') + '</td>' +
            '<td class="small">' + (r.enviadoEn ? '<span class="muted">Enviado ' + fechaCorta(r.enviadoEn) + '</span>' : '<span style="color:' + (venc ? 'var(--mal)' : 'inherit') + '">' + (venc ? 'Venció ' : 'Vence ') + fechaHora(r.vence) + '</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio">No hay candidatos todavía. Use <b>+ Nuevo candidato</b> para crear el primer enlace.</div>') + '</div>';
    $('#fq').oninput = function () { filtros.q = this.value; vistaLista(true); var i = $('#fq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    $('#fc').onchange = function () { filtros.cliente = this.value; vistaLista(true); };
    $('#fe').onchange = function () { filtros.etapa = this.value; vistaLista(true); };
    $('#refrescar').onclick = function () { vistaLista(); };
    $$('tr.fila').forEach(function (tr) { tr.onclick = function () { abrir(tr.getAttribute('data-id')); }; });
  }

  /* ---------------- Nuevo candidato ---------------- */
  function vistaNuevo() {
    var ops = Object.keys(CLIENTES).map(function (id) { return '<option value="' + id + '">' + esc(CLIENTES[id].nombre) + ' — firma ' + CLIENTES[id].firma + '</option>'; }).join('');
    app.innerHTML = '<div class="card" style="max-width:760px"><h2>Nuevo candidato</h2><p class="muted small">Se crea el expediente y un enlace único para enviárselo por WhatsApp.</p>' +
      '<div class="grid g2"><div class="campo"><label>Cliente</label><select id="n_cliente">' + ops + '</select></div><div class="campo"><label>Posición</label><input id="n_posicion"></div></div>' +
      '<div class="grid g2"><div class="campo"><label>Nombre completo *</label><input id="n_nombre"></div><div class="campo"><label>Cédula</label><input id="n_cedula" placeholder="000-0000000-0"></div>' +
      '<div class="campo"><label>Teléfono / WhatsApp *</label><input id="n_telefono" placeholder="809-000-0000"></div><div class="campo"><label>Correo</label><input id="n_correo" type="email"></div></div>' +
      '<div class="grid g3"><div class="campo"><label>Salario mensual (RD$)</label><input id="n_salario"></div><div class="campo"><label>Contrato (meses)</label><input id="n_contrato" type="number" min="1"></div>' +
      '<div class="campo"><label>Sexo · uso interno *</label><div class="radios" style="padding-top:8px"><label><input type="radio" name="n_sexo" value="F"> Femenino</label><label><input type="radio" name="n_sexo" value="M"> Masculino</label></div></div></div>' +
      '<p class="tiny muted">El sexo solo define la evaluación de laboratorio. El candidato nunca ve el tipo de prueba.</p>' +
      '<div class="grid g2"><div class="campo"><label>Cédula (foto o PDF, opcional)</label><input type="file" id="n_cedfile" accept="image/*,application/pdf" multiple></div><div class="campo"><label>Fecha de vencimiento de la cédula</label><input type="date" id="n_cedvence"></div></div>' +
      '<p class="tiny muted">Si sube la cédula aquí, el candidato ya no tiene que subirla. Se verá aquí abajo para que copie los datos.</p><div id="cedPrev"></div>' +
      '<button class="btn pri lg" id="crear">Crear y generar enlace</button></div><div id="creado"></div>';
    function prellenar() { var v = CLIENTES[$('#n_cliente').value].vacante; $('#n_posicion').value = v.posicion; $('#n_salario').value = v.salario; $('#n_contrato').value = v.contratoMeses; }
    $('#n_cliente').onchange = prellenar; prellenar();
    $('#n_cedfile').onchange = function () {
      var box = $('#cedPrev'); box.innerHTML = '';
      Array.prototype.slice.call(this.files || []).slice(0, 2).forEach(function (f) {
        var u = URL.createObjectURL(f);
        box.insertAdjacentHTML('beforeend', /pdf/.test(f.type) ? '<iframe src="' + u + '#toolbar=0&view=FitH" style="width:100%;height:420px;border:1px solid var(--linea);border-radius:12px;margin-bottom:10px"></iframe>'
          : '<img src="' + u + '" style="width:100%;max-height:420px;object-fit:contain;border:1px solid var(--linea);border-radius:12px;margin-bottom:10px;background:#fafbff">');
      });
      if (box.innerHTML) box.insertAdjacentHTML('afterbegin', '<p class="small" style="margin:6px 0"><b>Copie de la cédula:</b> nombre completo, número y fecha de expiración. Revise que no esté vencida.</p>');
    };
    $('#crear').onclick = async function () {
      var sx = $('input[name=n_sexo]:checked');
      var datos = { cliente: $('#n_cliente').value, posicion: $('#n_posicion').value.trim(), nombre: $('#n_nombre').value.trim(), cedula: $('#n_cedula').value.trim(), telefono: $('#n_telefono').value.trim(),
        correo: $('#n_correo').value.trim(), salario: $('#n_salario').value.trim(), contratoMeses: $('#n_contrato').value, sexo: sx ? sx.value : '', cedulaVence: $('#n_cedvence').value };
      if (!datos.nombre || !datos.telefono) return toast('Falta nombre o teléfono', 'mal');
      if (!datos.posicion) return toast('Escriba la posición', 'mal');
      var limpia = function (x) { return String(x || '').replace(/\D/g, ''); };
      var dup = datos.cedula && LISTA.filter(function (x) { return limpia(x.cedula) === limpia(datos.cedula); })[0];
      if (dup && !confirm('Ya existe un candidato con esa cédula (' + dup.nombre + ', ' + CLIENTES[dup.cliente].nombre + '). ¿Crear otro de todas formas?')) return;
      if (datos.cedulaVence && new Date(datos.cedulaVence + 'T23:59:59') < new Date() && !confirm('Esa cédula está VENCIDA. ¿Crear el candidato de todas formas? (pídale que la renueve)')) return;
      this.disabled = true;
      try {
        var rec = await call('admin.crear', { datos: datos });
        var cf = Array.prototype.slice.call($('#n_cedfile').files || []);
        if (cf.length) { toast('Subiendo cédula…'); var arr = []; for (var i = 0; i < cf.length && i < 2; i++) arr.push(await prepararArchivo(cf[i])); rec = await call('admin.subirDoc', { id: rec.id, doc: 'cedula', archivos: arr }); }
        $('#creado').innerHTML = '<div class="card" style="max-width:760px"><div class="aviso ok">Expediente creado para <b>' + esc(rec.nombre) + '</b>.</div>' +
          '<div class="campo"><label>Enlace del candidato</label><input readonly value="' + esc(enlace(rec)) + '"></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn ok" target="_blank" href="' + wa(rec, msgInvitacion(rec)) + '">Enviar por WhatsApp</a><button class="btn" id="cpL">Copiar enlace</button><button class="btn" id="cpM">Copiar mensaje</button><button class="btn" id="verN">Ver expediente</button><button class="btn" id="otro">+ Otro candidato</button></div></div>';
        $('#cpL').onclick = function () { copiar(enlace(rec)); }; $('#cpM').onclick = function () { copiar(msgInvitacion(rec)); };
        $('#verN').onclick = function () { abrir(rec.id); }; $('#otro').onclick = vistaNuevo;
        $('#crear').classList.add('hidden');
      } catch (e) { toast(e.message, 'mal'); this.disabled = false; }
    };
  }

  /* ---------------- Detalle ---------------- */
  async function abrir(id) {
    $('#panel').classList.remove('hidden'); $('#panelIn').innerHTML = '<div class="vacio">Cargando…</div>';
    try { REC = await call('admin.ver', { id: id }); pintarDetalle(); } catch (e) { toast(e.message, 'mal'); cerrar(); }
  }
  function cerrar() { $('#panel').classList.add('hidden'); REC = null; vistaLista(); }
  $('#panel').onclick = function (e) { if (e.target.id === 'panel') cerrar(); };

  async function cambiar(cambios, msg) { try { REC = await call('admin.cambiar', { id: REC.id, cambios: cambios }); if (msg) toast(msg, 'ok'); pintarDetalle(); } catch (e) { toast(e.message, 'mal'); } }
  async function verArchivo(fileId) {
    var w = window.open('', '_blank'); if (w) w.document.write('<p style="font-family:sans-serif">Abriendo documento…</p>');
    try { var f = await call('admin.archivo', { fileId: fileId }); var url = URL.createObjectURL(new Blob([b64aBytes(f.b64)], { type: f.mime })); if (w) w.location = url; else window.open(url); }
    catch (e) { if (w) w.close(); toast(e.message, 'mal'); }
  }

  function pintarDetalle() {
    var r = REC, c = CLIENTES[r.cliente], dep = depuracion(r), et = etapa(r), p = progreso(r);
    function sem(v, t, sub) { return '<div class="sem ' + (v === 'ok' ? 'ok' : v === 'mal' ? 'mal' : 'pend') + '"><b>' + t + '</b>' + (v === 'ok' ? 'Completo' : v === 'mal' ? 'Con observación' : 'Pendiente') + (sub ? '<div class="tiny muted">' + sub + '</div>' : '') + '</div>'; }
    var refs = ((r.docs.referencia.datos || {}).refs || []);
    var h = '<div class="panel-h" style="border-top:5px solid ' + c.colores.pri + '"><div style="flex:1;min-width:0"><h2 style="margin:0">' + esc(r.nombre) + '</h2><div class="small muted" style="margin-top:4px">' + chipCliente(r.cliente) + ' ' + esc(r.vacante.posicion) + ' · creado ' + fechaCorta(r.creado) + '</div></div>' + pillEtapa(et) + '<button class="btn sm" id="cerrar">✕</button></div><div class="panel-b">';

    // Enlace y mensajes
    h += '<div class="card"><div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:6px"><b>Avance del candidato</b><span>' + p.hechos + '/' + p.total + (r.enviadoEn ? ' · Envió completo ' + fechaHora(r.enviadoEn) : ' · Vence ' + fechaHora(venceEn(r))) + '</span></div><div class="barra"><i style="width:' + p.pct + '%"></i></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn sm" id="cpEnlace">Copiar enlace</button><a class="btn sm" target="_blank" href="' + esc(enlace(r)) + '">Abrir como candidato ↗</a>' +
      '<a class="btn sm ok" target="_blank" href="' + wa(r, msgInvitacion(r)) + '">WhatsApp: invitación</a><a class="btn sm" target="_blank" href="' + wa(r, msgRecordatorio(r)) + '">WhatsApp: recordatorio</a>' + (r.enviadoEn ? '' : '<button class="btn sm" id="extender">+2 días de plazo</button>') + '</div></div>';
    var al = alertas(r);
    if (al.length) h += '<div class="card" style="padding:14px 18px"><b class="small">Atención</b><div class="archivos">' + al.map(function (x) { return '<span class="pill ' + (x.mal ? 'mal' : 'pend') + '">' + esc(x.t) + '</span>'; }).join('') + '</div>' +
      (cedulaVencida(r) ? '<p class="small" style="margin:6px 0 0">La cédula venció el ' + esc(r.cedulaVence) + '. Pida una cédula vigente antes de enviar el expediente.</p>' : '') + '</div>';
    var tar = r.tareas || {}, sinArs = (r.docs.ars.datos || {}).noAplica, sinBanco = (r.docs.banco.datos || {}).noAplica;
    if (sinArs || sinBanco) h += '<div class="card"><h3>Tareas de ingreso</h3>' +
      (sinArs ? '<label class="check" style="margin-bottom:8px"><input type="checkbox" data-tarea="ars"' + (tar.ars ? ' checked' : '') + '> No tiene ARS: hacer la solicitud de afiliación a ARS</label>' : '') +
      (sinBanco ? '<label class="check"><input type="checkbox" data-tarea="banco"' + (tar.banco ? ' checked' : '') + '> No tiene cuenta en Banco Popular: orientarlo para abrirla al ingresar</label>' : '') + '</div>';

    // Depuración
    h += '<div class="card"><h3>Depuración</h3><div class="semaforo">' + sem(dep.docs, 'Documentos', dep.pendientesRevision ? dep.pendientesRevision + ' por revisar' : '') + sem(dep.lab, 'Evaluación pre empleo', r.lab.resultado === 'apto' ? 'Apto' : '') +
      sem(dep.referencia, 'Referencia laboral', '') + sem(dep.familiares, 'Familiares en ' + c.nombre, r.familiares.declara === 'si' ? 'Declaró que SÍ' : r.familiares.declara === 'no' ? 'Declaró que no' : '') + '</div>' +
      (dep.listo ? '<div class="aviso ok" style="margin-top:12px">Depuración completa. Puede descargar el expediente y enviarlo a ' + esc(c.nombre) + '.</div>' : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center"><button class="btn pri" id="expPdf">⬇ Expediente completo (PDF)</button><button class="btn" id="expZip">⬇ Archivos sueltos (ZIP)</button>' + (API.demo ? '' : '<button class="btn sm" id="drive">Carpeta en Drive ↗</button>') +
      '<div class="sp"></div><select id="estado" style="max-width:210px"><option value="activo">Estado: En proceso</option><option value="listo">Estado: Expediente listo</option><option value="enviado_cliente">Estado: Enviado al cliente</option><option value="descartado">Estado: Descartado</option></select></div><div id="expProg" class="tiny muted" style="margin-top:6px"></div></div>';

    // Documentos
    h += '<div class="card"><h3>Documentos</h3>';
    DOCS.forEach(function (doc) {
      var d = r.docs[doc.id], est = d.datos && d.datos.noAplica ? '<span class="pill gris">No aplica</span>' : '<span class="pill ' + ({ aprobado: 'ok', rechazado: 'mal', recibido: 'pend' }[d.estado] || 'gris') + '">' + ({ aprobado: 'Aprobado', rechazado: 'Rechazado', recibido: 'Por revisar', pendiente: 'Pendiente' }[d.estado]) + '</span>';
      var extra = '';
      if (doc.tipo === 'laboratorio') { extra = r.lab.asistio ? 'Fue el ' + esc(r.lab.fechaAsistencia) : (r.lab.referimiento ? 'Referimiento listo, aún no va' : 'Falta generar referimiento'); est = '<span class="pill ' + (r.lab.resultado === 'apto' ? 'ok' : r.lab.resultado === 'no_apto' ? 'mal' : 'gris') + '">' + (r.lab.resultado === 'apto' ? 'Apto' : r.lab.resultado === 'no_apto' ? 'No apto' : 'Ver abajo') + '</span>'; }
      else if (doc.tipo === 'referencia') extra = refs.length ? esc(refs.map(function (x) { return x.nombre; }).join(', ')) : 'No ha enviado';
      else if (d.datos && d.datos.codigo) extra = 'Firmado digitalmente ' + fechaHora(d.datos.firmadoEn) + ' · código ' + esc(d.datos.codigo);
      if (doc.id === 'declaracion' && d.datos && d.datos.familiares) extra += (extra ? ' · ' : '') + '<b style="color:' + (d.datos.familiares === 'si' ? 'var(--mal)' : 'var(--ok)') + '">Familiares en ' + esc(c.nombre) + ': ' + (d.datos.familiares === 'si' ? 'SÍ' : 'No') + '</b>';
      if (d.estado === 'rechazado' && d.nota) extra += ' · <span style="color:var(--mal)">' + esc(d.nota) + '</span>';
      h += '<div class="doc-row"><div class="num" style="width:28px;height:28px;font-size:.8rem">' + doc.n + '</div><div class="t"><div style="font-weight:600;font-size:.92rem">' + esc(doc.titulo) + '</div><div class="tiny muted">' + extra + '</div>' +
        ((d.archivos || []).length ? '<div class="archivos">' + d.archivos.map(function (a) { return '<button class="btn sm" data-ver="' + a.fileId + '">👁 ' + esc(a.nombre) + '</button>'; }).join('') + '</div>' : '') + '</div>' + est +
        ((doc.tipo === 'archivo' || doc.tipo === 'formulario') ? '<label class="btn sm" title="Subir este documento yo (RRHH)">⬆<input type="file" class="hidden" data-subirdoc="' + doc.id + '" accept="image/*,application/pdf" multiple></label>' : '') +
        ((doc.tipo === 'archivo' || doc.tipo === 'formulario') && d.archivos.length && !(d.datos && d.datos.noAplica) ? '<button class="btn sm ok" data-aprobar="' + doc.id + '" title="Aprobar">✓</button><button class="btn sm mal" data-rechazar="' + doc.id + '" title="Rechazar y pedir que lo corrija">✕</button>' : '') + '</div>';
    });
    h += '</div>';

    // Laboratorio
    var lab = r.lab;
    h += '<div class="card"><h3>Evaluación pre empleo · Laboratorios Referencia</h3><div class="interno"><div class="tiny" style="color:var(--azul);font-weight:700;margin-bottom:6px">USO INTERNO — EL CANDIDATO NO VE ESTO</div>' +
      '<div class="grid g2"><div><div class="tiny muted">Prueba a solicitar</div><b style="font-size:1.1rem">' + esc(lab.prueba) + '</b></div><div><div class="tiny muted">Datos para el portal del laboratorio</div><div class="small">' + esc(r.nombre) + ' · ' + esc(r.cedula || 'sin cédula') + '<br>Empresa: ' + esc(EMPRESA.razon) + '</div></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" id="cpLab">Copiar datos</button>' + (cfg.LAB_PORTAL_URL ? '<a class="btn sm" target="_blank" href="' + esc(cfg.LAB_PORTAL_URL) + '">Abrir portal del laboratorio ↗</a>' : '') + '</div></div>' +
      '<div style="margin-top:14px" class="grid g2"><div><label>1. Referimiento</label>' + (lab.referimiento ? '<div class="aviso ok" style="margin:0 0 8px">Generado ' + fechaHora(lab.referimientoEn) + '. El candidato ya ve las instrucciones para ir.</div>' : '<button class="btn sm pri" id="labRef">Marcar referimiento generado</button> ') +
      '<label class="btn sm" style="margin-top:6px">Subir referimiento (opcional)<input type="file" class="hidden" id="upRef" accept="application/pdf,image/*"></label>' + (lab.referimientoArchivo ? ' <button class="btn sm" data-ver="' + lab.referimientoArchivo.fileId + '">👁 Ver</button>' : '') +
      (lab.referimiento && !lab.asistio ? '<div style="margin-top:8px"><a class="btn sm ok" target="_blank" href="' + wa(r, msgLab(r)) + '">WhatsApp: avisar que puede ir</a></div>' : '') + '</div>' +
      '<div><label>2. Resultado</label><select id="labRes"><option value="">Pendiente</option><option value="apto"' + (lab.resultado === 'apto' ? ' selected' : '') + '>Apto para trabajar</option><option value="no_apto"' + (lab.resultado === 'no_apto' ? ' selected' : '') + '>No apto</option></select>' +
      '<div style="margin-top:8px"><label class="btn sm">Subir resultado<input type="file" class="hidden" id="upRes" accept="application/pdf,image/*"></label>' + (lab.resultadoArchivo ? ' <button class="btn sm" data-ver="' + lab.resultadoArchivo.fileId + '">👁 Ver resultado</button>' : '') + '</div>' +
      '<div class="tiny muted" style="margin-top:6px">' + (lab.asistio ? 'El candidato indicó que fue el ' + esc(lab.fechaAsistencia) : 'El candidato aún no indica que fue.') + '</div></div></div>' +
      '<div class="campo" style="margin-top:10px"><label>Notas internas del laboratorio</label><input id="labNotas" value="' + esc(lab.notas) + '"></div></div>';

    // Referencia
    var rf = r.referencia, F = rf.formulario || {}, r0 = refs[0] || {};
    function v(k, def) { return esc(F[k] != null ? F[k] : (def || '')); }
    h += '<div class="card"><h3>Referencia laboral</h3>' + (refs.length ? refs.map(function (x) { return '<div class="doc-row"><div class="t"><b>' + esc(x.nombre) + '</b> <span class="muted small">' + esc([x.cargo, x.empresa].filter(Boolean).join(' · ')) + '</span><div class="small">' + esc(x.telefono) + (x.fechaSalida ? ' · salió ' + esc(x.fechaSalida) : '') + (x.trabajaAun === 'si' ? ' · <b style="color:var(--mal)">todavía trabaja ahí</b>' : x.trabajaAun === 'no' ? ' · <span style="color:var(--ok)">ya no trabaja ahí</span>' : '') + '</div></div><a class="btn sm" href="tel:' + esc(x.telefono) + '">Llamar</a><a class="btn sm" target="_blank" href="https://wa.me/' + telWa(x.telefono) + '">WhatsApp</a></div>'; }).join('') : '<p class="muted small">El candidato todavía no envía el contacto. Puede llenar el formulario igual.</p>') +
      '<p class="small muted" style="margin-top:10px">Llene esto mientras habla con la referencia. Se guarda como PDF "Solicitud de referencias laborales" y entra en el expediente.</p><div id="refForm">' +
      '<div class="grid g3"><div class="campo"><label>Empresa</label><input data-rf="empresa" value="' + v('empresa', r0.empresa) + '"></div><div class="campo"><label>Teléfono</label><input data-rf="telefono" value="' + v('telefono', r0.telefono) + '"></div><div class="campo"><label>Supervisor</label><input data-rf="supervisor" value="' + v('supervisor', r0.nombre) + '"></div>' +
      '<div class="campo"><label>Posición que ocupó</label><input data-rf="posicion" value="' + v('posicion') + '"></div><div class="campo"><label>Desde – hasta</label><input data-rf="periodo" placeholder="01/2022 – 06/2025" value="' + v('periodo') + '"></div><div class="campo"><label>Último salario</label><input data-rf="salario" value="' + v('salario') + '"></div></div>' +
      '<div style="overflow:auto"><table class="small"><thead><tr><th>Aspecto</th>' + NIVELES_REF.map(function (n) { return '<th style="text-align:center">' + n + '</th>'; }).join('') + '</tr></thead><tbody>' +
      ASPECTOS_REF.map(function (asp, i) { var cal = (F.calif || {})[asp]; return '<tr><td>' + esc(asp) + '</td>' + NIVELES_REF.map(function (n) { return '<td style="text-align:center;padding:6px"><input type="radio" style="width:auto" name="cal' + i + '" data-asp="' + esc(asp) + '" value="' + n + '"' + (cal === n ? ' checked' : '') + '></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="grid g2" style="margin-top:10px"><div class="campo"><label>Fortalezas</label><input data-rf="fortalezas" value="' + v('fortalezas') + '"></div><div class="campo"><label>Debilidades</label><input data-rf="debilidades" value="' + v('debilidades') + '"></div>' +
      '<div class="campo"><label>Motivo de salida</label><input data-rf="motivo" value="' + v('motivo') + '"></div><div class="campo"><label>¿Lo volvería a contratar?</label><div class="radios" style="padding-top:8px"><label><input type="radio" name="recontratar" value="Sí"' + (F.recontratar === 'Sí' ? ' checked' : '') + '> Sí</label><label><input type="radio" name="recontratar" value="No"' + (F.recontratar === 'No' ? ' checked' : '') + '> No</label></div></div></div>' +
      '<div class="campo"><label>Comentarios adicionales</label><input data-rf="comentarios" value="' + v('comentarios', rf.comentarios) + '"></div>' +
      '<div class="grid g3"><div class="campo"><label>Datos suministrados por</label><input data-rf="suministrado" value="' + v('suministrado', rf.contacto || r0.nombre) + '"></div><div class="campo"><label>Su posición</label><input data-rf="suministradoPos" value="' + v('suministradoPos', r0.cargo) + '"></div><div class="campo"><label>Fecha</label><input type="date" data-rf="fecha" value="' + v('fecha', rf.fecha || new Date().toISOString().slice(0, 10)) + '"></div></div>' +
      '<div class="grid g2"><div class="campo"><label>Resultado</label><select id="refRes"><option value="">Pendiente</option><option value="positiva"' + (rf.resultado === 'positiva' ? ' selected' : '') + '>Positiva</option><option value="negativa"' + (rf.resultado === 'negativa' ? ' selected' : '') + '>Negativa</option><option value="no_localizable"' + (rf.resultado === 'no_localizable' ? ' selected' : '') + '>No localizable</option></select></div><div class="campo"><label>Verificado por (RRHH)</label><input data-rf="verificadoPor" value="' + v('verificadoPor', 'Aixa Castillo') + '"></div></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri sm" id="refGuardar">Guardar referencia</button><button class="btn sm" id="refPdf">⬇ PDF de la referencia</button>' + (rf.verificada ? '<span class="pill ok">Verificada ' + esc(rf.fecha) + '</span>' : '') + '</div></div>';

    // Familiares
    var fm = r.familiares;
    h += '<div class="card"><h3>Familiares en ' + esc(c.nombre) + '</h3>' +
      (fm.declara ? '<div class="aviso ' + (fm.declara === 'si' ? 'mal' : 'ok') + '">El candidato declaró: <b>' + (fm.declara === 'si' ? 'SÍ tiene familiares' : 'No tiene familiares') + '</b> en ' + esc(c.nombre) + ' o contratistas.' + (fm.detalle ? '<br>' + esc(fm.detalle) : '') + '</div>' : '<p class="muted small">El candidato aún no responde (paso 3).</p>') +
      '<div class="grid g2"><label class="check"><input type="checkbox" id="famVer"' + (fm.verificado ? ' checked' : '') + '> Verificado (revisé con el cliente / listado)</label><label class="check"><input type="checkbox" id="famCon"' + (fm.conflicto ? ' checked' : '') + '> Hay conflicto (tiene familiar en la empresa)</label></div>' +
      '<div class="campo" style="margin-top:8px"><label>Notas</label><input id="famNotas" value="' + esc(fm.notas) + '"></div><button class="btn pri sm" id="famGuardar">Guardar</button></div>';

    // Datos
    h += '<div class="card"><h3>Datos del candidato</h3><div class="grid g3">' +
      [['nombre', 'Nombre'], ['cedula', 'Cédula'], ['cedulaVence', 'Cédula vence (AAAA-MM-DD)'], ['telefono', 'Teléfono'], ['correo', 'Correo'], ['vacante.posicion', 'Posición'], ['vacante.salario', 'Salario RD$'], ['vacante.contratoMeses', 'Contrato (meses)']].map(function (x) {
        var v = x[0].split('.').reduce(function (o, k) { return o == null ? '' : o[k]; }, r); if (v == null) v = ''; return '<div class="campo"><label>' + x[1] + '</label><input data-campo="' + x[0] + '" value="' + esc(v) + '"></div>';
      }).join('') + '<div class="campo"><label>Sexo (interno)</label><select data-campo="sexo"><option value="F"' + (r.sexo === 'F' ? ' selected' : '') + '>Femenino</option><option value="M"' + (r.sexo === 'M' ? ' selected' : '') + '>Masculino</option></select></div></div>' +
      '<div class="campo"><label>Notas internas</label><textarea data-campo="notas" rows="2">' + esc(r.notas) + '</textarea></div><button class="btn sm" id="datosGuardar">Guardar datos</button></div>';

    h += '<div class="card"><h3>Historial</h3><div class="hist">' + r.historial.slice().reverse().map(function (x) { return '<div><b>' + fechaHora(x.t) + '</b> · ' + esc(x.msg) + '</div>'; }).join('') + '</div></div></div>';
    $('#panelIn').innerHTML = h;
    enlazarDetalle();
  }

  function enlazarDetalle() {
    var r = REC;
    $('#cerrar').onclick = cerrar;
    $('#cpEnlace').onclick = function () { copiar(enlace(r)); };
    var ext = $('#extender'); if (ext) ext.onclick = function () { cambiar([['plazoExtraDias', Number(r.plazoExtraDias || 0) + 2]], 'Plazo extendido 2 días'); };
    $$('[data-tarea]').forEach(function (c) { c.onchange = function () { cambiar([['tareas.' + c.getAttribute('data-tarea'), c.checked]], 'Guardado'); }; });
    $$('[data-subirdoc]').forEach(function (inp) { inp.onchange = async function () {
      var fs = Array.prototype.slice.call(inp.files || []); if (!fs.length) return; toast('Subiendo…');
      try { var arr = []; for (var i = 0; i < fs.length && i < 3; i++) arr.push(await prepararArchivo(fs[i])); REC = await call('admin.subirDoc', { id: r.id, doc: inp.getAttribute('data-subirdoc'), archivos: arr }); pintarDetalle(); toast('Documento guardado y aprobado', 'ok'); } catch (e) { toast(e.message, 'mal'); }
    }; });
    $$('[data-ver]').forEach(function (b) { b.onclick = function () { verArchivo(b.getAttribute('data-ver')); }; });
    $$('[data-aprobar]').forEach(function (b) { b.onclick = async function () { try { REC = await call('admin.docEstado', { id: r.id, doc: b.getAttribute('data-aprobar'), estado: 'aprobado' }); pintarDetalle(); } catch (e) { toast(e.message, 'mal'); } }; });
    $$('[data-rechazar]').forEach(function (b) {
      b.onclick = async function () {
        var nota = prompt('¿Qué debe corregir el candidato? (lo verá en su enlace)', 'El documento no se ve claro. Vuelva a subirlo escaneado.'); if (nota === null) return;
        try { REC = await call('admin.docEstado', { id: r.id, doc: b.getAttribute('data-rechazar'), estado: 'rechazado', nota: nota }); pintarDetalle(); toast('Rechazado. Envíele el recordatorio por WhatsApp.', 'ok'); } catch (e) { toast(e.message, 'mal'); }
      };
    });
    $('#estado').value = r.estado;
    $('#estado').onchange = function () {
      var v = this.value; if (v === 'listo' && !depuracion(r).listo && !confirm('La depuración no está completa. ¿Marcar como listo de todas formas?')) { this.value = r.estado; return; }
      cambiar([['estado', v]], 'Estado actualizado');
    };
    $('#cpLab').onclick = function () { copiar('Nombre: ' + r.nombre + '\nCédula: ' + r.cedula + '\nEmpresa: ' + EMPRESA.razon + '\nPrueba: ' + r.lab.prueba); };
    var lr = $('#labRef'); if (lr) lr.onclick = function () { cambiar([['lab.referimiento', true]], 'Referimiento marcado. Avísele por WhatsApp.'); };
    async function subirLab(input, campo) {
      var f = input.files[0]; if (!f) return; toast('Subiendo…');
      try { var a = await prepararArchivo(f); REC = await call('admin.subirLab', { id: r.id, campo: campo, archivo: a }); pintarDetalle(); toast('Archivo guardado', 'ok'); } catch (e) { toast(e.message, 'mal'); }
    }
    $('#upRef').onchange = function () { subirLab(this, 'referimiento'); };
    $('#upRes').onchange = function () { subirLab(this, 'resultado'); };
    $('#labRes').onchange = function () { cambiar([['lab.resultado', this.value]], 'Resultado guardado'); };
    $('#labNotas').onchange = function () { cambiar([['lab.notas', this.value]]); };
    function leerRef() {
      var F = {}; $$('#refForm [data-rf]').forEach(function (el) { F[el.getAttribute('data-rf')] = el.value.trim(); });
      F.calif = {}; $$('#refForm input[data-asp]:checked').forEach(function (el) { F.calif[el.getAttribute('data-asp')] = el.value; });
      var rc = $('#refForm input[name=recontratar]:checked'); F.recontratar = rc ? rc.value : '';
      return F;
    }
    $('#refGuardar').onclick = function () {
      var res = $('#refRes').value; if (!res) return toast('Seleccione el resultado', 'mal');
      var F = leerRef();
      cambiar([['referencia.formulario', F], ['referencia.resultado', res], ['referencia.contacto', F.suministrado], ['referencia.fecha', F.fecha], ['referencia.comentarios', F.comentarios], ['referencia.verificadoPor', F.verificadoPor], ['referencia.verificada', true]], 'Referencia guardada');
    };
    $('#refPdf').onclick = async function () {
      var copia = JSON.parse(JSON.stringify(r)); copia.referencia.formulario = leerRef();
      try { descargar(new Blob([await pdfReferencia(copia)], { type: 'application/pdf' }), 'Referencia laboral - ' + r.nombre + '.pdf'); } catch (e) { toast(e.message, 'mal'); }
    };
    $('#famGuardar').onclick = function () { cambiar([['familiares.verificado', $('#famVer').checked], ['familiares.conflicto', $('#famCon').checked], ['familiares.notas', $('#famNotas').value]], 'Guardado'); };
    $('#datosGuardar').onclick = function () {
      var cambios = []; $$('[data-campo]').forEach(function (el) {
        var ruta = el.getAttribute('data-campo'), actual = ruta.split('.').reduce(function (o, k) { return o == null ? '' : o[k]; }, r), v = ruta === 'vacante.contratoMeses' ? Number(el.value) : el.value;
        if (String(actual) !== String(v)) cambios.push([ruta, v]);
      });
      if (!cambios.length) return toast('Sin cambios'); cambiar(cambios, 'Datos guardados');
    };
    var dv = $('#drive'); if (dv) dv.onclick = async function () { try { var x = await call('admin.carpeta', { id: r.id }); window.open(x.url, '_blank'); } catch (e) { toast(e.message, 'mal'); } };
    $('#expPdf').onclick = async function () {
      var btn = this; btn.disabled = true; var prog = $('#expProg');
      try {
        var bytes = await pdfExpediente(r, function (fid) { return call('admin.archivo', { fileId: fid }); }, function (i, n, t) { prog.textContent = 'Agregando ' + i + ' de ' + n + ': ' + t + '…'; });
        var nombre = 'Expediente - ' + r.nombre + ' - ' + CLIENTES[r.cliente].nombre + '.pdf';
        descargar(new Blob([bytes], { type: 'application/pdf' }), nombre);
        prog.textContent = 'Expediente descargado.';
        if (!API.demo) { prog.textContent += ' Guardando copia en Drive…'; var g = await call('admin.guardarExpediente', { id: r.id, nombre: nombre, b64: bytesAB64(bytes) }); prog.innerHTML = 'Expediente descargado y guardado en Drive. <a target="_blank" href="' + g.url + '">Abrir en Drive</a>'; }
      } catch (e) { toast(e.message, 'mal'); prog.textContent = ''; }
      btn.disabled = false;
    };
    $('#expZip').onclick = async function () {
      var btn = this; btn.disabled = true; var prog = $('#expProg');
      try {
        var zip = new JSZip(), lista = [];
        DOCS.forEach(function (d) { (r.docs[d.id].archivos || []).forEach(function (a) { lista.push(a); }); });
        if (r.lab.resultadoArchivo) lista.push(r.lab.resultadoArchivo);
        for (var i = 0; i < lista.length; i++) { prog.textContent = 'Descargando ' + (i + 1) + ' de ' + lista.length + '…'; var f = await call('admin.archivo', { fileId: lista[i].fileId }); zip.file(lista[i].nombre, b64aBytes(f.b64)); }
        descargar(await zip.generateAsync({ type: 'blob' }), 'Documentos - ' + r.nombre + '.zip'); prog.textContent = 'ZIP descargado.';
      } catch (e) { toast(e.message, 'mal'); }
      btn.disabled = false;
    };
  }
  function descargar(blob, nombre) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); }

  /* ---------------- Arranque ---------------- */
  if (KEY) app.innerHTML = '<div class="vacio">Cargando…</div>';
  if (KEY) call('admin.lista').then(function (l) { LISTA = l; inicio(); }, login); else login();
})();
