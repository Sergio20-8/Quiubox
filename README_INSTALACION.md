# Instalacion completa del proyecto

Este documento explica como preparar y levantar Quiubox en un entorno local de desarrollo.

## Requisitos

Instalar previamente:

- Go 1.22 o superior.
- Node.js 20 o superior.
- npm.
- PostgreSQL.
- Git.

Opcional para fases posteriores:

- Docker.
- Docker Compose.
- kubectl.
- Kubernetes local, por ejemplo Minikube, Kind o Docker Desktop con Kubernetes.
- OpenVAS en contenedor.
- Nmap instalado en el entorno donde se ejecutara el backend.

## Estructura del proyecto

```text
Quiubox/
  backend/
    cmd/api/
    internal/
    go.mod
  frontend/
    src/
    package.json
  database/
    create_quiuboxdb.sql
    quiuboxdb.sql
    seed_quiuboxdb.sql
  README.md
```

## 1. Clonar el proyecto

```bash
git clone <url-del-repositorio>
cd Quiubox
```

Si ya tienes el proyecto en tu equipo, solo entra a la carpeta raiz:

```bash
cd /ruta/a/Quiubox
```

## 2. Configurar PostgreSQL

Inicia PostgreSQL y asegurese de tener un usuario con permisos. En el entorno local usado por el proyecto se espera:

```text
host: localhost
puerto: 5432
base de datos: quiuboxdb
usuario: postgres
password: root
```

Si tu instalacion usa otra clave o usuario, ajusta el `DATABASE_URL` al levantar el backend.

## 3. Crear base de datos y tablas

Desde la raiz del proyecto:

```bash
psql -U postgres -f database/create_quiuboxdb.sql
psql -U postgres -d quiuboxdb -f database/quiuboxdb.sql
psql -U postgres -d quiuboxdb -f database/seed_quiuboxdb.sql
```

Si PostgreSQL solicita password, ingresa la clave configurada para el usuario `postgres`.

Para verificar la conexion:

```bash
psql "host=localhost port=5432 dbname=quiuboxdb user=postgres password=root sslmode=prefer" -c "SELECT count(*) FROM usuario;"
```

## 4. Instalar dependencias del backend

```bash
cd backend
go mod tidy
```

## 5. Levantar backend

Desde la carpeta `backend`:

```bash
DATABASE_URL='host=localhost port=5432 dbname=quiuboxdb user=postgres password=root connect_timeout=10 sslmode=prefer' \
SESSION_SECRET='quiubox-local-secret' \
SERVER_ADDRESS=':8081' \
go run ./cmd/api
```

El backend debe quedar disponible en:

```text
http://localhost:8081
```

Verificar salud del backend:

```bash
curl http://localhost:8081/health
```

Respuesta esperada:

```text
ok
```

## 6. Instalar dependencias del frontend

En otra terminal, desde la raiz del proyecto:

```bash
cd frontend
npm install
```

## 7. Levantar frontend

Desde la carpeta `frontend`:

```bash
npm start
```

Por defecto Angular intentara usar:

```text
http://localhost:4200
```

Si el puerto esta ocupado, Angular preguntara si deseas usar otro puerto. Responde `Y` y abre la URL que muestre la terminal.

## 8. Configuracion del frontend

El frontend usa el archivo:

```text
frontend/src/environments/environment.ts
```

Configuracion local esperada:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/api',
  useMock: false,
};
```

Si cambias el puerto del backend, actualiza `apiUrl`.

## 9. Probar flujo principal

1. Abre el frontend en el navegador.
2. Inicia sesion o registra un usuario si aplica.
3. Ve a la pantalla de Escaneos.
4. Crea un nuevo escaneo.
5. El registro aparecera como `En ejecucion`.
6. Espera aproximadamente 30 segundos en la demo actual.
7. El backend enviara un evento WebSocket.
8. La tabla de escaneos se actualizara.
9. El resultado aparecera en la pantalla de Resultados.

## 10. Endpoints utiles

Salud:

```http
GET /health
```

Crear escaneo:

```http
POST /api/scans
```

Listar escaneos:

```http
GET /api/scans
```

Consultar detalle:

```http
GET /api/scans/{id}
```

Listar resultados:

```http
GET /api/results/scans
```

WebSocket de escaneos:

```text
ws://localhost:8081/api/ws/scans
```

## 11. Build de verificacion

Backend:

```bash
cd backend
go test ./...
```

Frontend:

```bash
cd frontend
npm run build
```

El build del frontend puede mostrar warnings por dependencias CommonJS usadas por la generacion de PDF. Esos warnings no impiden la compilacion.

## 12. Variables de entorno del backend

Variables principales:

```text
DATABASE_URL
SESSION_SECRET
SERVER_ADDRESS
CORS_ALLOWED_ORIGIN
SESSION_DAYS
```

Ejemplo:

```bash
DATABASE_URL='host=localhost port=5432 dbname=quiuboxdb user=postgres password=root connect_timeout=10 sslmode=prefer'
SESSION_SECRET='quiubox-local-secret'
SERVER_ADDRESS=':8081'
CORS_ALLOWED_ORIGIN='http://localhost:4200'
SESSION_DAYS='7'
```

## 13. Docker y Kubernetes

Para una instalacion productiva o de despliegue se propone separar los componentes:

- Contenedor `frontend`.
- Contenedor `backend`.
- Contenedor `postgres`.
- Contenedor `openvas`.

En Kubernetes se recomienda:

- Deployment para frontend.
- Deployment para backend.
- StatefulSet para PostgreSQL.
- Deployment o StatefulSet para OpenVAS.
- Services internos para backend, postgres y openvas.
- Ingress para exponer frontend y API.
- Secrets para credenciales y JWT secret.
- PersistentVolumes para PostgreSQL y datos de OpenVAS.

La configuracion exacta de manifiestos Kubernetes queda como siguiente fase del proyecto.

## 14. Problemas comunes

### El backend no conecta a PostgreSQL

Revisa:

- PostgreSQL esta encendido.
- La base `quiuboxdb` existe.
- Usuario y password son correctos.
- El puerto `5432` esta disponible.
- `DATABASE_URL` coincide con tu entorno.

### El frontend no consume el backend

Revisa:

- Backend levantado en `8081`.
- `environment.ts` apunta a `http://localhost:8081/api`.
- `CORS_ALLOWED_ORIGIN` permite el origen del frontend.

### El WebSocket no conecta

Revisa:

- Backend levantado.
- Ruta `ws://localhost:8081/api/ws/scans`.
- No hay proxy bloqueando WebSocket.
- El navegador esta usando la misma URL esperada del backend.

### El puerto 4200 esta ocupado

Levanta Angular en otro puerto:

```bash
npm start -- --port 4201
```

Si haces esto, ajusta `CORS_ALLOWED_ORIGIN` del backend:

```bash
CORS_ALLOWED_ORIGIN='http://localhost:4201'
```

## 15. Comandos rapidos

Backend:

```bash
cd backend
DATABASE_URL='host=localhost port=5432 dbname=quiuboxdb user=postgres password=root connect_timeout=10 sslmode=prefer' SESSION_SECRET='quiubox-local-secret' go run ./cmd/api
```

Frontend:

```bash
cd frontend
npm install
npm start
```

Pruebas:

```bash
cd backend && go test ./...
cd frontend && npm run build
```

