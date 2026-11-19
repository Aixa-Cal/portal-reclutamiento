/* Contenido de La Barra: inducción (tomado del portal La Barra Talento) y cuestionario del menú */

function dinero(v) { return 'RD$' + String(v || '').replace(/^RD\$/, ''); }

/* Cada tema: icono, título, "en pocas palabras" (clave), puntos cortos (p), Así sí / Así no, y un ejemplo de la vida real. */
function modulosLaBarra(V) {
  var t = V.tienda || 'su tienda', banco = V.banco, vac = V.vacante || {}, sal = dinero(vac.salario || '17,701.25');
  var nq = netoQuincenal(vac.salario), pu = puestoDe(V.cliente || 'labarra', vac.posicion) || {};
  var entreno = textoEntrenamiento(V.cliente || 'labarra', vac.posicion) || 'Su líder le asigna su día libre semanal.';
  var sandw = /sandwich/i.test(vac.posicion || ''), food = t === 'Food Shop Miraflores';
  var quincena = nq ? formatoRD(nq.neto) : '';
  var mods = [
    { id: 'bienvenida', icono: '👋', titulo: '¡Bienvenido/a al equipo!', sub: 'Lo primero que debe saber',
      clave: 'En La Barra hacemos los mejores sándwiches y batidas de Santo Domingo. Desde hoy, usted es parte de eso.',
      p: ['Su puesto: ' + (vac.posicion || '') + ' en ' + t + (V.turno ? ', turno ' + String(V.turno).replace(/\.$/, '') : '') + '.',
        (V.lider ? 'Su líder: ' + V.lider + (V.liderTelefono ? ' (' + V.liderTelefono + ')' : '') + '. Esa persona le enseña y le acompaña.' : 'Su líder le enseña y le acompaña en todo.'),
        entreno],
      ejemplo: { t: 'Su primer día de trabajo.', bien: 'Llega 10 minutos antes, se presenta con su líder y, si no sabe algo, pregunta.', mal: 'Hacer algo "a su manera" sin preguntar. Preguntar no es malo; equivocarse por no preguntar, sí.' } },

    { id: 'presentacion', icono: '👕', titulo: 'Su presentación', sub: 'Lo primero que ve el cliente',
      clave: 'Venga SIEMPRE bien vestido/a, presentado/a e higienizado/a, con el uniforme limpio. NO se permiten chancletas.',
      si: ['Uniforme completo y limpio, todos los días', 'Gorra puesta y cabello recogido', 'Pantalón jean o negro', 'Zapatos cerrados', 'Bañado/a, uñas cortas y limpias'],
      no: ['Chancletas: NUNCA, ni un día', 'Uniforme sucio, manchado o arrugado', 'Uñas largas o postizas', 'Anillos, pulseras o relojes al preparar comida'],
      ejemplo: { t: 'Su uniforme se manchó ayer y no le dio tiempo de lavarlo.', bien: 'Lávelo la noche antes. Si no puede, avise a su líder antes de llegar.', mal: 'Venir con el uniforme sucio "porque nadie se va a fijar". El cliente sí se fija: juzga el sándwich por la persona que lo prepara.' } },

    { id: 'normas', icono: '⏰', titulo: 'Puntualidad y normas', sub: 'Lo que se espera cada día',
      clave: 'Llegue a tiempo, registre su entrada y salida, y avise ANTES si pasa algo.',
      si: ['Registrar su entrada y salida en el sistema', 'Seguir las recetas y medidas tal como se le enseñan', 'Tratar con respeto a clientes y compañeros', 'Avisar faltantes o equipos dañados'],
      no: ['Usar el celular mientras atiende', 'Cambiar turnos o días libres sin permiso', 'Dejar su puesto sin avisar'],
      ejemplo: { t: 'Hay mucho tráfico y va a llegar tarde.', bien: 'Escriba a su líder ANTES de su hora de entrada.', mal: 'Llegar tarde y explicar después.' } },

    { id: 'servicio', icono: '🙋', titulo: 'Cómo atendemos al cliente', sub: 'Siempre en este orden',
      clave: 'El saludo es ley: "¡Bienvenido a La Barra!". Luego: tomar la orden → confirmar → cobrar → entregar.',
      p: ['1. Saludar: "¡Bienvenido a La Barra!"', '2. Tomar la orden. Si es mucho, anótelo.', '3. Confirmar: repita el pedido al cliente.', '4. Cobrar.', '5. Entregar, revisando que esté igual a lo que pidió.'],
      ejemplo: { t: 'Un cliente dice: "Dame un Barra Club y una batida de chinola".', bien: '"¡Bienvenido a La Barra! ¿La batida natural o en leche?… Natural. Le confirmo: un Barra Club y una batida de chinola natural. Son RD$690." Cobra, prepara y entrega.', mal: '"¿Qué quiere?", no confirmar y entregar una batida en leche que el cliente no pidió.' } },

    { id: 'higiene', icono: '🧼', titulo: 'Manos limpias (ServSafe)', sub: 'Esto aplica para todos',
      clave: 'Lávese las manos por al menos 20 segundos, con agua tibia y jabón. Los guantes NO sustituyen el lavado.',
      si: ['Lavarse al llegar, después del baño, de tocar dinero, basura, el celular o carne cruda', 'Cambiar guantes si se rompen, se ensucian, al cambiar de tarea o cada 4 horas', 'Avisar a su líder si tiene vómitos, diarrea, piel u ojos amarillos, o dolor de garganta con fiebre'],
      no: ['Tocar comida después de cobrar sin lavarse', 'Venir a trabajar enfermo/a sin avisar'],
      ejemplo: { t: 'Acaba de cobrar en efectivo y le piden un sándwich.', bien: 'Se lava las manos (o se cambia los guantes) antes de tocar la comida.', mal: 'Preparar el sándwich con las mismas manos. El dinero es de lo más sucio que hay.' } },

    { id: 'temperaturas', icono: '🌡️', titulo: 'Temperaturas (ServSafe)', sub: 'Lo frío, frío. Lo caliente, caliente.',
      clave: 'Entre 5 °C y 57 °C es la ZONA DE PELIGRO: ahí las bacterias crecen rápido.',
      si: ['Neveras a 5 °C o menos', 'Congeladores a −18 °C o menos', 'Comida caliente a 57 °C o más', 'Pollo cocido hasta 74 °C por dentro; burgers hasta 68 °C', 'Descongelar dentro de la nevera'],
      no: ['Dejar comida fuera de la nevera "un ratito"', 'Usar algo que pasó más de 4 horas en la zona de peligro', 'Descongelar sobre la mesa'],
      ejemplo: { t: 'Abre la nevera y el termómetro marca 9 °C.', bien: 'Avisa a su líder en ese momento.', mal: 'Esperar al final del turno. Para entonces, la comida ya puede estar dañada.' } },

    { id: 'contaminacion', icono: '🔪', titulo: 'Lo crudo, separado (ServSafe)', sub: 'Cada cosa en su lugar',
      clave: 'Lo crudo nunca toca lo que ya está listo para comer.',
      si: ['Tablas y utensilios separados para lo crudo', 'En la nevera: lo listo arriba, las carnes crudas abajo y el pollo crudo en lo más bajo', 'Lo primero que entra es lo primero que sale', 'Etiquetar con fecha y revisar vencimientos'],
      no: ['Usar la misma tabla del pollo crudo para cortar tomate', 'Usar algo vencido o en mal estado'],
      ejemplo: { t: 'Un cliente le dice: "Soy alérgico al maní".', bien: 'Avisa a su líder y prepara su pedido con utensilios limpios, sin tocar ese ingrediente.', mal: 'Decir "no creo que tenga" sin preguntar. Una alergia puede mandar a alguien al hospital.' } }
  ];
  if (sandw) mods.push({ id: 'sandwichero', icono: '🥪', titulo: 'Para sandwicheros', sub: 'Su puesto es especializado',
      clave: 'Cada sándwich tiene su receta, su pan, sus medidas y su orden de armado. Siempre igual.',
      si: ['Aprender cada receta con su líder', 'Usar las medidas exactas', 'Fijarse en el pan, el queso (danés o cheddar) y si va con o sin vegetales', 'Limpiar y desinfectar la plancha y los utensilios'],
      no: ['Cambiar ingredientes o porciones por su cuenta', 'Adivinar cuando no recuerda una receta'],
      ejemplo: { t: 'Le piden un Jamón y Queso, queso cheddar, sin vegetales.', bien: 'Lee la orden dos veces, arma el sándwich como manda la receta y revisa antes de entregar.', mal: 'Hacerlo "como siempre" con queso danés y vegetales. El cliente lo devuelve y se pierde tiempo y comida.' } });
  mods.push(
    { id: 'pago', icono: '💵', titulo: food ? 'Su salario y su incentivo' : 'Su salario y sus propinas', sub: 'Cuándo y cuánto cobra',
      clave: 'Cobra dos veces al mes: los días 15 y 30.' + (quincena ? ' Cada quincena recibe aproximadamente ' + quincena + '.' : ''),
      p: ['Salario base mensual: ' + sal + '. A eso se le descuentan los aportes de ley (AFP y SFS).',
        food ? 'Incentivo por desempeño: hasta RD$5,000 al mes, según su evaluación.' :
          (vac.propina ? 'Propina asignada: ' + dinero(vac.propina) + ' al mes, se paga el día 5.' + (vac.propinaDespues && vac.propinaDespues !== vac.propina ? ' Después de 3 meses: ' + dinero(vac.propinaDespues) + '.' : '') : 'Administración le explicará las propinas de su puesto.'),
        'Si tiene dudas de un pago, escriba a Administración con su nombre, tienda y la quincena.'] },
    { id: 'comunicacion', icono: '📱', titulo: '¿A quién le pregunto?', sub: 'Así no se pierde',
      clave: 'Lo del día a día: a su líder. Lo de RR. HH. y nómina: a Administración, 829-470-8263.',
      ejemplo: { t: 'Le cambiaron el horario y no le llegó completo el pago.', bien: 'Lo del horario se lo pregunta a su líder. Lo del pago, a Administración (829-470-8263), diciendo su nombre completo, sucursal y el motivo.', mal: 'Comentarlo con compañeros y quedarse con la duda.' } },
    { id: 'banco', icono: '🏦', titulo: 'Su cuenta de banco', sub: 'Para recibir su pago',
      clave: 'En ' + t + ' la nómina se paga por ' + banco + '.',
      p: ['Si no tiene cuenta en ' + banco + ', márquelo en el paso del banco. Le enviaremos la carta por este portal.', 'Cuando abra la cuenta, suba la constancia en ese mismo paso.', 'Nunca comparta su PIN, contraseñas ni códigos con nadie.'] },
    { id: 'avances', icono: '📝', titulo: 'Avances de propina o salario', sub: 'Solo con formulario',
      clave: 'Puede pedir un avance cuando tenga 6 meses o más en la empresa. La empresa no hace préstamos.',
      p: ['1. Pida el formulario a su líder.', '2. Llénelo y entrégueselo.', '3. Su líder lo envía a Administración y se tramita.'],
      ejemplo: { t: 'Tiene 4 meses trabajando y necesita un avance.', bien: 'Espera a cumplir 6 meses y lo pide con el formulario.', mal: 'Pedírselo de palabra a un compañero o a su líder.' } },
    { id: 'permisos', icono: '📅', titulo: 'Permisos y otros trámites', sub: 'Siempre con tiempo',
      clave: 'Todo se pide con anticipación. Si es una emergencia, avise lo antes posible.',
      p: ['Permisos: a su líder, con anticipación.', 'Licencia médica: avise a su líder y envíe el certificado a Administración.', 'Vacaciones: coordínelas con su líder y Administración. Espere la confirmación antes de hacer planes.', 'Horas extras y feriados: deben quedar registrados.', 'Constancias de trabajo: pídalas a Administración con tiempo.', 'Renuncia: carta firmada con su nombre, cédula y fecha de salida.'],
      ejemplo: { t: 'Tiene una cita médica el jueves.', bien: 'Lo pide a su líder desde el lunes.', mal: 'Avisar el mismo jueves por la mañana.' } }
  );
  return mods;
}

/* Texto completo de un tema, para el botón Escuchar */
function textoModulo(m) {
  return [m.titulo, m.clave].concat(m.p || []).concat(m.si ? ['Así sí: ' + m.si.join('. ')] : []).concat(m.no ? ['Así no: ' + m.no.join('. ')] : [])
    .concat(m.ejemplo ? ['Ejemplo: ' + m.ejemplo.t, 'Lo correcto: ' + m.ejemplo.bien, 'Lo incorrecto: ' + m.ejemplo.mal] : []).filter(Boolean).map(function (x) { return String(x).replace(/[.\s]+$/, ''); }).join('. ') + '.';
}

var QUIZ_LB = [
  { id: 'chancletas', q: '¿Puede venir a trabajar en chancletas?', o: ['Sí, si están limpias', 'Solo los fines de semana', 'No, nunca'], c: 2, e: 'No se permiten chancletas. Siempre zapatos cerrados, uniforme limpio y buena presentación.' },
  { id: 'saludo', q: '¿Cuál es el saludo de La Barra?', o: ['"Hola, ¿qué quiere?"', '"¡Bienvenido a La Barra!"', '"Siguiente"'], c: 1, e: 'El saludo es ley: a cada cliente se le dice "¡Bienvenido a La Barra!".' },
  { id: 'orden', q: '¿Cuál es el orden correcto para atender un pedido?', o: ['Cobrar, tomar la orden y entregar', 'Tomar la orden, entregar y cobrar', 'Tomar la orden, confirmarla, cobrar y entregar'], c: 2, e: 'Primero se toma la orden, se confirma, se cobra y luego se entrega.' },
  { id: 'anotar', q: 'Si no puede recordar todo el pedido, ¿qué debe hacer?', o: ['Anotarlo', 'Adivinar lo que falta', 'Preparar lo que recuerde'], c: 0, e: 'Si no puede retener el pedido, anótelo. Es mejor anotar que equivocarse.' },
  { id: 'temp', q: '¿Qué hace si una nevera no está a la temperatura correcta?', o: ['Nada, no es su trabajo', 'Avisar a su supervisor', 'Seguir usando los alimentos'], c: 1, e: 'Las temperaturas son responsabilidad de todos. Avise de inmediato a su supervisor.' },
  { id: 'frio', q: '¿A qué temperatura deben estar las neveras?', o: ['A 5 °C o menos', 'A 15 °C', 'A temperatura ambiente'], c: 0, e: 'Lo frío se mantiene a 5 °C o menos. Entre 5 °C y 57 °C es la zona de peligro.' },
  { id: 'manos', q: '¿Cuánto tiempo debe durar el lavado de manos?', o: ['5 segundos', 'Al menos 20 segundos', 'No hace falta si usa guantes'], c: 1, e: 'Lávese las manos por al menos 20 segundos. Los guantes no sustituyen el lavado.' },
  { id: 'club', q: '¿En qué pan se prepara el Barra Club?', o: ['Pan brioche', 'Tres lonjas de pan cuadrado', 'Pan de agua'], c: 1, e: 'El Barra Club se prepara en tres lonjas de pan cuadrado.' },
  { id: 'cubana', q: '¿Cuál de estos ingredientes lleva La Barra Cubana?', o: ['Pepinillos', 'Piña', 'Salsa BBQ'], c: 0, e: 'La Barra Cubana lleva pierna, queso danés, jamón, pepinillos, mayonesa y mostaza.' },
  { id: 'alitas', q: '¿Cuál de estas salsas puede elegir para las alitas?', o: ['Salsa de chocolate', 'Salsa de fresa', 'Honey Mustard'], c: 2, e: 'Las salsas de las alitas son Honey Mustard, Buffalo y BBQ.' }
];
var MENU_LB = ['labarra/menu-1.jpg', 'labarra/menu-2.jpg'];
