/* Contenido de La Barra: inducción (tomado del portal La Barra Talento) y cuestionario del menú */

function dinero(v) { return 'RD$' + String(v || '').replace(/^RD\$/, ''); }

function modulosLaBarra(V) {
  var t = V.tienda || 'su tienda', banco = V.banco, vac = V.vacante || {}, sal = dinero(vac.salario || '17,701.25');
  var pago = t === 'Food Shop Miraflores' ?
    { id: 'pago', titulo: 'Su salario y su incentivo', sub: 'Fechas claras, consultas sencillas', p: [
      'Su salario base mensual es ' + sal + '. Se paga en dos partes: los días 15 y 30, con los descuentos correspondientes.',
      'Puede recibir un incentivo por desempeño de hasta RD$5,000 mensuales. Su monto depende de la evaluación de su desempeño. Administración le explicará las condiciones y la fecha de pago.',
      'Tiene un día libre por semana, asignado por su líder. Si tiene dudas sobre su pago o incentivo, consulte a Administración.'] } :
    { id: 'pago', titulo: 'Su salario y sus propinas', sub: 'Fechas claras, consultas sencillas', p: [
      'Su salario base mensual es ' + sal + '. Se paga en dos partes: los días 15 y 30, con los descuentos correspondientes.',
      vac.propina ? 'Su propina asignada mensual inicial es ' + dinero(vac.propina) + '. Se paga el día 5.' + (vac.propinaDespues && vac.propinaDespues !== vac.propina ? ' Después de 3 meses será ' + dinero(vac.propinaDespues) + '.' : '') : 'Administración le explicará las propinas e incentivos de su puesto.',
      'La propina diaria se distribuye al cierre del turno. Tiene un día libre por semana, asignado por su líder. Si tiene dudas de un pago, indique a Administración su nombre, tienda y período.'] };
  var seguridad = t === 'Car Wash Miraflores' ?
    { id: 'seguridad', titulo: 'Su área, equipos y seguridad', sub: 'Trabaje con cuidado', p: [
      'Mantenga limpia y organizada su área de trabajo. Revise el equipo antes de utilizarlo.',
      'Pida entrenamiento antes de usar equipos o productos que no conoce. Siga las indicaciones de su líder y use la protección que le indique.',
      'Reporte de inmediato daños, accidentes o cualquier riesgo. Su líder le mostrará las salidas, el punto de encuentro y el botiquín.'] } :
    { id: 'seguridad', titulo: 'Alimentos, equipos y seguridad', sub: 'Trabaje con cuidado', p: [
      'Lávese las manos; siga las recetas y medidas; mantenga su área limpia; revise condiciones y vencimientos. No cambie ingredientes ni porciones por cuenta propia.',
      'Informe daños, faltantes, desperdicios y riesgos. Si presenta síntomas que puedan afectar la manipulación de alimentos, avise antes de trabajar.',
      'Pida entrenamiento antes de usar equipos que no conoce. Su líder debe mostrarle salidas, punto de encuentro, botiquín y equipos de emergencia.'] };
  return [
    { id: 'bienvenida', titulo: 'Bienvenido/a a La Barra', sub: 'Su equipo y sus primeros pasos', p: [
      'Somos Inversiones BA AR, S.R.L. Nuestro compromiso es la calidad, la higiene y el buen servicio.',
      'Su líder le explicará sus funciones y le acompañará durante el entrenamiento. Pregunte antes de realizar una tarea que no conoce.',
      'Confirme con Administración su sucursal, fecha de ingreso, horario y persona que le recibirá.'] },
    pago,
    { id: 'banco', titulo: 'Su banco y su seguro médico', sub: 'Lo necesario para su registro', p: [
      'En ' + t + ', la nómina se paga por ' + banco + '. Si no tiene cuenta allí, márquelo en el paso del banco. Administración le enviará una carta por este portal.',
      'Después de abrir su cuenta, suba una constancia con su nombre y número. Nunca comparta PIN, contraseñas ni códigos.',
      'Informe su ARS. Si no tiene, indíquelo para que Administración le oriente. La cobertura efectiva debe confirmarla Administración.'] },
    { id: 'uniforme', titulo: 'Uniforme, higiene y asistencia', sub: 'Prepárese para cada turno', p: [
      'Use gorra y camiseta del uniforme limpias, pantalón jean o negro y calzado autorizado. No se permiten chancletas.',
      'Llegue puntual y registre entrada y salida. Si el sistema falla o se le olvida registrar, avise a su líder ese mismo día.',
      'Solicite permisos con anticipación. No cambie turnos ni días libres sin autorización. Ante una emergencia, avise lo antes posible. Evite el uso del celular durante sus labores.'] },
    seguridad,
    { id: 'servicio', titulo: 'Atención al cliente', sub: 'Un mismo estándar en cada visita', p: [
      'Salude, dé la bienvenida e identifíquese. Escuche con atención, confirme si el pedido es para consumir o para llevar y anote las preferencias.',
      'Repita el pedido, informe el tiempo estimado y mantenga al cliente al tanto de retrasos. Verifique la orden antes de entregarla y mantenga el área limpia.',
      'Trate con respeto a clientes y compañeros. Ante una queja que no pueda resolver, pida apoyo a su líder. Los precios y tiempos deben confirmarse con su líder.'] },
    { id: 'tramites', titulo: 'Solicitudes y comunicación', sub: 'A quién acudir', p: [
      'Su primer contacto es su líder para funciones, horarios, permisos y novedades. Administración / RR. HH. y nómina: 829-470-8263. Si la situación involucra a su líder, comuníquela directamente a Administración.',
      'Avances: mínimo seis meses; solicite el formulario a su supervisor, complételo, fírmelo y entréguelo para trámite. La empresa no realiza préstamos.',
      'Vacaciones: coordine con su líder y Administración; la guía contempla 14 días al cumplir el primer año. Licencia médica: avise y envíe el certificado.',
      'Registre horas extras y feriados y confirme su reporte. Para renunciar, entregue carta firmada con nombre, cédula y fecha de salida.'] }
  ];
}

var QUIZ_LB = [
  { id: 'club', q: '¿En qué pan se prepara el Barra Club?', o: ['Pan brioche', 'Tres lonjas de pan cuadrado', 'Pan de agua'], c: 1, e: 'El Barra Club se prepara entre tres lonjas de pan cuadrado.' },
  { id: 'cubana', q: '¿Cuál de estos ingredientes lleva La Barra Cubana?', o: ['Pepinillos', 'Piña', 'Salsa BBQ'], c: 0, e: 'La Barra Cubana lleva pierna, queso danés, jamón, pepinillos, mayonesa y mostaza.' },
  { id: 'alitas', q: '¿Cuál de estas salsas puede elegir para las alitas?', o: ['Salsa de chocolate', 'Salsa de fresa', 'Honey Mustard'], c: 2, e: 'Las salsas de alitas del menú son Honey Mustard, Búfalo y BBQ.' },
  { id: 'familiar', q: '¿Cuántas porciones tiene el Club Familiar?', o: ['4 porciones', '8 porciones', '12 porciones'], c: 1, e: 'El Club Familiar del menú tiene 8 porciones.' },
  { id: 'pedido', q: 'Antes de entregar un pedido, ¿qué debe hacer?', o: ['Entregarlo sin revisarlo', 'Cambiar lo pedido si falta algo', 'Revisar que coincida con el pedido del cliente'], c: 2, e: 'Antes de entregar, verifique que la orden coincida con lo que pidió el cliente.' },
  { id: 'equipo', q: 'Si no sabe utilizar un equipo, ¿qué debe hacer?', o: ['Pedir entrenamiento a su líder antes de usarlo', 'Probarlo sin ayuda', 'Pedir a un cliente que le explique'], c: 0, e: 'Pida entrenamiento antes de usar equipos que no conoce.' }
];
var MENU_LB = ['labarra/menu-1.jpg', 'labarra/menu-2.jpg'];
