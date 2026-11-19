/* Portal del candidato: pasos para completar el expediente */
(function () {
  var token = new URLSearchParams(location.search).get('t');
  var app = $('#app'), V = null, abierto = null, cfg = window.PORTAL_CONFIG || {};
  if (API.demo) $('#demo').classList.remove('hidden');
  if (!token) { app.innerHTML = '<div class="card"><h2>Enlace incompleto</h2><p class="muted">Abra el enlace exacto que le enviamos por WhatsApp.</p></div>'; return; }

  async function cargar() {
    try { V = await API.call('cand.ver', { token: token }); aplicarTema(V.cliente); marca(); document.querySelector('meta[name=theme-color]') || document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="' + cli().colores.pri + '">'); pintar(); }
    catch (e) { app.innerHTML = '<div class="card"><h2>No pudimos abrir su expediente</h2><p class="muted">' + esc(e.message) + '</p>' + ayuda() + '</div>'; }
  }
  function ayuda() { return cfg.WHATSAPP_AYUDA ? '<p class="small">¿Tiene dudas? <a href="https://wa.me/' + cfg.WHATSAPP_AYUDA + '" target="_blank">Escríbanos por WhatsApp</a></p>' : ''; }
  function cli() { return CLIENTES[V.cliente]; }
  function defDe(id) { return (V.defs || []).filter(function (x) { return x.id === id; })[0] || docPorId(id); }
  function orden() { return V.orden || ORDEN_CANDIDATO; }
  function emp() { return V.empleador || empleador(V.cliente); }
  function pasoN(id) { return orden().indexOf(id) + 1; }
  function marca() {
    var e = emp(), c = cli();
    if (c.marca) {
      $('.marca').innerHTML = '<div class="logo" style="background:' + c.colores.pri + '">' + esc(e.logo) + '</div><div>' + esc(e.nombre) + '<small>' + esc(e.razon) + ' · Recursos Humanos</small></div>';
      $('#chipCli').innerHTML = ''; document.title = 'Completar expediente · ' + e.nombre;
    } else $('#chipCli').innerHTML = chipCliente(V.cliente);
  }
  function primerNombre() { return (V.nombre || '').split(' ')[0]; }

  function estadoPasos() {
    var actual = null, bloqueadoDesde = null;
    orden().forEach(function (id) {
      var d = V.docs[id]; if (!d) return;
      if (!d.hecho && actual === null && id !== 'laboratorio' && id !== 'induccion') actual = id;
    });
    return { actual: actual, bloqueadoDesde: bloqueadoDesde };
  }

  /* Después de completar un paso, abre el siguiente pendiente (sin devolverlo atrás). */
  function siguientePaso(desde) {
    if (desde && V.docs[desde] && !V.docs[desde].hecho) return desde;
    if (desde === 'evaluacion' && V.evaluacion && !V.evaluacion.completada) return desde;
    var ord = orden(), i0 = Math.max(0, ord.indexOf(desde)), n = ord.length;
    for (var k = 1; k <= n; k++) { var id = ord[(i0 + k) % n]; if (V.docs[id] && !V.docs[id].hecho && id !== 'laboratorio') return id; }
    return '';
  }

  function pintar() {
    var c = cli(), p = V.progreso, ep = estadoPasos(), vence = new Date(V.vence), horas = Math.round((vence - new Date()) / 3600000);
    if (abierto === null) abierto = ep.actual || 'laboratorio';
    var html = '';
    if (V.enviadoEn || V.cerrado) {
      html += '<div class="card"><div class="aviso ok"><b>Documentos enviados completos.</b> Gracias, ' + esc(primerNombre()) + '. Estamos revisando su expediente. Le escribiremos para los próximos pasos.</div>' +
        (V.docs.induccion && !V.docs.induccion.hecho && V.cliente === 'labarra' ? '<p class="small">Mientras revisamos, puede completar <b>Conozca La Barra</b> (paso ' + pasoN('induccion') + ').</p>' : '') + ayuda() + '</div>';
    }
    if (V.lab.listo && !V.lab.asistio && !V.cerrado) html += '<div class="aviso pend" style="font-size:.95rem"><b>Importante:</b> su evaluación pre empleo ya está lista. Vaya <b>cuanto antes</b> a Laboratorios Referencia con su cédula (paso ' + pasoN('laboratorio') + '). Es gratis.</div>';
    if (c.directo) html += bienvenidaDirecta(c, vence, horas);
    else html += '<div class="card" style="border-top:4px solid var(--azul)"><h1>Hola, ' + esc(primerNombre()) + '</h1>' +
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
      '<li>La constancia de vacunación Covid-19 es opcional. Si la tiene, puede ser una imagen o captura legible.</li>' +
      '<li>Documentos borrosos, incompletos o sin firma retrasan su proceso.</li>' +
      '<li>Mientras antes complete su expediente, más rápido podremos enviarlo a ' + esc(c.nombre) + ' para coordinar su posible fecha de ingreso.</li>' +
      '<li class="muted">Sus datos y documentos se usan solo para su proceso de contratación y se comparten únicamente con ' + esc(c.nombre) + '.</li></ol></details></div>';

    html += '<div class="card" style="padding:14px 18px"><div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:6px"><b>Su avance</b><span>' + p.hechos + ' de ' + p.total + ' pasos</span></div><div class="barra"><i style="width:' + p.pct + '%"></i></div></div>';

    orden().filter(function (id) { return id !== 'evaluacion' || V.evaluacion; }).forEach(function (id, i) {
      if (id === 'evaluacion') { html += pasoEvaluacion(i + 1); return; }
      var doc = defDe(id), d = V.docs[id], num = i + 1; if (!d) return;
      var cls = d.estado === 'rechazado' ? 'rech' : d.hecho ? 'hecho' : (ep.actual === doc.id ? 'actual' : '');
      var sub = d.estado === 'rechazado' ? '<small style="color:var(--mal)">Debe corregirlo</small>' : d.hecho ? '<small class="muted">' + (d.estado === 'aprobado' ? (id === 'cedula' ? 'Ya la tenemos' : 'Aprobado') : 'Recibido') + '</small>' :
        doc.tipo === 'laboratorio' ? '<small style="color:' + (V.lab.listo ? 'var(--pend);font-weight:600' : 'var(--gris)') + '">' + (V.lab.listo ? 'Lista: vaya cuanto antes' : 'Le avisaremos cuando pueda ir') + '</small>' :
        doc.tipo === 'referencia' ? '<small class="muted">Hágalo primero</small>' :
        doc.tipo === 'induccion' ? '<small class="muted">Puede hacerlo mientras revisamos</small>' :
        (doc.lados && d.archivos.length ? '<small style="color:var(--pend);font-weight:600">Falta un lado</small>' : '<small class="muted">Pendiente</small>');
      html += '<div class="paso ' + cls + (abierto === doc.id ? ' abierto' : '') + '" data-paso="' + doc.id + '"><div class="paso-h" data-abrir="' + doc.id + '"><div class="num">' + (d.hecho ? '✓' : num) + '</div><div class="paso-t">' + esc(doc.titulo) + sub + '</div><span class="muted">' + (abierto === doc.id ? '▴' : '▾') + '</span></div>' +
        '<div class="paso-b">' + (abierto === doc.id ? cuerpo(doc, d) : '') + '</div></div>';
    });

    if (!V.enviadoEn) {
      var faltan = (V.defs || DOCS).filter(function (doc) { return doc.tipo !== 'laboratorio' && doc.tipo !== 'induccion' && V.docs[doc.id] && !V.docs[doc.id].hecho; }).length;
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
  function bienvenidaDirecta(c, vence, horas) {
    var e = emp(), vac = V.vacante || {}, food = V.tienda === 'Food Shop Miraflores';
    return '<div class="card" style="border-top:4px solid var(--azul)"><h1>Hola, ' + esc(primerNombre()) + '</h1>' +
      '<p>¡Nos alegra que siga en el proceso para unirse a <b>' + esc(e.nombre) + '</b>! Complete aquí su expediente de ingreso, paso a paso.</p>' +
      '<p>Posición: <b>' + esc(vac.posicion || '') + '</b>' + (V.tienda ? ' · Tienda: <b>' + esc(V.tienda) + '</b>' : '') + '</p>' +
      '<h3>Condiciones</h3><ul class="small">' +
      (vac.salario ? '<li>Salario base mensual: <b>RD$' + esc(vac.salario) + '</b>. Se paga los días 15 y 30, con los descuentos de ley.</li>' : '') +
      (food ? '<li>Incentivo por desempeño de hasta RD$5,000 mensuales, según su evaluación.</li>' :
        (vac.propina ? '<li>Propina asignada: <b>RD$' + esc(vac.propina) + '</b> mensual, se paga el día 5' + (vac.propinaDespues && vac.propinaDespues !== vac.propina ? '. Después de 3 meses: <b>RD$' + esc(vac.propinaDespues) + '</b>' : '') + '.</li>' : '')) +
      '<li>Un día libre por semana, asignado por su líder.</li>' +
      '<li>La nómina se paga por <b>' + esc(V.banco) + '</b>.</li></ul>' +
      (V.enviadoEn ? '' : '<div class="aviso ' + (horas < 0 ? 'mal' : horas < 24 ? 'pend' : '') + '">' + (horas < 0 ? 'Su plazo de ' + EMPRESA.plazoDias + ' días ya venció. Complete lo antes posible.' : 'Tiene hasta el <b>' + vence.toLocaleString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + '</b> para completar todo (' + EMPRESA.plazoDias + ' días).') + '</div>') +
      '<details><summary style="cursor:pointer;font-weight:600;color:var(--azul)">Antes de empezar, lea esto</summary><ol class="small">' +
      '<li><b>Empiece por los primeros pasos</b>: sus datos, su cédula, su referencia laboral y la evaluación pre empleo.</li>' +
      '<li>Suba cada documento en su paso, uno por uno. Si uno se le atrasa (por ejemplo, la buena conducta), siga con los demás.</li>' +
      '<li>Las fotos deben verse <b>claras y completas</b>. Puede usar la app gratis <b>CamScanner</b>.</li>' +
      '<li>La declaración se llena aquí mismo y se firma con su dedo en la pantalla.</li>' +
      '<li>Al final está <b>Conozca La Barra</b>: puede hacerlo mientras revisamos su expediente. Completarlo no confirma su contratación.</li>' +
      '<li class="muted">Sus datos y documentos se usan solo para su proceso de ingreso y su expediente laboral.</li></ol></details></div>';
  }

  function induccionHtml(d) {
    var mods = modulosLaBarra(V), di = d.datos || {}, leidos = di.leidos || [], quiz = di.quiz, cl = cli();
    var h = '<p class="small">Lea cada tema y toque <b>Ya lo leí</b>. Si prefiere, toque <b>Escuchar</b>. Después vea el menú y responda ' + QUIZ_LB.length + ' preguntas.</p>' +
      '<div class="aviso">' + leidos.length + ' de ' + mods.length + ' temas leídos · Cuestionario: ' + (quiz ? quiz.correctas + ' de ' + quiz.total + ' correctas' : 'pendiente') + '</div>';
    mods.forEach(function (m, i) {
      var ok = leidos.indexOf(m.id) >= 0;
      h += '<div class="card flat" data-mod="' + m.id + '" style="padding:14px 16px;margin-bottom:10px;' + (ok ? 'border-color:#bfe8d6' : '') + '"><div style="display:flex;gap:10px;align-items:center"><div class="num" style="width:30px;height:30px;font-size:.8rem;' + (ok ? 'background:var(--ok);color:#fff' : '') + '">' + (ok ? '✓' : i + 1) + '</div><div style="flex:1"><b>' + esc(m.titulo) + '</b><div class="tiny muted">' + esc(m.sub) + '</div></div></div>' +
        m.p.map(function (t) { return '<p class="small" style="margin:8px 0">' + esc(t) + '</p>'; }).join('') +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-escuchar="' + m.id + '">🔊 Escuchar</button>' + (ok ? '<span class="pill ok">Leído</span>' : '<button class="btn sm pri" data-leido="' + m.id + '">Ya lo leí</button>') + '</div></div>';
    });
    h += '<div class="card flat" style="padding:14px 16px"><b>Nuestro menú</b><p class="small muted">Toque una imagen para verla grande.</p><div class="grid g2">' +
      MENU_LB.map(function (u) { return '<a href="' + u + '" target="_blank"><img src="' + u + '" alt="Menú La Barra" style="width:100%;border-radius:10px;border:1px solid var(--linea)"></a>'; }).join('') + '</div>';
    if (quiz && !d._repetirQuiz) {
      h += '<h3 style="margin-top:14px">Sus respuestas: ' + quiz.correctas + ' de ' + quiz.total + '</h3>' + QUIZ_LB.map(function (q) {
        var r = quiz.respuestas[q.id], bien = r === q.c;
        return '<div class="small" style="margin:6px 0"><b>' + (bien ? '✓' : '✗') + ' ' + esc(q.q) + '</b><br>' + (bien ? '' : 'Correcta: ' + esc(q.o[q.c]) + '. ') + '<span class="muted">' + esc(q.e) + '</span></div>';
      }).join('') + '<button class="btn sm" data-repetirquiz>Responder otra vez</button>';
    } else {
      h += '<h3 style="margin-top:14px">Preguntas</h3>' + QUIZ_LB.map(function (q, i) {
        return '<div class="campo"><label>' + (i + 1) + '. ' + esc(q.q) + '</label><div class="radios" style="flex-direction:column;gap:6px">' + q.o.map(function (o, j) { return '<label><input type="radio" name="q_' + q.id + '" value="' + j + '"> ' + esc(o) + '</label>'; }).join('') + '</div></div>';
      }).join('') + '<button class="btn pri" data-enviarquiz>Enviar respuestas</button>';
    }
    h += '</div>';
    if (cl.protocoloUrl) h += '<div class="card flat" style="padding:14px 16px;margin-top:10px"><b>Protocolo de servicio</b><p class="small"><a href="' + esc(cl.protocoloUrl) + '" target="_blank" rel="noopener">Abrir el protocolo ↗</a></p>' +
      (di.protocolo ? '<span class="pill ok">Confirmado</span>' : '<label class="check"><input type="checkbox" data-protocolo> Leí el protocolo de servicio.</label>') + '</div>';
    h += '<p class="tiny muted" style="margin-top:10px">Completar la inducción no confirma su contratación.</p>';
    return h;
  }

  async function guardarInduccion(datos, irA) {
    try {
      var nv = await API.call('cand.datos', { token: token, doc: 'induccion', datos: mezclar(datos, { modulosTotal: modulosLaBarra(V).length, requiereProtocolo: !!cli().protocoloUrl }) });
      V = nv; pintar(); var el = irA ? $('[data-mod="' + irA + '"]') : $('.paso[data-paso=induccion]');
      if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - 90) });
      if (V.docs.induccion.hecho) toast('¡Inducción completada!', 'ok');
    } catch (e) { toast(e.message, 'mal'); }
  }

  function pasoEvaluacion(num) {
    var ev = V.evaluacion, ab = abierto === 'evaluacion';
    var sub = ev.completada ? '<small class="muted">Completada</small>' : '<small style="color:var(--pend);font-weight:600">Hágala cuando esté listo/a</small>';
    var body = '';
    if (ab) {
      body = ev.completada ? '<div class="aviso ok">¡Gracias! Ya nos indicó que completó su evaluación. Nosotros revisamos el resultado.</div>' :
        '<p class="small">' + (ev.instrucciones ? esc(ev.instrucciones) : 'Es una constancia de sus conocimientos para la posición de <b>' + esc(V.vacante.posicion || '') + '</b>. No es un examen con nota: responda con calma lo que sabe.') + '</p>' +
        '<ol class="small"><li>Busque un lugar tranquilo y con buena señal de internet.</li><li>Cuando esté listo/a, toque <b>Abrir evaluación</b>.</li><li>Al terminar, regrese aquí y toque <b>Ya la completé</b>.</li></ol>' +
        '<p><a class="btn pri block lg" href="' + esc(ev.url) + '" target="_blank" rel="noopener" data-abrireval>Abrir evaluación' + (ev.nombre ? ': ' + esc(ev.nombre) : '') + ' ↗</a></p>' +
        '<button class="btn block" data-evalok' + (ev.abierta ? '' : ' disabled title="Primero abra la evaluación"') + '>Ya la completé</button>';
    }
    return '<div class="paso ' + (ev.completada ? 'hecho' : '') + (ab ? ' abierto' : '') + '" data-paso="evaluacion"><div class="paso-h" data-abrir="evaluacion"><div class="num">' + (ev.completada ? '✓' : num) + '</div><div class="paso-t">Evaluación del puesto' + sub + '</div><span class="muted">' + (ab ? '▴' : '▾') + '</span></div>' +
      '<div class="paso-b">' + body + '</div></div>';
  }

  function zonaLados(doc, d) {
    var porLado = {}; d.archivos.forEach(function (x) { if (x.lado) porLado[x.lado] = x; });
    return '<div class="lados">' + doc.lados.map(function (lado, i) {
      var f = porLado[lado];
      return '<label class="lado' + (f ? ' listo' : '') + '"><span class="lado-ico">' + (f ? '✓' : (i + 1)) + '</span><b>' + esc(lado) + '</b>' +
        '<span class="small muted">' + (f ? 'Subido · tocar para cambiar' : 'Toque aquí para subir') + '</span>' +
        '<input type="file" class="hidden" data-subir="lado" data-lado="' + esc(lado) + '" accept="image/*,application/pdf"></label>';
    }).join('') + '</div>';
  }
  function zonaSubir(doc, d) {
    if (doc.lados) return zonaLados(doc, d);
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
    if (doc.tipo === 'datos') {
      if (d.hecho && !d._editar) { var xd = d.datos || {}; return '<div class="aviso ok">Datos guardados. Gracias.</div><p class="small">Contacto de emergencia: <b>' + esc(xd.emergenciaNombre || '') + '</b> · ' + esc(xd.emergenciaTelefono || '') + '</p><button class="btn sm" data-reeditar>Cambiar mis datos</button>'; }
      return '<p class="small">Complete sus datos. Solo los usamos para su proceso de ingreso.</p>' + htmlDatos(V, d.datos);
    }
    if (doc.tipo === 'induccion') return induccionHtml(d);
    if (doc.id === 'banco' && V.cartaBanco) h += '<div class="aviso">Su <b>carta para abrir la cuenta en ' + esc(V.banco) + '</b> ya está lista.</div><p><button class="btn pri block" data-bajarcarta>⬇ Descargar mi carta del banco</button></p><p class="tiny muted">Llévela al banco con su cédula. Cuando abra la cuenta, suba aquí la constancia.</p>';
    if (doc.tipo === 'archivo' && d.estado === 'aprobado' && d.archivos.length) {
      return '<div class="aviso ok"><b>' + (doc.id === 'cedula' ? 'Ya tenemos su cédula.' : 'Este documento ya está aprobado.') + '</b> No tiene que hacer nada en este paso.</div>' + archivosHtml(d);
    }
    if (doc.tipo === 'archivo') {
      if (doc.ayuda) h += '<p class="small">' + esc(doc.ayuda) + '</p>';
      if (doc.enlace) h += '<p><a class="btn sm" href="' + doc.enlace.url + '" target="_blank" rel="noopener">' + esc(doc.enlace.texto) + ' ↗</a></p>';
      if (d.datos && d.datos.noAplica) h += '<div class="aviso ok">' + esc(doc.noAplica) + '. ' + esc(doc.noAplicaMsg) + '</div><p class="small muted">Si sí tiene el documento, puede subirlo:</p>';
      h += (doc.lados ? '' : archivosHtml(d)) + zonaSubir(doc, d);
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
      h += doc.id === 'solicitud' ? htmlSolicitud(c, V.vacante, V.nombre) : (c.formDeclaracion === 'labarra' ? htmlDeclaracionLB(c, V.nombre) : htmlDeclaracion(c, V.nombre));
      h += '<button class="btn pri block lg" data-firmar style="margin-top:6px">Firmar y enviar</button>';
      return h;
    }
    if (doc.tipo === 'laboratorio') {
      if (V.lab.asistio) return '<div class="aviso ok">Evaluación realizada el ' + esc(V.lab.fechaAsistencia) + '. Nosotros recibiremos el resultado directamente.</div>';
      if (!V.lab.listo) return '<div class="aviso pend">Estamos preparando su evaluación pre empleo. Le avisaremos por WhatsApp. <b>Cuando le avisemos, vaya cuanto antes</b>: sin esta evaluación no podemos enviar su expediente. Mientras tanto, siga con los demás pasos.</div>';
      return '<div class="aviso">Su evaluación pre empleo está lista. Vaya cuanto antes.</div>' +
        (V.lab.referimiento ? '<p><button class="btn pri block lg" data-bajarref>⬇ Descargar mi referimiento</button></p><p class="tiny muted" style="text-align:center;margin-top:-6px">Muéstrelo en su celular o impreso, junto con su cédula.</p>' : '') +
        '<ol class="small">' + (V.lab.referimiento ? '<li>Descargue su <b>referimiento</b> con el botón de arriba.</li>' : '') + '<li>Vaya a <b>Laboratorios Referencia</b> con su <b>cédula</b>' + (V.lab.referimiento ? ' y el referimiento' : '') + '.</li><li>Diga que va de parte de <b>' + esc(emp().nombre) + (c.directo ? ' (' + esc(emp().razon) + ')' : '') + '</b>.</li><li>Es una evaluación pre empleo para confirmar que está apto/a para trabajar.</li><li><b>No tiene que pagar nada.</b></li></ol>' +
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
    try { var nv = await fn(); if (nv) V = nv; if (okMsg) toast(okMsg, 'ok'); abierto = siguientePaso(abierto); pintar(); if (abierto) irAPaso(abierto); }
    catch (e) { ocupado(false); toast(e.message, 'mal'); }
  }

  /* Deja el paso tocado justo debajo de la barra de arriba (sin saltos al final de la página) */
  function irAPaso(id) {
    var el = $('.paso[data-paso="' + id + '"]'); if (!el) return;
    var barra = ($('.topbar') || { offsetHeight: 0 }).offsetHeight + 12;
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - barra), behavior: 'auto' });
  }

  function activar() {
    $$('[data-abrir]').forEach(function (el) { el.onclick = function () { var id = el.getAttribute('data-abrir'); abierto = abierto === id ? '' : id; pintar(); irAPaso(id); }; });
    var env = $('#enviar'); if (env) env.onclick = function () { accion(function () { return API.call('cand.enviar', { token: token }); }, '¡Gracias! Expediente enviado.'); };
    var paso = $('.paso.abierto'); if (!paso) return;
    var docId = paso.getAttribute('data-paso'), doc = defDe(docId), d = V.docs[docId];
    var ae = $('[data-abrireval]', paso); if (ae) ae.addEventListener('click', function () { var b0 = $('[data-evalok]'); if (b0) { b0.disabled = false; b0.removeAttribute('title'); } API.call('cand.evaluacion', { token: token, accion: 'abrir' }).then(function (nv) { V = nv; var b = $('[data-evalok]'); if (b) { b.disabled = false; b.removeAttribute('title'); } }).catch(function () {}); });
    var eo = $('[data-evalok]', paso); if (eo) eo.onclick = function () { accion(function () { return API.call('cand.evaluacion', { token: token, accion: 'completar' }); }, '¡Gracias! Evaluación completada'); };
    if (!doc) return;

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
          if (modo === 'lado') arr = arr.slice(0, 1).map(function (x) { x.lado = input.getAttribute('data-lado'); return x; });
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
    var br = $('[data-bajarref]', paso); if (br) br.onclick = async function () {
      br.disabled = true; br.textContent = 'Descargando…';
      try {
        var f = await API.call('cand.referimiento', { token: token });
        var url = URL.createObjectURL(new Blob([b64aBytes(f.b64)], { type: f.mime }));
        var a = document.createElement('a'); a.href = url; a.download = f.nombre; document.body.appendChild(a); a.click(); a.remove();
        toast('Referimiento descargado. Muéstrelo en el laboratorio.', 'ok');
      } catch (e) { toast(e.message, 'mal'); }
      br.disabled = false; br.textContent = '⬇ Descargar mi referimiento';
    };
    var lab = $('[data-labok]', paso); if (lab) lab.onclick = function () { accion(function () { return API.call('cand.datos', { token: token, doc: 'laboratorio', datos: { fecha: $('#labfecha').value } }); }, 'Gracias, anotado'); };
    var refInputs = $$('[data-ref]', paso);
    if (refInputs.length) {
      var claveRef = 'ref_' + token, refGuard = null; try { refGuard = JSON.parse(localStorage.getItem(claveRef)); } catch (e) {}
      if (refGuard && !(d.datos && d.datos.refs && d.datos.refs.length)) refInputs.forEach(function (el) {
        var v = (refGuard[+el.getAttribute('data-ref')] || {})[el.getAttribute('data-k')]; if (v == null) return;
        if (el.type === 'radio') el.checked = el.value === v; else el.value = v;
      });
      paso.addEventListener('input', function () { var rr = [{}, {}]; refInputs.forEach(function (el) { if (el.type === 'radio' && !el.checked) return; rr[+el.getAttribute('data-ref')][el.getAttribute('data-k')] = el.value; }); try { localStorage.setItem(claveRef, JSON.stringify(rr)); } catch (e) {} });
      paso.addEventListener('change', function () { paso.dispatchEvent(new Event('input')); });
    }
    var gr = $('[data-guardarref]', paso); if (gr) gr.onclick = function () {
      var refs = [{}, {}]; $$('[data-ref]', paso).forEach(function (el) { if (el.type === 'radio' && !el.checked) return; refs[+el.getAttribute('data-ref')][el.getAttribute('data-k')] = el.value.trim(); });
      accion(function () { return API.call('cand.datos', { token: token, doc: 'referencia', datos: { refs: refs } }); }, 'Referencia guardada');
    };
    var re = $('[data-reeditar]', paso); if (re) re.onclick = function () { d._editar = true; pintar(); };
    var gd = $('[data-guardardatos]', paso); if (gd) {
      var fdat = $('form[data-form=datos]', paso); activarSiNo(fdat);
      var claveD = 'datos_' + token; try { var dl = JSON.parse(localStorage.getItem(claveD)); if (dl && !(d.datos && d.datos.completo)) llenarForm(fdat, dl); } catch (e) {}
      fdat.addEventListener('input', function () { try { localStorage.setItem(claveD, JSON.stringify(leerForm(fdat))); } catch (e) {} });
      gd.onclick = function () { var x = leerForm(fdat); accion(function () { return API.call('cand.datos', { token: token, doc: 'datos', datos: x }); }, 'Datos guardados'); };
    }
    var bc = $('[data-bajarcarta]', paso); if (bc) bc.onclick = async function () {
      bc.disabled = true;
      try { var f = await API.call('cand.cartaBanco', { token: token }); var url = URL.createObjectURL(new Blob([b64aBytes(f.b64)], { type: f.mime })); var a = document.createElement('a'); a.href = url; a.download = f.nombre; document.body.appendChild(a); a.click(); a.remove(); toast('Carta descargada', 'ok'); }
      catch (e) { toast(e.message, 'mal'); }
      bc.disabled = false;
    };
    $$('[data-leido]', paso).forEach(function (b) { b.onclick = function () { b.disabled = true; guardarInduccion({ modulo: b.getAttribute('data-leido') }, b.getAttribute('data-leido')); }; });
    $$('[data-escuchar]', paso).forEach(function (b) { b.onclick = function () {
      if (!window.speechSynthesis) return toast('Su teléfono no permite escuchar el texto', 'mal');
      var m = modulosLaBarra(V).filter(function (x) { return x.id === b.getAttribute('data-escuchar'); })[0];
      speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(m.titulo + '. ' + m.p.join(' ')); u.lang = 'es-ES'; u.rate = 0.95; speechSynthesis.speak(u);
    }; });
    var eq = $('[data-enviarquiz]', paso); if (eq) eq.onclick = function () {
      var resp = {}, falt = 0, ok = 0;
      QUIZ_LB.forEach(function (q) { var r = $('input[name="q_' + q.id + '"]:checked', paso); if (!r) falt++; else { resp[q.id] = +r.value; if (+r.value === q.c) ok++; } });
      if (falt) return toast('Responda las ' + QUIZ_LB.length + ' preguntas', 'mal');
      d._repetirQuiz = false; guardarInduccion({ quiz: { respuestas: resp, correctas: ok, total: QUIZ_LB.length } });
    };
    var rq = $('[data-repetirquiz]', paso); if (rq) rq.onclick = function () { d._repetirQuiz = true; pintar(); };
    var pc = $('[data-protocolo]', paso); if (pc) pc.onchange = function () { if (pc.checked) guardarInduccion({ protocolo: true }); };

    var form = $('form[data-form]:not([data-form=datos])', paso);
    if (form && $('[data-firmar]', paso)) {
      activarRepetibles(form, 1); activarSiNo(form);
      [['cedula', V.cedula], ['telefono', V.telefono], ['correo', V.correo]].forEach(function (x) { var el = $('[name=' + x[0] + ']', form); if (el && !el.value && x[1]) el.value = x[1]; });
      var clave = 'borrador_' + token + '_' + docId;
      var local = null; try { local = JSON.parse(localStorage.getItem(clave)); } catch (e) {}
      llenarForm(form, local || ((V.docs[docId].datos || {}).borrador) || null);
      $('[data-firmar]', paso).insertAdjacentHTML('beforebegin', '<p class="tiny muted" id="estadoBorrador" style="text-align:center;margin:0 0 6px">Lo que escriba se guarda solo. Puede cerrar y volver luego.</p>');
      var tGuardar = null;
      var guardarBorrador = function () {
        var datosB = leerForm(form); delete datosB.acepto;
        try { localStorage.setItem(clave, JSON.stringify(datosB)); } catch (e) {}
        clearTimeout(tGuardar);
        tGuardar = setTimeout(function () {
          var eb = $('#estadoBorrador'); if (eb) eb.textContent = 'Guardando…';
          API.call('cand.datos', { token: token, doc: docId, datos: { borrador: datosB } })
            .then(function () { var e2 = $('#estadoBorrador'); if (e2) e2.textContent = '✓ Guardado ' + new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }); })
            .catch(function () { var e3 = $('#estadoBorrador'); if (e3) e3.textContent = 'Guardado en este teléfono. Se enviará al firmar.'; });
        }, 2000);
      };
      form.addEventListener('input', guardarBorrador); form.addEventListener('change', guardarBorrador);
      var pad = padFirma($('.firma-box', form));
      $('[data-firmar]', paso).onclick = function () {
        var faltan = validarForm(form), datos = leerForm(form);
        if (faltan.length) return toast('Complete: ' + faltan.slice(0, 3).join(', ') + (faltan.length > 3 ? '…' : ''), 'mal');
        if (!datos.acepto) return toast('Marque la casilla de aceptación', 'mal');
        if (pad.vacia()) return toast('Falta su firma', 'mal');
        var firma = pad.png(), meta = metaFirma(datos); meta.posicion = V.vacante.posicion;
        ocupado(true, 'Generando su PDF firmado…');
        accion(async function () {
          var bytes = docId === 'solicitud' ? await pdfSolicitud(datos, cli(), firma, meta) : (cli().formDeclaracion === 'labarra' ? await pdfDeclaracionLB(datos, cli(), firma, meta) : await pdfDeclaracion(datos, cli(), firma, meta));
          var extra = docId === 'solicitud' ? { parienteCliente: datos.parienteCliente } :
            { familiares: datos.p2, familiaresDetalle: (datos.p2filas || []).map(function (r) { return [r.nombre, r.relacion, r.entidad].filter(Boolean).join(' – '); }).join('; '), otrasActividades: datos.p3 || '', antecedentes: datos.p4 || '' };
          clearTimeout(tGuardar); extra.borrador = null;
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
