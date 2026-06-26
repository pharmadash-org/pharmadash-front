# PharmaDash — Frontend

Aplicación Angular 17 para gestión de inventario farmacéutico con autenticación
**Microsoft Entra ID** (MSAL, Authorization Code Flow + PKCE).

## Stack

- Angular 17 (standalone components, lazy loading)
- Angular Material + tema azul farmacéutico (`#1565C0`)
- `@azure/msal-angular` + `@azure/msal-browser`
- `ng2-charts` / Chart.js para el gráfico del dashboard
- Reactive Forms, HttpClient con interceptores

## Requisitos

- Node.js 20+
- npm 10+
- El backend corriendo en `http://localhost:3000` (CORS ya habilitado para `http://localhost:4200`)

## Instalación

```bash
npm install
```

## Configuración del entorno

1. Copia el archivo de ejemplo:

   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```

2. Reemplaza `<FRONTEND_CLIENT_ID>` por el **Application (client) ID** del
   registro SPA *PharmaDash Frontend* (ver sección siguiente). El resto de
   valores ya están preconfigurados:

   | Clave        | Valor                                                              |
   | ------------ | ------------------------------------------------------------------ |
   | `tenantId`   | `deca26fd-d64e-49f4-95ed-87ecaf3e0e47`                             |
   | `apiUrl`     | `http://localhost:3000/api/v1`                                     |
   | `scopes`     | `api://8b0c8ee9-27b9-4707-9ec1-be36ab90ea63/access_as_user`        |
   | `redirectUri`| `http://localhost:4200`                                            |

> `src/environments/environment.ts` está en `.gitignore` para no versionar el
> client id real. `environment.example.ts` se mantiene en el repo.

## Ejecutar en desarrollo

```bash
npm start
```

Levanta la app en `http://localhost:4200` usando `proxy.conf.json`, que
redirige `/api` y `/health` al backend en `http://localhost:3000`.

## Pruebas

```bash
# modo watch
npm test

# una sola corrida con cobertura (headless)
npm run test:ci
```

El reporte de cobertura se genera en `coverage/`. La cobertura objetivo
(>80 %) se concentra en **servicios, guards, interceptores, directiva, pipe y
validador**.

## Build de producción

```bash
npm run build
```

---

## Registrar la app SPA en Microsoft Entra ID

El **backend ya tiene su propio registro** (client id
`8b0c8ee9-27b9-4707-9ec1-be36ab90ea63`). El frontend necesita un **registro
SPA independiente**:

1. **Portal de Azure → Microsoft Entra ID → App registrations → New registration**
   - **Name**: `PharmaDash Frontend`
   - **Supported account types**: *Accounts in this organizational directory only*
   - **Redirect URI**: selecciona **Single-page application (SPA)** e ingresa
     `http://localhost:4200`.
   - Registra y copia el **Application (client) ID** → va en
     `environment.ts > msalConfig.clientId`.

2. **Authentication**
   - Confirma que la plataforma es **SPA** (esto habilita Authorization Code
     Flow con **PKCE**; **no** marques *Implicit grant*).
   - Agrega también `http://localhost:4200` como redirect SPA si no está.
   - En **Front-channel logout URL** / *Logout* puedes usar
     `http://localhost:4200/login`.

3. **API permissions**
   - **Add a permission → My APIs →** selecciona la API del backend
     (`8b0c8ee9-...`).
   - Marca el scope delegado **`access_as_user`**.
   - Pulsa **Grant admin consent** para el tenant.

4. **App roles (en el registro del BACKEND / API)**
   - Los roles de aplicación se definen en el registro de la API y se asignan a
     usuarios/grupos en **Enterprise applications → Users and groups**.
   - Roles esperados por el frontend (case-sensitive):
     - `Admin` — inventario CRUD + ventas + dashboard
     - `Vendedor` — inventario solo lectura + ventas
   - El claim `roles` llega en el token y el frontend lo lee para autorizar
     rutas y elementos de UI.

5. El backend hace **upsert** del usuario al validar el token: **no existe
   pantalla ni flujo de registro** en el frontend.

### Resumen de identificadores

| Recurso            | Valor                                                       |
| ------------------ | ----------------------------------------------------------- |
| Tenant ID          | `deca26fd-d64e-49f4-95ed-87ecaf3e0e47`                      |
| Backend Client ID  | `8b0c8ee9-27b9-4707-9ec1-be36ab90ea63`                      |
| Backend scope      | `api://8b0c8ee9-27b9-4707-9ec1-be36ab90ea63/access_as_user` |
| Frontend Client ID | *(tu registro SPA — colócalo en `environment.ts`)*          |

---

## Estructura

```
src/app/
├── core/
│   ├── auth/          # AuthService, guards, msal.config
│   ├── interceptors/  # error, correlation-id, loading
│   ├── models/        # tipos (medication, sale, kpi)
│   ├── services/      # loading.service
│   └── utils/         # unwrap()
├── features/
│   ├── dashboard/     # KPIs + gráfico top-sold (solo Admin)
│   ├── login/
│   ├── medications/   # listado CRUD + form dialog
│   ├── sales/         # carrito + autocomplete
│   └── unauthorized/
└── shared/
    ├── components/    # layout, header, sidebar, confirm-dialog
    ├── directives/    # *appHasRole
    ├── pipes/         # currencyCop
    └── validators/    # futureDate
```

## Roles y rutas

| Ruta            | Acceso             | Guard                         |
| --------------- | ------------------ | ----------------------------- |
| `/login`        | Público            | —                             |
| `/unauthorized` | Público            | —                             |
| `/dashboard`    | **Admin**          | `authGuard` + `roleGuard`     |
| `/medications`  | Admin / Vendedor   | `authGuard`                   |
| `/sales`        | Admin / Vendedor   | `authGuard`                   |

- **Admin**: CRUD de inventario, ventas y dashboard.
- **Vendedor**: inventario en solo lectura (sin botones de acción) y ventas;
  sin acceso al dashboard.

## Notas de integración

- El `price` llega como **string** (Prisma Decimal) → se parsea con
  `parseFloat()` antes de operar.
- `isCriticalStock` e `isNearExpiry` vienen **calculados del backend**; el
  frontend solo los muestra.
- El carrito de ventas es **estado local** del componente; nunca se persiste
  hasta pulsar *Procesar venta*.
- `DELETE` responde **204 sin body**; se maneja sin parsear JSON.
```
