/* Portal del candidato: pasos para completar el expediente */
(function () {
  var token = new URLSearchParams(location.search).get('t');
  var app = $('#app'), V = null, abierto = null, cfg = window.PORTAL_CONFIG || {};
  if (API.demo) $('#demo').classList.remove('hidden');
  if (!token) { app.innerHTML = '<div class="card"><h2>Enlace incompleto</h2><p class="muted">Abra el enlace exacto que le enviamos por WhatsApp.</p></div>'; return; }

  async function cargar() {
    try { V = await API.call('cand.ver', { token: token }); aplicarTema(V.cliente); $('#chipCli').innerHTML = chipCliente(V.cliente); document.querySelector('meta[name=theme-color]') || document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="' + cli().colores.pri + '">'); pintar(); }
    catch (e) { app.innerHTML = '<div class="card"><h2>No pudimos abrir su expediente</h2><p class="muted">' + esc(e.message) + '</p>' + ayuda() + '</div>'; }
  }
  function ayuda() { return cfg.WHATSAPP_AYUDA ? '<p class="small">¿Tiene dudas? <a href="https://wa.me/' + cfg.WHATSAPP_AYUDA + '" target="_blank">Escríbanos por WhatsApp</a></p>' : ''; }
  function cli() { return CLIENTES[V.cliente]; }
  function primerNombre() { return (V.nombre || '').split(' ')[0]; }

  function estadoPasos() {
    var actual = null, bloqueadoDesde = null;
    ORDEN_CANDIDATO.forEach(function (id) {
      var d = V.docs[id];
      if (!d.hecho && actual === null && id !== 'laboratorio') actual = id;
    });
    return { actual: actual, bloqueadoDesde: bloqueadoDesde };
  }

  /* Después de completar un paso, abre el siguiente pendiente (sin devolverlo atrás). */
  function siguientePaso(desde) {
    if (desde && V.docs[desde] && !V.docs[desde].hecho) return desde;
    var i0 = Math.max(0, ORDEN_CANDIDATO.indexOf(desde)), n = ORDEN_CANDIDATO.length;
    for (var k = 1; k <= n; k++) { var id = ORDEN_CANDIDATO[(i0 + k) % n]; if (!V.docs[id].hecho && id !== 'laboratorio') return id; }
    return '';
  }

  function pintar() {
    var c = cli(), p = V.progreso, ep = estadoPasos(), vence = new Date(V.vence), horas = Math.round((vence - new Date()) / 3600000);
    if (abierto === null) abierto = ep.actual || 'laboratorio';
    var html = '';
    if (V.enviadoEn || V.cerrado) {
      html += '<div class="card"><div class="aviso ok"><b>Documentos enviados completos.</b> Gracias, ' + esc(primerNombre()) + '. Estamos revisando su expediente. Le escribiremos para los próximos pasos.</div>' +
         + ayuda() + '</div>';
    }
    if (V.lab.listo && !V.lab.asistio && !V.cerrado) html += '<div class="aviso pend" style="font-size:.95rem"><b>Importante:</b> su evaluación pre empleo ya está lista. Vaya <b>cuanto antes</b> a Laboratorios Referencia con su cédula (paso 3). Es gratis.</div>';
    html += '<div class="card" style="border-top:4px solid var(--azul)"><h1>Hola, ' + esc(primerNombre()) + '</h1>' +
      '<p>Tenemos el placer de informarle que <b>' + esc(c.nombre) + '</b> desea continuar con la fase de depuración y completación de su expediente.</p>' +
      '<p>La posición es <b>' + esc(V.vacante.posicion || '') + '</b>, bajo modalidad de subcontratación para ' + esc(c.nombre) + ' a través de <b>' + esc(EMPRESA.nombre) + '</b>, empresa encargada de la tercerización de este puesto.</p>' +
      '<h3>Condiciones</h3><ul class="small">' +
      (V.vacante.salario ? '<li>Salario mensual: <b>RD$' + esc(V.vacante.salario) + '</b>. Se aplican los aportes de ley (AFP, SFS y demás).</li>' : '<li>Se aplican los aportes de ley (AFP, SFS y demás).</li>') +
      '<li>Contrato inicial por ' + esc(V.vacante.contratoMeses) + ' meses, con posibilidad de renovación según su desempeño, la necesidad del servicio y las evaluaciones.</li>' +
      '<li>Según su desempeño y los procesos internos de ' + esc(c.nombre) + ', podría ser considerado/a para futuras vacantes internas.</li></ul>' +
      (V.enviadoEn ? '' : '<div class="aviso ' + (horas < 0 ? 'mal' : horas < 24 ? 'pend' : '') + '">' + (horas < 0 ? 'Su plazo de ' + EMPRESA.plazoDias + ' días ya venció. Complete lo antes posible.' : 'Tiene hasta el <b>' + vence.toLocaleString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + '</b> para completar todo (' + EMPRESA.plazoDias + ' días).') + '</div>') +
      '<details><summary style="cursor:pointer;font-weight:600;color:var(--azul)">Antes de empezar, lea esto</summary><ol class="small">' +
      '<li><b>Empiece por los pasos 1, 2 y 3</b>: su cédula, el contacto de su supervisor anterior y la evaluación pre empleo. Son los que más tardan.</li>' +
      '<li>Suba cada documento en su paso, uno por uno. Si un documento se le atrasa (por ejemplo, la buena conducta), siga con los demás y súbalo luego.</li>' +
      '<li>Los documentos deben estar <b>escaneados, claros y legibles</b>. Puede usar la app gratis <b>CamScanner</b> u otra parecida.</li>' +
      (c.firma === 'manuscrita' ? '<li>Los formularios se descargan, se imprimen, se completan y se <b>firman a mano</b>.</li>' : '<li>Los formularios se llenan aquí mismo y se firman con su dedo en la pantalla.</li>') +
      '<li>La constancia de vacunación Covid-19 puede ser una imagen o captura legible.</li>' +
      '<li>Documentos borrosos, incompletos o sin firma retrasan su proceso.</li>' +
      '<li>Mientras antes complete su expediente, más rápido podremos enviarlo a ' + esc(c.nombre) + ' para coordinar su posible fecha de ingreso.</li>' +
      '<li class="muted">Sus datos y documentos se usan solo para su proceso de contratación y se comparten únicamente con ' + esc(c.nombre) + '.</li></ol></details></div>';

    html += '<div class="card" style="padding:14px 18px"><div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:6px"><b>Su avance</b><span>' + p.hechos + ' de ' + p.total + ' pasos</span></div><div class="barra"><i style="width:' + p.pct + '%"></i></div></div>';

    ORDEN_CANDIDATO.forEach(function (id, i) {
      var doc = docPorId(id), d = V.docs[id], num = i + 1;
      var cls = d.estado === 'rechazado' ? 'rech' : d.hecho ? 'hecho' : (ep.actual === doc.id ? 'actual' : '');
      var sub = d.estado === 'rechazado' ? '<small style="color:var(--mal)">Debe corregirlo</small>' : d.hecho ? '<small class="muted">' + (d.estado === 'aprobado' ? 'Aprobado' : 'Recibido') + '</small>' :
        doc.tipo === 'laboratorio' ? '<small style="color:' + (V.lab.listo ? 'var(--pend);font-weight:600' : 'var(--gris)') + '">' + (V.lab.listo ? 'Lista: vaya cuanto antes' : 'Le avisaremos cuando pueda ir') + '</small>' :
        doc.tipo === 'referencia' ? '<small class="muted">Hágalo primero</small>' : '<small class="muted">Pendiente</small>';
      html += '<div class="paso ' + cls + (abierto === doc.id ? ' abierto' : '') + '" data-paso="' + doc.id + '"><div class="paso-h" data-abrir="' + doc.id + '"><div class="num">' + (d.hecho ? '✓' : num) + '</div><div class="paso-t">' + esc(doc.titulo) + sub + '</div><span class="muted">' + (abierto === doc.id ? '▴' : '▾') + '</span></div>' +
        '<div class="paso-b">' + (abierto === doc.id ? cuerpo(doc, d) : '') + '</div></div>';
    });

    if (!V.enviadoEn) {
      var faltan = DOCS.filter(function (doc) { return doc.tipo !== 'laboratorio' && !V.docs[doc.id].hecho; }).length;
      html += '<div class="card" style="text-align:center"><h2>¿Terminó?</h2><p class="muted small">' + (faltan ? 'Le faltan ' + faltan + ' paso(s). Cuando termine, presione el botón.' : 'Todo listo. Presione el botón para enviarnos su expediente.') + '</p>' +
        '<button class="btn pri lg" id="enviar" ' + (faltan ? 'disabled' : '') + '>Documentos enviados completos</button>' + ayuda() + '</div>';
    }
    app.innerHTML = html;
    activar();
  }

  function archivosHtml(d) {
    if (!d.archivos.length) return '';
    return '<div class="archivos">' + d.archivos.map(function (a) { return '<span class="pill ok">📎 ' + esc(a.nombre) + '</span>'; }).join('') + '</div>';
  }
  function zonaSubir(doc, d) {
    var max = doc.max || 1, n = d.archivos.length, acc = doc.soloImagen ? 'image/*' : 'image/*,application/pdf';
    var h = '';
    if (n && d.estado !== 'rechazado') {
      h += '<div class="aviso ok">Recibido. ' + (n < max ? 'Si le falta una página o la parte de atrás, agréguela.' : '') + '</div>';
      h += '<div style="display:flex;gap:8px;flex-wrap:wrap">' + (n < max ? '<label class="btn sm">+ Agregar otra página<input type="file" class="hidden" data-subir="agregar" accept="' + acc + '"></label>' : '') +
        '<label class="btn sm">Reemplazar<input type="file" class="hidden" data-subir="reemplazar" accept="' + acc + '"' + (max > 1 ? ' multiple' : '') + '></label></div>';
    } else {
      h += '<label class="subir"><b>Toque aquí para subir</b><br><span class="small muted">Foto o PDF' + (max > 1 ? ' · hasta ' + max + ' archivos' : '') + '</span><input type="file" class="hidden" data-subir="nuevo" accept="' + acc + '"' + (max > 1 ? ' multiple' : '') + '></label>';
    }
    return h;
  }

  function cuerpo(doc, d) {
    var c = cli(), h = '';
    if (d.estado === 'rechazado') h += '<div class="aviso mal"><b>Debe corregir este documento.</b> ' + esc(d.nota || 'Vuelva a subirlo claro y completo.') + '</div>';
    if (doc.tipo === 'archivo') {
      if (doc.ayuda) h += '<p class="small">' + esc(doc.ayuda) + '</p>';
      if (doc.enlace) h += '<p><a class="btn sm" href="' + doc.enlace.url + '" target="_blank" rel="noopener">' + esc(doc.enlace.texto) + ' ↗</a></p>';
      if (d.datos && d.datos.noAplica) h += '<div class="aviso ok">' + esc(doc.noAplica) + '. ' + esc(doc.noAplicaMsg) + '</div><p class="small muted">Si sí tiene el documento, puede subirlo:</p>';
      h += archivosHtml(d) + zonaSubir(doc, d);
      if (doc.noAplica && !(d.datos && d.datos.noAplica) && !d.archivos.length) h += '<p style="margin-top:10px"><button class="btn sm" data-noaplica>' + esc(doc.noAplica) + '</button></p>';
      return h;
    }
    if (doc.tipo === 'formulario') {
      if (c.firma === 'manuscrita') {
        h += '<ol class="small"><li>Descargue el formulario.</li><li>Imprímalo, complete <b>todos los campos</b> y <b>fírmelo a mano</b>.</li><li>Escanéelo (CamScanner) y súbalo aquí. Suba todas las páginas.</li></ol>' +
          '<p><a class="btn sm" href="' + c.plantillas[doc.id] + '" download target="_blank">⬇ Descargar formulario</a></p><p class="tiny muted">¿No tiene impresora? Escríbanos y le ayudamos.</p>';
        if (doc.id === 'declaracion') {
          var fd = d.datos || {};
          h += '<div class="card flat" style="padding:14px;margin:10px 0"><div class="campo"><label>¿Tiene algún familiar trabajando en ' + esc(c.nombre) + ' o para un contratista de ' + esc(c.nombre) + '? *</label><div class="radios"><label><input type="radio" name="fam" value="si"' + (fd.familiares === 'si' ? ' checked' : '') + '> Sí</label><label><input type="radio" name="fam" value="no"' + (fd.familiares === 'no' ? ' checked' : '') + '> No</label></div></div>' +
            '<div class="campo' + (fd.familiares === 'si' ? '' : ' hidden') + '" id="famdet"><label>¿Quién? Nombre, parentesco y área</label><textarea name="famdet" rows="2">' + esc(fd.familiaresDetalle || '') + '</textarea></div>' +
            '<button class="btn sm" data-guardarfam>Guardar respuesta</button></div>';
        }
        return h + archivosHtml(d) + zonaSubir(doc, d);
      }
      // digital
      if (d.hecho && !d._editar) return '<div class="aviso ok">Formulario llenado y firmado digitalmente.</div><button class="btn sm" data-reeditar>Volver a llenarlo</button>';
      h += '<p class="small muted">Llene el formulario aquí. Al final, marque la casilla y firme con su dedo. Se guardará como PDF firmado.</p>';
      h += doc.id === 'solicitud' ? htmlSolicitud(c, V.vacante, V.nombre) : htmlDeclaracion(c, V.nombre);
      h += '<button class="btn pri block lg" data-firmar style="margin-top:6px">Firmar y enviar</button>';
      return h;
    }
    if (doc.tipo === 'laboratorio') {
      if (V.lab.asistio) return '<div class="aviso ok">Evaluación realizada el ' + esc(V.lab.fechaAsistencia) + '. Nosotros recibiremos el resultado directamente.</div>';
      if (!V.lab.listo) return '<div class="aviso pend">Estamos preparando su evaluación pre empleo. Le avisaremos por WhatsApp. <b>Cuando le avisemos, vaya cuanto antes</b>: sin esta evaluación no podemos enviar su expediente. Mientras tanto, siga con los demás pasos.</div>';
      return '<div class="aviso">Su evaluación pre empleo está lista.</div><ol class="small"><li>Vaya a <b>Laboratorios Referencia</b> con su <b>cédula</b>.</li><li>Diga que va de parte de <b>' + esc(EMPRESA.nombre) + '</b>.</li><li>Es una evaluación pre empleo para confirmar que está apto/a para trabajar.</li><li><b>No tiene que pagar nada.</b></li></ol>' +
        '<div class="grid g2" style="align-items:end"><div class="campo"><label>¿Qué día fue?</label><input type="date" id="labfecha" value="' + new Date().toISOString().slice(0, 10) + '"></div><div class="campo"><button class="btn pri block" data-labok>Ya me realicé la evaluación</button></div></div>';
    }
    if (doc.tipo === 'referencia') {
      var refs = (d.datos && d.datos.refs) || [];
      function r(i) { var x = refs[i] || {}, req = i ? '' : ' *';
        function f(k, l, t) { return '<div class="campo"><label>' + l + req + '</label><input' + (t ? ' type="' + t + '"' : '') + ' data-ref="' + i + '" data-k="' + k + '" value="' + esc(x[k] || '') + '"></div>'; }
        return '<fieldset><legend>' + (i ? 'Otro supervisor (opcional)' : 'Supervisor de su último trabajo') + '</legend><div class="grid g2">' +
        f('nombre', 'Nombre del supervisor') + f('telefono', 'Teléfono', 'tel') + f('empresa', 'Empresa') + '<div class="campo"><label>Cargo del supervisor</label><input data-ref="' + i + '" data-k="cargo" value="' + esc(x.cargo || '') + '"></div></div>' +
        '<div class="campo"><label>¿Todavía trabaja en esa empresa?' + req + '</label><div class="radios"><label><input type="radio" name="trab' + i + '" data-ref="' + i + '" data-k="trabajaAun" value="no"' + (x.trabajaAun === 'no' ? ' checked' : '') + '> No, ya salí</label><label><input type="radio" name="trab' + i + '" data-ref="' + i + '" data-k="trabajaAun" value="si"' + (x.trabajaAun === 'si' ? ' checked' : '') + '> Sí, todavía trabajo ahí</label></div></div>' +
        '<div class="campo"><label>Fecha en que salió (mes y año)</label><input data-ref="' + i + '" data-k="fechaSalida" placeholder="Ej.: marzo 2025" value="' + esc(x.fechaSalida || '') + '"></div></fieldset>'; }
      return '<p class="small"><b>Hágalo primero.</b> Escriba el nombre, teléfono y empresa de su <b>supervisor en su último trabajo</b>. Nosotros lo llamaremos para su referencia laboral.</p>' + r(0) + r(1) + '<button class="btn pri" data-guardarref>Guardar</button>';
    }
    return h;
  }

  function ocupado(on, txt) {
    var p = $('.paso.abierto'); if (!p) return;
    p.classList.toggle('cargando', on);
    var b = $('.paso-b', p); var m = $('.subiendo', b);
    if (on && !m) b.insertAdjacentHTML('afterbegin', '<div class="aviso subiendo">' + (txt || 'Subiendo… no cierre esta página.') + '</div>');
    if (!on && m) m.remove();
  }

  async function accion(fn, okMsg) {
    try { var nv = await fn(); if (nv) V = nv; if (okMsg) toast(okMsg, 'ok'); abierto = siguientePaso(abierto); pintar(); window.scrollTo({ top: ($('.paso.abierto') || app).offsetTop - 80, behavior: 'smooth' }); }
    catch (e) { ocupado(false); toast(e.message, 'mal'); }
  }

  function activar() {
    $$('[data-abrir]').forEach(function (el) { el.onclick = function () { var id = el.getAttribute('data-abrir'); abierto = abierto === id ? '' : id; pintar(); }; });
    var env = $('#enviar'); if (env) env.onclick = function () { accion(function () { return API.call('cand.enviar', { token: token }); }, '¡Gracias! Expediente enviado.'); };
    var paso = $('.paso.abierto'); if (!paso) return;
    var docId = paso.getAttribute('data-paso'), doc = docPorId(docId), d = V.docs[docId];

    $$('[data-subir]', paso).forEach(function (input) {
      input.onchange = function () {
        var files = Array.prototype.slice.call(input.files || []); if (!files.length) return;
        var modo = input.getAttribute('data-subir'), datos = {};
        if (doc.id === 'declaracion' && cli().firma === 'manuscrita') {
          var fam = $('input[name=fam]:checked', paso);
          if (!fam) { toast('Primero responda si tiene familiares en ' + cli().nombre, 'mal'); input.value = ''; return; }
          datos = { familiares: fam.value, familiaresDetalle: ($('textarea[name=famdet]', paso) || {}).value || '' };
        }
        ocupado(true);
        accion(async function () {
          var arr = []; for (var i = 0; i < files.length && i < (doc.max || 1); i++) arr.push(await prepararArchivo(files[i]));
          return API.call('cand.subir', { token: token, doc: docId, archivos: arr, datos: datos, reemplazar: modo === 'reemplazar' });
        }, 'Documento recibido');
      };
    });
    var na = $('[data-noaplica]', paso); if (na) na.onclick = function () { ocupado(true, 'Guardando…'); accion(function () { return API.call('cand.datos', { token: token, doc: docId, datos: { noAplica: true } }); }, 'Anotado'); };
    $$('input[name=fam]', paso).forEach(function (r) { r.onchange = function () { $('#famdet').classList.toggle('hidden', r.value !== 'si' || !r.checked); }; });
    var gf = $('[data-guardarfam]', paso); if (gf) gf.onclick = function () {
      var fam = $('input[name=fam]:checked', paso); if (!fam) return toast('Seleccione Sí o No', 'mal');
      accion(function () { return API.call('cand.datos', { token: token, doc: docId, datos: { familiares: fam.value, familiaresDetalle: $('textarea[name=famdet]', paso).value } }); }, 'Respuesta guardada');
    };
    var lab = $('[data-labok]', paso); if (lab) lab.onclick = function () { accion(function () { return API.call('cand.datos', { token: token, doc: 'laboratorio', datos: { fecha: $('#labfecha').value } }); }, 'Gracias, anotado'); };
    var gr = $('[data-guardarref]', paso); if (gr) gr.onclick = function () {
      var refs = [{}, {}]; $$('[data-ref]', paso).forEach(function (el) { if (el.type === 'radio' && !el.checked) return; refs[+el.getAttribute('data-ref')][el.getAttribute('data-k')] = el.value.trim(); });
      accion(function () { return API.call('cand.datos', { token: token, doc: 'referencia', datos: { refs: refs } }); }, 'Referencia guardada');
    };
    var re = $('[data-reeditar]', paso); if (re) re.onclick = function () { d._editar = true; pintar(); };

    var form = $('form[data-form]', paso);
    if (form) {
      activarRepetibles(form, 1); activarSiNo(form);
      [['cedula', V.cedula], ['telefono', V.telefono], ['correo', V.correo]].forEach(function (x) { var el = $('[name=' + x[0] + ']', form); if (el && !el.value && x[1]) el.value = x[1]; });
      var clave = 'borrador_' + token + '_' + docId;
      try { llenarForm(form, JSON.parse(localStorage.getItem(clave))); } catch (e) {}
      form.addEventListener('input', function () { try { localStorage.setItem(clave, JSON.stringify(leerForm(form))); } catch (e) {} });
      var pad = padFirma($('.firma-box', form));
      $('[data-firmar]', paso).onclick = function () {
        var faltan = validarForm(form), datos = leerForm(form);
        if (faltan.length) return toast('Complete: ' + faltan.slice(0, 3).join(', ') + (faltan.length > 3 ? '…' : ''), 'mal');
        if (!datos.acepto) return toast('Marque la casilla de aceptación', 'mal');
        if (pad.vacia()) return toast('Falta su firma', 'mal');
        var firma = pad.png(), meta = metaFirma(datos); meta.posicion = V.vacante.posicion;
        ocupado(true, 'Generando su PDF firmado…');
        accion(async function () {
          var bytes = docId === 'solicitud' ? await pdfSolicitud(datos, cli(), firma, meta) : await pdfDeclaracion(datos, cli(), firma, meta);
          var extra = docId === 'solicitud' ? { parienteCliente: datos.parienteCliente } :
            { familiares: datos.p2, familiaresDetalle: (datos.p2filas || []).map(function (r) { return [r.nombre, r.relacion, r.entidad].filter(Boolean).join(' – '); }).join('; ') };
          extra.formulario = datos; extra.firmadoEn = meta.fecha; extra.codigo = meta.codigo; extra.dispositivo = meta.dispositivo;
          var nv = await API.call('cand.subir', { token: token, doc: docId, archivos: [{ nombre: (docId === 'solicitud' ? 'Solicitud de empleo' : 'Declaracion de relaciones') + ' - firmada.pdf', mime: 'application/pdf', b64: bytesAB64(bytes) }], datos: extra, reemplazar: true });
          try { localStorage.removeItem(clave); } catch (e) {}
          return nv;
        }, 'Formulario firmado y enviado');
      };
    }
  }

  cargar();
})();
