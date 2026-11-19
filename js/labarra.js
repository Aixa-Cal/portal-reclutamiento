/* Contenido de La Barra: inducción (tomado del portal La Barra Talento) y cuestionario del menú */

function dinero(v) { return 'RD$' + String(v || '').replace(/^RD\$/, ''); }

function modulosLaBarra(V) {
  var t = V.tienda || 'su tienda', banco = V.banco, vac = V.vacante || {}, sal = dinero(vac.salario || '17,701.25');
  var nq = netoQuincenal(vac.salario), pu = puestoDe(V.cliente || 'labarra', vac.posicion);
  var diaLibre = textoEntrenamiento(V.cliente || 'labarra', vac.posicion) || 'Tiene un día libre por semana, asignado por su líder.';
  var pago = t === 'Food Shop Miraflores' ?
    { id: 'pago', titulo: 'Su salario y su incentivo', sub: 'Fechas claras, consultas sencillas', p: [
      'Su salario base mensual es ' + sal + '. Se paga en dos quincenas: los días 15 y 30.' + (nq ? ' Cada quincena recibe aproximadamente ' + formatoRD(nq.neto) + ', después de los aportes de ley (AFP' + (nq.isr ? ', SFS e ISR' : ' y SFS') + ').' : ''),
      'Puede recibir un incentivo por desempeño de hasta RD$5,000 mensuales. Su monto depende de la evaluación de su desempeño. Administración le explicará las condiciones y la fecha de pago.',
      diaLibre + ' Si tiene dudas sobre su pago o incentivo, consulte a Administración.'] } :
    { id: 'pago', titulo: 'Su salario y sus propinas', sub: 'Fechas claras, consultas sencillas', p: [
      'Su salario base mensual es ' + sal + '. Se paga en dos quincenas: los días 15 y 30.' + (nq ? ' Cada quincena recibe aproximadamente ' + formatoRD(nq.neto) + ', después de los aportes de ley (AFP' + (nq.isr ? ', SFS e ISR' : ' y SFS') + ').' : ''),
      vac.propina ? 'Su propina asignada mensual inicial es ' + dinero(vac.propina) + '. Se paga el día 5.' + (vac.propinaDespues && vac.propinaDespues !== vac.propina ? ' Después de 3 meses será ' + dinero(vac.propinaDespues) + '.' : '') : 'Administración le explicará las propinas e incentivos de su puesto.',
      'La propina diaria se distribuye al cierre del turno. ' + diaLibre + ' Si tiene dudas de un pago, indique a Administración su nombre, tienda y período.'] };
  var seguridad = t === 'Car Wash Miraflores' ?
    { id: 'seguridad', titulo: 'Su área, equipos y seguridad', sub: 'Trabaje con cuidado', p: [
      'Mantenga limpia y organizada su área de trabajo. Revise el equipo antes de utilizarlo.',
      'Pida entrenamiento antes de usar equipos o productos que no conoce. Siga las indicaciones de su líder y use la protección que le indique.',
      'Reporte de inmediato daños, accidentes o cualquier riesgo. Su líder le mostrará las salidas, el punto de encuentro y el botiquín.'] } :
    { id: 'seguridad', titulo: 'Alimentos, equipos y seguridad', sub: 'Trabaje con cuidado', p: [
      'Lávese las manos; siga las recetas y medidas; mantenga su área limpia; revise condiciones y vencimientos. No cambie ingredientes ni porciones por cuenta propia.',
      'Informe daños, faltantes, desperdicios y riesgos. Si presenta síntomas que puedan afectar la manipulación de alimentos, avise antes de trabajar.',
      'Pida entrenamiento antes de usar equipos que no conoce. Su líder debe mostrarle salidas, punto de encuentro, botiquín y equipos de emergencia.'] };
  var sandw = /sandwich/i.test(vac.posicion || '');
  return [
    { id: 'bienvenida', titulo: '¡Bienvenido/a al equipo de La Barra!', sub: 'Le deseamos mucho éxito en esta nueva etapa', p: [
      'Aquí encontrará la información que necesita para su ingreso y para conocer nuestros procedimientos.',
      (V.turno ? 'Su posición es ' + (vac.posicion || '') + ' en ' + t + ', turno ' + V.turno + '. Su supervisor le confirmará el horario exacto y su día libre.' : 'Al ingresar, se le informará su posición, sucursal, horario y salario.') + ' A su salario se le aplicarán los descuentos de ley.',
      (V.lider ? 'Su líder es ' + V.lider + (V.liderTelefono ? ' (' + V.liderTelefono + ')' : '') + '. Le' : 'Su supervisor le') + ' explicará sus funciones y le acompañará durante su entrenamiento' + (pu && pu.entrenamientoCompleto ? ', que toma ' + pu.entrenamientoCompleto : ', que dura 15 días') + '. Si tiene alguna duda, pregunte antes de realizar una tarea.'] },
    pago,
    { id: 'normas', titulo: 'Presentación y normas de trabajo', sub: 'Prepárese para cada turno', p: [
      'Preséntese puntualmente, con su uniforme completo, limpio y en buenas condiciones.',
      'Mantenga una buena higiene personal y su área de trabajo limpia y organizada.',
      'Cumpla las recetas, medidas y procedimientos que se le enseñen.',
      'Trate con respeto a los clientes y a sus compañeros.',
      'Informe a su supervisor cualquier faltante, daño de equipos o situación que afecte el servicio.',
      'Registre correctamente su entrada y salida en el sistema de asistencia.'] },
    { id: 'servicio', titulo: 'Cómo atendemos al cliente', sub: 'El mismo estándar en cada visita', p: [
      'El saludo es ley. A cada cliente se le dice: "¡Bienvenido a La Barra!".',
      'El orden es siempre el mismo: 1) se toma la orden, 2) se confirma (repítala al cliente), 3) se cobra y 4) se entrega la orden.',
      'Si no puede recordar todo el pedido, anótelo. Es mejor anotar que equivocarse.',
      'Antes de entregar, revise que la orden sea igual a lo que pidió el cliente.'] },
    { id: 'higiene', titulo: 'Higiene personal (normas ServSafe)', sub: 'Esto aplica para todos', p: [
      'Lávese las manos por al menos 20 segundos, con agua tibia y jabón, y séquelas con papel. Hágalo al llegar, después de ir al baño, de tocar dinero, basura, el celular o carne cruda, y cada vez que cambie de tarea.',
      'Use guantes para tocar comida lista para comer. Cámbielos si se rompen o se ensucian, al cambiar de tarea, después de tocar carne cruda y por lo menos cada 4 horas. Los guantes no sustituyen el lavado de manos.',
      'Uñas cortas y limpias, cabello recogido con gorra, sin prendas en manos y muñecas.',
      'No venga a trabajar si tiene vómitos, diarrea, piel u ojos amarillos, o dolor de garganta con fiebre. Avise a su supervisor antes del turno.'] },
    { id: 'temperaturas', titulo: 'Temperaturas y alimentos seguros (ServSafe)', sub: 'Esto aplica para todos', p: [
      'Zona de peligro: entre 5 °C y 57 °C las bacterias crecen rápido. Mantenga los alimentos fuera de esa zona.',
      'Lo frío, frío: neveras a 5 °C o menos. Congeladores a −18 °C o menos.',
      'Lo caliente, caliente: mantenga la comida caliente a 57 °C o más.',
      'Cocción: el pollo debe llegar a 74 °C por dentro. La carne molida (burgers) a 68 °C. Para recalentar, llévelo a 74 °C.',
      'Use el termómetro de alimentos: métalo en la parte más gruesa. Si una nevera o un alimento no está a la temperatura correcta, avise de inmediato a su supervisor.',
      'Un alimento que pasó más de 4 horas en la zona de peligro se bota.',
      'Descongele en la nevera, nunca sobre la mesa.'] },
    { id: 'contaminacion', titulo: 'Evite la contaminación cruzada', sub: 'Cada cosa en su lugar', p: [
      'Use tablas y utensilios separados para lo crudo y lo listo para comer. Lave y desinfecte después de cada uso.',
      'En la nevera, guarde lo listo para comer arriba y las carnes crudas abajo. El pollo crudo va en la parte más baja.',
      'Rote los productos: lo primero que entra es lo primero que sale. Etiquete con fecha y revise los vencimientos. No use nada en mal estado.',
      'Alergias: si un cliente avisa que es alérgico (por ejemplo, al maní, la leche, el huevo, el trigo o los mariscos), avise a su supervisor y evite el contacto con ese ingrediente.'] }
  ].concat(sandw ? [
    { id: 'sandwichero', titulo: 'Para sandwicheros', sub: 'Su puesto es especializado', p: [
      'Cada sándwich tiene su receta, su pan, sus porciones y su orden de armado. Apréndalos con su supervisor y respételos siempre.',
      'Use las medidas exactas. No cambie ingredientes ni porciones por su cuenta.',
      'Carnes, quesos, vegetales y salsas se guardan a 5 °C o menos. El pollo se cocina hasta 74 °C por dentro y las burgers hasta 68 °C. Limpie y desinfecte la plancha y los utensilios.',
      'Fíjese en los detalles del pedido: tipo de pan, queso danés o cheddar, con o sin vegetales.'] }] : []).concat([
    { id: 'comunicacion', titulo: 'Canal de comunicación', sub: 'A quién acudir', p: [
      'Su supervisor es su primer contacto para el trabajo diario: horarios, permisos, ausencias, funciones y novedades de la sucursal.',
      'Para Recursos Humanos y nómina, escriba a Administración al 829-470-8263. Indique su nombre completo, sucursal y el motivo de su consulta.'] },
    { id: 'banco', titulo: 'Cuenta bancaria y pagos', sub: 'Lo necesario para cobrar', p: [
      'En ' + t + ', la nómina se paga por ' + banco + '. Si necesita abrir una cuenta, márquelo en el paso del banco y le enviaremos la carta de nómina por este portal.',
      'Cuando tenga su número de cuenta, súbalo en ese paso para completar el registro. Nunca comparta su PIN, contraseñas ni códigos.',
      'Administración le informará las fechas de pago y cómo consultar su comprobante de nómina.'] },
    { id: 'avances', titulo: 'Avances de propina o salario', sub: 'Mínimo seis meses en la empresa', p: [
      '1. Pida a su supervisor el formulario de avance de propina o salario.',
      '2. Complételo y entréguelo a su supervisor para que lo envíe a Administración.',
      '3. Cuando Administración lo reciba, se tramita el avance.',
      'La solicitud se hace solo con el formulario. La empresa no realiza préstamos.'] },
    { id: 'permisos', titulo: 'Permisos, ausencias y otros trámites', sub: 'Siempre con anticipación', p: [
      'Permisos: pídalos a su supervisor con anticipación. Si una emergencia le impide llegar, avísele lo antes posible.',
      'Licencia médica: informe a su supervisor y envíe el certificado a Administración.',
      'Constancias laborales: pídalas a Administración con anticipación e indique para qué las necesita.',
      'Vacaciones: coordínelas con su supervisor y Administración. Espere la confirmación antes de organizar su ausencia.',
      'Horas extras y feriados: deben quedar registrados y su supervisor los reporta a Administración.',
      'Maternidad: comuníquese con Administración para recibir orientación.',
      'Renuncia: entregue una carta firmada con su nombre, cédula y fecha de salida a su supervisor y a Administración.',
      '¡Contamos con su compromiso con la calidad, la higiene y el buen servicio de La Barra!'] }
  ]);
}

var QUIZ_LB = [
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
