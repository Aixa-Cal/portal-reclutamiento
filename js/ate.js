/* Inducción de Asesores Técnicos Empresariales (personal subcontratado para Altice).
   Mismo formato que la de La Barra: en pocas palabras, así sí / así no y ejemplos. */
function modulosATE(V) {
  var vac = V.vacante || {}, puesto = vac.posicion || 'Host de Servicio al Cliente';
  var nq = netoQuincenal(vac.salario), meses = Number(vac.contratoMeses) || 6;
  var pasoArs = (V.orden || []).indexOf('ars') + 1;
  return [
    { id: 'bienvenida', icono: '👋', titulo: '¡Bienvenido/a a Asesores Técnicos Empresariales!', sub: 'Lo primero que debe saber',
      clave: 'Le deseamos mucho éxito en esta nueva etapa. Aquí tiene lo más importante de su ingreso.',
      p: ['Posición: ' + puesto + '.',
        vac.salario ? 'Salario mensual: RD$' + vac.salario + '. Se aplican los aportes de ley (AFP, SFS y demás).' + (nq ? ' Cada quincena recibe aproximadamente ' + formatoRD(nq.neto) + '.' : '') : 'Su salario se le informa al ingresar. Se aplican los aportes de ley (AFP, SFS y demás).',
        'Su puesto es subcontratado para Altice Dominicana a través de Asesores Técnicos Empresariales.',
        'El contrato inicial es de ' + (meses === 6 ? 'seis' : meses) + ' meses, y se puede extender según su desempeño.'] },

    { id: 'presentacion', icono: '👔', titulo: 'Su primer día: vestimenta y puntualidad', sub: 'Lo primero que ven de usted',
      clave: 'Preséntese con vestimenta formal de color NEGRO, sin diseños visibles. La puntualidad y la presentación son fundamentales.',
      si: ['Pantalón y camisa o blusa formal, todo en negro', 'Zapatos cerrados y formales', 'Llegar antes de su hora', 'Confirmar su talla de T-shirt (abajo)'],
      no: ['Jeans, tenis o ropa de colores', 'Ropa con letras, logos o dibujos', 'Llegar tarde el primer día'],
      p: ['En la tienda le entregan su camiseta (T-shirt) y su carnet oficial.'],
      ejemplo: { t: 'No tiene pantalón negro formal, solo un jean negro.', bien: 'Avise antes a la persona que le asistió en la depuración y consiga ropa formal negra para su primer día.', mal: 'Llegar con jeans y tenis "porque es negro". Formal significa formal.' } },

    { id: 'seguro', icono: '🏥', titulo: 'Su seguro médico (ARS)', sub: 'Para estar cubierto/a',
      clave: 'Al ingresar confirmamos su ARS. Díganos a cuál está afiliado/a y suba la foto de su carnet' + (pasoArs ? ' en el paso ' + pasoArs : '') + '.',
      p: ['Si no tiene ARS, puede afiliarse a la de su preferencia. Puede agregar dependientes; tienen costo adicional si no son familia nuclear.',
        'Si ya tiene seguro, su cobertura se activa después de cotizar un mes completo en la TSS. Luego retira su tarjeta en su aseguradora.'] },

    { id: 'pagos', icono: '💵', titulo: 'Su cuenta de banco y sus pagos', sub: 'Cuándo y cómo cobra',
      clave: 'Cobra cada quincena: los días 14 y 29 de cada mes (un día antes del 15 y el 30).',
      p: ['Al ingresar recibe una carta de nómina para abrir su cuenta de banco.',
        'Cuando tenga el número de cuenta, envíelo por correo o WhatsApp a la persona que le asistió en la depuración.',
        'Los pagos tienen los descuentos de ley. Si quiere recibir su comprobante cada mes, dénos su correo.'],
      ejemplo: { t: 'Ya abrió su cuenta de banco.', bien: 'Envía su número de cuenta ese mismo día a la persona que le asistió, para que su pago llegue a tiempo.', mal: 'Esperar a que llegue la quincena para mandarlo. Su pago se puede atrasar.' } },

    { id: 'tramites', icono: '📝', titulo: 'Trámites del día a día', sub: 'Siempre con tiempo',
      clave: 'Todo se pide con anticipación y por escrito.',
      p: ['Constancias laborales: pídalas con al menos 3 días laborables de anticipación.',
        'Horas extras y días feriados: se pagan si su supervisor las solicita. Asegúrese de que su supervisor lo notifique a Gestión Humana de Altice.',
        'Renuncia: envíe una carta firmada con su nombre, cédula y fecha de salida al 829-470-2828 y a su supervisor.'],
      ejemplo: { t: 'Necesita una constancia de trabajo para el banco el viernes.', bien: 'La pide desde el lunes (3 días laborables antes).', mal: 'Pedirla el jueves en la tarde para el viernes.' } },

    { id: 'beneficios', icono: '🌴', titulo: 'Vacaciones y maternidad', sub: 'Sus beneficios',
      p: ['Vacaciones: a partir del primer año tiene derecho a 14 días. Coordínelas con su supervisor en Altice.',
        'Maternidad: infórmenos para darle el formulario correspondiente.'] },

    { id: 'crecimiento', icono: '🚀', titulo: 'Oportunidad de crecimiento', sub: '¡Esfuércese y alcance sus metas!',
      clave: 'Con un buen desempeño, puede ser considerado/a para una contratación directa como Representante de Ventas en Altice.',
      p: ['¡Mucho éxito en esta nueva etapa profesional con nosotros!'] }
  ];
}

var QUIZ_ATE = [
  { id: 'vestimenta', q: '¿Cómo debe vestirse para su primer día?', o: ['Jeans y tenis', 'Formal, en color negro y sin diseños', 'Con ropa de cualquier color'], c: 1, e: 'Vestimenta formal en color negro, sin diseños visibles.' },
  { id: 'pago', q: '¿Qué días se paga la quincena?', o: ['Los días 14 y 29', 'Los días 1 y 15', 'Solo a fin de mes'], c: 0, e: 'Se paga un día antes de la quincena: los días 14 y 29.' },
  { id: 'constancia', q: '¿Con cuánto tiempo pide una constancia laboral?', o: ['El mismo día', 'Un mes antes', 'Al menos 3 días laborables antes'], c: 2, e: 'Las constancias se piden con al menos 3 días laborables de anticipación.' },
  { id: 'extras', q: '¿Qué se necesita para cobrar horas extras o feriados?', o: ['Que su supervisor las solicite y lo notifique a Gestión Humana de Altice', 'Nada, se pagan solas', 'Pedírselas a un cliente'], c: 0, e: 'Se pagan previa solicitud del supervisor, que debe notificarlo a Gestión Humana de Altice.' },
  { id: 'cuenta', q: 'Ya abrió su cuenta de banco. ¿Qué hace?', o: ['Nada', 'Envío el número a la persona que me asistió en la depuración', 'Espero a la quincena'], c: 1, e: 'Envíe su número de cuenta por correo o WhatsApp a la persona que le asistió.' }
];

/* Qué inducción le toca a cada candidato */
function induccionDe(V, semilla) {
  if (V.cliente === 'labarra') return { mods: modulosLaBarra(V), todas: QUIZ_LB, quiz: quizDe(semilla), compromiso: true, menu: MENU_LB, talla: false };
  return { mods: modulosATE(V), todas: QUIZ_ATE, quiz: QUIZ_ATE, compromiso: false, menu: [], talla: true };
}
