# Catálogo Tienda de Computación

Catálogo online para tu tienda: los clientes ven los productos, arman su carrito
y pagan por transferencia/pago móvil subiendo el comprobante. Del lado
administrador puedes cargar productos (a mano o importando desde un link de
Amazon), registrar reposiciones de stock con su costo, calcular el margen de
ganancia automáticamente, confirmar o rechazar pedidos, registrar ventas hechas
fuera de la página, y ver un reporte de ventas por rango de fechas.

**Stack:** Vue 3 + Vite + Vuetify + Pinia en el frontend. [Supabase](https://supabase.com)
(Postgres + Auth + Storage + Edge Functions) como backend — no hay que escribir
ni mantener un servidor aparte.

---

## 1. Estructura del proyecto

```
src/
  views/public/     Catálogo, producto, carrito, checkout (lo que ve el cliente)
  views/admin/       Panel de administración (login, productos, pedidos, reportes...)
  components/        Piezas reutilizables (tarjeta de producto, formularios)
  services/          Funciones que hablan con Supabase (una por tipo de dato)
  stores/            Estado global: sesión de admin (auth.js) y carrito (cart.js)
  utils/format.js    Formato de moneda/fecha y cálculo de margen

supabase/
  migrations/0001_init.sql   Toda la base de datos: tablas, permisos y reglas de negocio
  functions/                 Funciones que corren en el servidor de Supabase:
    fetch-amazon-product/      lee título/foto/descripción de un link de Amazon
    notify-new-payment/        avisa por email/WhatsApp cuando llega un pago nuevo
```

Toda la lógica de "cuando se crea un pedido, descuenta stock" o "cuando se
agrega un lote, recalcula el costo promedio" vive comentada en
`supabase/migrations/0001_init.sql`. Si en el futuro quieres cambiar esas
reglas, ese es el archivo a editar.

---

## 2. Crear el proyecto de Supabase (una sola vez)

1. Entra a [supabase.com](https://supabase.com), crea una cuenta gratis y un
   **New project**. Guarda la contraseña de la base de datos que te pida.
2. En el menú lateral ve a **SQL Editor** → **New query**, pega **todo** el
   contenido del archivo `supabase/migrations/0001_init.sql` de este proyecto
   y dale a **Run**. Esto crea todas las tablas, reglas de seguridad y buckets
   de fotos.
3. Ve a **Project Settings → API**. Copia la **URL** y la **anon public key**.

### Crear tu usuario de administrador

El panel de admin no tiene registro público (nadie externo puede crearse una
cuenta). Para crear el/los usuarios que van a administrar la tienda:

1. En Supabase, ve a **Authentication → Users → Add user → Create new user**.
2. Pon el email y una contraseña. Desmarca "Auto confirm user" NO, déjalo
   marcado (así no hace falta verificar el email).
3. Con ese email/contraseña entrarán en `/admin/login`.

---

## 3. Configurar y correr el proyecto en tu computadora

```bash
npm install
cp .env.example .env
```

Edita `.env` y pega la URL y anon key que copiaste en el paso anterior:

```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_STORE_NAME=Mi Tienda de Computación
```

Luego:

```bash
npm run dev
```

Abre `http://localhost:5173` para el catálogo público y
`http://localhost:5173/admin/login` para el panel de administración.

---

## 4. Publicar las Edge Functions (importar de Amazon, notificaciones y tasa BCV)

Estas funciones corren en los servidores de Supabase, no en tu compu, así que
hay que subirlas una vez con su CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref TU-PROJECT-REF   # está en Project Settings → General
supabase functions deploy fetch-amazon-product
supabase functions deploy notify-new-payment
supabase functions deploy get-bcv-rate
```

`get-bcv-rate` trae la tasa oficial del Euro (BCV) que se muestra junto al
total en el carrito y el checkout — no necesita ninguna configuración
adicional.

### Notificaciones de pago nuevo (opcional pero recomendado)

Cuando un cliente sube un comprobante, la función `notify-new-payment` intenta
avisarte por **email** (usando [Resend](https://resend.com), tiene plan
gratis) y/o **WhatsApp** (usando [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/),
gratis para avisos a tu propio número). Puedes activar uno, otro, o ambos —
si no configuras las variables de un canal, simplemente no se usa.

```bash
# Email (crea una cuenta gratis en resend.com y saca tu API key)
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set NOTIFY_EMAIL_TO=tuemail@gmail.com
supabase secrets set NOTIFY_EMAIL_FROM=pedidos@tudominio.com

# WhatsApp (sigue las instrucciones de CallMeBot para activar tu número)
supabase secrets set CALLMEBOT_PHONE=584121234567
supabase secrets set CALLMEBOT_APIKEY=123456
```

Nota sobre el import de Amazon: Amazon bloquea seguido este tipo de lectura
automática, así que a veces no va a traer los datos. Cuando eso pase, solo
tienes que completar el nombre, la foto y la descripción a mano — el link de
Amazon queda igual guardado como referencia.

---

## 5. Publicar la página en internet

- **Frontend:** cualquier hosting de sitios estáticos sirve, por ejemplo
  [Vercel](https://vercel.com) o [Netlify](https://netlify.com) (ambos gratis
  para este tamaño de proyecto). Conecta el repositorio, configura las
  variables de entorno del paso 3 en el panel del hosting, y listo — cada
  build corre `npm run build` y sirve la carpeta `dist/`.
- **Backend:** no hay que publicar nada aparte, ya está todo en Supabase.

---

## 6. Cómo usar el panel de administración

- **Productos:** crear/editar, pegar un link de Amazon y darle "Importar"
  para autocompletar, subir varias fotos, poner precio y descuento, marcar si
  está visible en el catálogo.
- **Reponer stock:** cada vez que compras mercancía, aquí registras cuántas
  unidades, cuánto pagaste en total y cuánto de envío — el sistema calcula
  solo el costo por unidad y te muestra el margen contra el precio de venta
  actual.
- **Pedidos y ventas:** los pedidos hechos desde la página quedan
  "Pendientes" con el comprobante adjunto; los confirmas o rechazas (si
  rechazas, el stock se devuelve). El botón "Venta fuera de la página" es
  para registrar algo que vendiste por WhatsApp, en el local, etc.
- **Métodos de pago:** lo que ven los clientes en el checkout (con botón de
  copiar), lo administras aquí.
- **Reporte de ventas:** por defecto muestra el mes actual; puedes cambiar el
  rango de fechas y ver ingresos, costos y ganancia total.
- El **Panel general** muestra ventas del mes, ganancia del mes, pedidos
  pendientes, y los productos más vistos/más vendidos.

---

## 7. Comandos disponibles

```bash
npm run dev       # servidor de desarrollo
npm run build     # genera la carpeta dist/ para producción
npm run preview   # sirve localmente el build de producción
```
