# Albaranes Digitales

App completa (MVP funcional) para generar y firmar albaranes de entrega digitalmente.

## Flujo completo

1. **Registro** (`/registro`) → crea cuenta con email/contraseña (Supabase Auth).
2. **Onboarding** (`/onboarding`) → datos de empresa + logo + **firma fija del usuario**
   (se captura una sola vez y se añade automáticamente a todos los albaranes).
3. **Login** (`/login`) → acceso para sesiones ya creadas.
4. **Middleware** (`src/middleware.ts`) → protege `/dashboard`, `/onboarding` y
   `/albaranes/nuevo`; redirige a `/login` si no hay sesión, y a `/dashboard`
   si ya la hay y visitas login/registro.
5. **Nuevo albarán** (`/albaranes/nuevo`) → cliente (incl. teléfono) + líneas de producto/servicio.
   El **número de albarán se autogenera** (`2026-0001`, `2026-0002`…) por empresa y año,
   mediante un trigger en Supabase — puedes indicar uno manual si lo prefieres.
6. **Detalle del albarán** (`/albaranes/[id]`) → muestra:
   - **QR** con el enlace de firma, listo para escanear en el momento de la entrega.
   - Botón de **enviar por WhatsApp** (prellena el mensaje y el teléfono del cliente si lo indicaste).
   - Enlace/PDF descargable.
7. **Firma del cliente/encargado** (`/albaranes/[id]/firmar`) → página **pública, sin login**,
   pensada para abrirse desde el QR o el enlace de WhatsApp.
8. **PDF** (`/api/albaranes/[id]/pdf`) → documento final con logo, datos de empresa,
   líneas, firma fija de la empresa y firma del cliente.

## Puesta en marcha

### 1. Supabase

Ejecuta en el SQL Editor, **en este orden**:

1. `supabase/schema.sql` — tablas + RLS
2. `supabase/02_public_sign.sql` — función RPC de firma pública + vista pública
3. `supabase/03_numeracion_correlativa.sql` — trigger de numeración automática

Storage — crea 3 buckets:
- `logos` (lectura pública)
- `signatures` (lectura pública, **y** una policy de INSERT para el rol `anon`
  con `bucket_id = 'signatures'`, necesaria para que el cliente pueda firmar sin cuenta)
- `pdfs` (opcional, si en el futuro quieres cachear los PDFs generados)

Auth — activa "Email" como proveedor. Si quieres saltarte la confirmación por email
en desarrollo, desactívala temporalmente en Authentication → Providers → Email.

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)
- `NEXT_PUBLIC_SITE_URL` — imprescindible para que el QR y el enlace de WhatsApp
  apunten a una URL accesible desde el móvil del cliente (no `localhost`, salvo pruebas locales)

### 3. Instalar y arrancar

```bash
npm install
npm run dev
```

### 4. Desplegar en Vercel

```bash
vercel deploy
```

Añade las mismas variables de entorno en el proyecto de Vercel (con
`NEXT_PUBLIC_SITE_URL` apuntando ya a tu dominio de producción).

## Qué queda fuera de este MVP (siguientes pasos razonables)

- Edición/borrado de albaranes ya creados y de la ficha de empresa.
- Reenvío automático (sin clic) del enlace de firma al crear el albarán.
- Multi-idioma (ES/CA).
- Listado y gestión de clientes recurrentes desde una pantalla propia.
- Exportación de albaranes a Excel/CSV para contabilidad.
