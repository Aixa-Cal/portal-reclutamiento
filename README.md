# Portal de Reclutamiento · Asesores Técnicos Empresariales

Portal de depuración y completación de expedientes para personal **subcontratado** (Altice Dominicana, Seguros Crecer) y, más adelante, para **Grupo La Barra**.

- **Panel RRHH:** `https://aixa-cal.github.io/portal-reclutamiento/`
- **Enlace del candidato:** se genera solo, uno por candidato (`c.html?t=…`)

## Cómo funciona

1. En el panel, **+ Nuevo candidato**: cliente, nombre, teléfono, posición, salario y sexo (uso interno).
2. Botón **Enviar por WhatsApp**: el mensaje sale listo con su enlace.
3. El candidato completa 11 pasos en orden desde su celular. Ve sus condiciones y su plazo de 3 días.
4. En el panel usted ve en qué etapa está cada candidato: *Enlace enviado → Completando x/11 → En depuración → Expediente listo → Enviado al cliente*.
5. Revisa cada documento (✓ aprobar / ✕ rechazar con motivo; el candidato ve el motivo y lo vuelve a subir).
6. Depuración: **evaluación pre empleo**, **referencia laboral** y **familiares en la empresa**.
7. **⬇ Expediente completo (PDF)**: portada con la depuración + todos los documentos en orden, en un solo PDF para el cliente. También en ZIP.

### Firma según el cliente
| Cliente | Solicitud y declaración |
|---|---|
| Altice | Se descargan, imprimen, firman **a mano** y se suben escaneadas. El candidato además responde en el portal si tiene familiares en Altice. |
| Seguros Crecer | Se llenan **en el portal** y se firman con el dedo. Se genera un PDF con firma, fecha, dispositivo y código de verificación. |

### Evaluación pre empleo (Laboratorios Referencia)
- El panel muestra la prueba a solicitar: **mujeres: Panel 2 + BHCG · hombres: Panel 2**. Solo lo ve RRHH.
- El candidato **nunca** ve el tipo de prueba. Solo ve: "evaluación pre empleo para confirmar que está apto para trabajar, vaya con su cédula, de parte de ATE, no paga nada".
- Usted genera el referimiento en el portal del laboratorio, marca **Referimiento generado** y le avisa por WhatsApp (botón listo).
- Registra el resultado (Apto / No apto) y sube el PDF del laboratorio.

## Dónde se guardan los datos
Los candidatos y sus documentos **no** se guardan en GitHub. Se guardan en **su Google Drive** (carpeta *Portal Reclutamiento ATE*, una subcarpeta por cliente y por candidato) y en una hoja de Google Sheets.

## Instalación (una sola vez, 10 minutos)
1. Entre a <https://script.google.com> con la cuenta de Google donde quiere guardar los expedientes → **Nuevo proyecto**.
2. Borre lo que aparece y pegue **todo** el contenido de [`backend/Code.gs`](backend/Code.gs).
3. Guarde (💾). La clave del panel se crea sola: la primera clave con la que entre al panel (mínimo 8 caracteres) queda guardada.
4. Arriba, elija la función **instalar** y presione **Ejecutar**. Acepte los permisos (Drive, Sheets y correo).
5. **Implementar → Nueva implementación → Aplicación web**. *Ejecutar como:* Yo. *Quién tiene acceso:* Cualquier usuario. → **Implementar**. Copie la URL (termina en `/exec`).
6. Pegue esa URL en [`config.js`](config.js) en `API_URL` (o envíesela a Claude para que la conecte).

Mientras `API_URL` esté vacío, el portal funciona en **modo demostración** (clave `demo`, datos solo en ese navegador).

> Si cambia `Code.gs` más adelante: **Implementar → Gestionar implementaciones → Editar → Nueva versión**, para mantener la misma URL.

## Agregar otro cliente
En `js/core.js`, copie un bloque dentro de `CLIENTES` (nombre, razón social, firma `manuscrita` o `digital`, vacante por defecto). Para formularios manuscritos, ponga el PDF en `formularios/`. Luego copie de nuevo `backend/Code.gs` a Apps Script (se genera con `core.js` al final).

## Archivos
- `index.html` + `js/admin.js` — panel RRHH
- `c.html` + `js/candidato.js` + `js/formularios.js` — portal del candidato
- `js/core.js` — reglas: clientes, documentos, etapas (compartido con el servidor)
- `js/pdfutil.js` — formularios firmados y expediente PDF
- `backend/Code.gs` — servidor en Google Apps Script

---
RRHH – Asesores Técnicos Empresariales, SRL
