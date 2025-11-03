# Implementación de Autenticación - Historias de Usuario

## HU: Registro de Usuario (New User Registration)

### Descripción
Como nuevo usuario, quiero poder registrarme en la aplicación para empezar a reportar residuos y participar en el sistema de recompensas.

### Criterios de Aceptación ✅
- ✅ Registro con email y contraseña
- ✅ Validación de campos y manejo de errores
- ✅ Confirmación de registro exitoso

### Implementación

#### Backend
1. **Modelo de Datos** (`backend/app/models/user.py`)
   - Usuario con id, username, email, hashed_password, points, created_at
   - Relación con reportes

2. **Schemas** (`backend/app/schemas/user.py`)
   - `UserCreate`: validación de email, username (3-50 caracteres), password (mínimo 6)
   - `UserResponse`: respuesta sin contraseña
   - Validación con Pydantic y EmailStr

3. **Servicio de Autenticación** (`backend/app/services/auth_service.py`)
   - `register_user()`: crea usuario con contraseña hasheada (bcrypt)
   - Validación de email/username únicos
   - Manejo de errores de integridad

4. **Seguridad** (`backend/app/core/security.py`)
   - Hash de contraseñas con passlib[bcrypt]
   - Generación de JWT tokens con python-jose
   - Funciones: `get_password_hash()`, `create_access_token()`

5. **Endpoints** (`backend/app/api/v1/auth.py`)
   - `POST /api/v1/auth/register`
   - Status 201 para creación exitosa
   - Error 400 si email/username ya existe

#### Frontend
1. **Servicio API** (`frontend/src/services/api/authService.js`)
   - `register()`: envía datos al endpoint de registro
   - Manejo de errores con mensajes específicos

2. **Pantalla de Registro** (`frontend/src/screens/auth/RegisterScreen.js`)
   - Formulario con campos: username, email, password, confirmPassword
   - Validación en tiempo real:
     - Username: 3-50 caracteres
     - Email: formato válido
     - Password: mínimo 6 caracteres
     - Confirmación de password debe coincidir
   - Estados de loading y error
   - Alert de confirmación al registrarse
   - Navegación a Login tras registro exitoso

---

## HU: Inicio de Sesión (User Login)

### Descripción
Como usuario de la aplicación, quiero iniciar sesión con mis credenciales para acceder a mis reportes y funcionalidades personalizadas.

### Criterios de Aceptación ✅
- ✅ Login con email/contraseña
- ✅ Mostrar mensaje de error si las credenciales son inválidas
- ✅ Al iniciar sesión, el usuario accede a su dashboard

### Implementación

#### Backend
1. **Servicio de Autenticación** (`backend/app/services/auth_service.py`)
   - `authenticate_user()`: verifica email y contraseña
   - `login_user()`: genera JWT token válido por 24 horas (configurable)
   - Verificación de contraseña con passlib

2. **Schemas** (`backend/app/schemas/user.py`)
   - `UserLogin`: email y password
   - `UserLoginResponse`: token + tipo + datos del usuario

3. **Seguridad** (`backend/app/core/security.py`)
   - `verify_password()`: compara password con hash
   - `create_access_token()`: genera JWT con expiración
   - `get_current_user()`: dependency para rutas protegidas
   - OAuth2PasswordBearer para extraer token del header

4. **Endpoints** (`backend/app/api/v1/auth.py`)
   - `POST /api/v1/auth/login`
   - Retorna: access_token (JWT), token_type ("bearer"), user (datos)
   - Error 401 si credenciales incorrectas
   - `GET /api/v1/auth/me`: obtiene usuario actual (requiere auth)

5. **Configuración** (`backend/app/core/config.py`)
   - SECRET_KEY para firmar tokens
   - ALGORITHM: "HS256"
   - ACCESS_TOKEN_EXPIRE_MINUTES: 1440 (24 horas)

#### Frontend
1. **Servicio API** (`frontend/src/services/api/authService.js`)
   - `login()`: envía credenciales y guarda token/usuario en AsyncStorage
   - `logout()`: elimina token y datos locales
   - `getToken()`: obtiene token guardado
   - `getUser()`: obtiene usuario guardado
   - `isAuthenticated()`: verifica si hay token válido
   - `getCurrentUser()`: obtiene datos actualizados del servidor
   - Interceptors de Axios:
     - Request: agrega token JWT automáticamente
     - Response: hace logout automático si token expirado (401)

2. **Pantalla de Login** (`frontend/src/screens/auth/LoginScreen.js`)
   - Formulario con campos: email, password
   - Validación de formato de email
   - Estados de loading y error
   - Manejo de errores 401 (credenciales inválidas)
   - Alert de bienvenida tras login exitoso
   - Navegación a Home tras login
   - Opción "Continuar sin cuenta" (permite uso anónimo)
   - Link a pantalla de registro

3. **Almacenamiento Local**
   - AsyncStorage de React Native
   - Keys: `@zerbin_auth_token`, `@zerbin_user_data`
   - Persistencia entre sesiones

4. **Navegación** (`frontend/src/navigation/AppNavigation.js`)
   - Initial route: Login
   - Rutas de autenticación sin header
   - Navegación protegida (requiere token)

---

## Dependencias Instaladas

### Backend
```bash
python-jose[cryptography]==3.3.0  # JWT encoding/decoding
passlib[bcrypt]==1.7.4            # Password hashing
```

### Frontend
```bash
@react-native-async-storage/async-storage@^2.1.0  # Almacenamiento local
```

---

## Flujo de Autenticación

### Registro
1. Usuario completa formulario en `RegisterScreen`
2. Frontend valida campos y envía POST a `/api/v1/auth/register`
3. Backend valida unicidad de email/username
4. Backend hashea contraseña y crea usuario en DB
5. Backend retorna usuario creado (sin contraseña)
6. Frontend muestra confirmación y navega a Login

### Login
1. Usuario ingresa credenciales en `LoginScreen`
2. Frontend envía POST a `/api/v1/auth/login`
3. Backend verifica email y contraseña
4. Backend genera JWT token con expiración de 24h
5. Backend retorna token + datos del usuario
6. Frontend guarda token y usuario en AsyncStorage
7. Frontend navega a Home
8. Todas las peticiones subsiguientes incluyen el token JWT en header `Authorization: Bearer <token>`

### Rutas Protegidas
1. Frontend obtiene token de AsyncStorage
2. Interceptor de Axios agrega header `Authorization`
3. Backend valida token con dependency `get_current_user`
4. Si token inválido/expirado: error 401
5. Interceptor de respuesta hace logout automático en 401

---

## Endpoints Disponibles

| Método | Ruta | Descripción | Auth Requerida |
|--------|------|-------------|----------------|
| POST | `/api/v1/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/v1/auth/login` | Iniciar sesión | No |
| GET | `/api/v1/auth/me` | Obtener usuario actual | Sí (Bearer token) |

---

## Testing Manual

### Probar Registro
```bash
# Backend debe estar corriendo en http://localhost:8000
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan_test",
    "email": "juan@test.com",
    "password": "password123"
  }'
```

### Probar Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@test.com",
    "password": "password123"
  }'
```

### Probar Ruta Protegida
```bash
# Reemplazar <TOKEN> con el access_token obtenido del login
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Próximos Pasos

1. **Context API de Autenticación**
   - Crear `AuthContext` para gestionar estado global de autenticación
   - Provider que envuelva la navegación
   - Hooks: `useAuth()` para acceder a user/token/login/logout

2. **Persistencia de Sesión**
   - Verificar token al iniciar app
   - Navegar automáticamente a Home si token válido
   - Refresh token para renovar sesión

3. **Protección de Rutas**
   - Middleware de navegación que requiera auth
   - Redirección a Login si no autenticado

4. **Integración con Reportes**
   - Asociar reportes con usuario autenticado
   - Mostrar "Mis Reportes" en dashboard
   - Tracking de puntos ganados

5. **Recuperación de Contraseña**
   - Endpoint para solicitar reset
   - Email con token temporal
   - Pantalla para ingresar nueva contraseña

---

## Notas de Seguridad

- ✅ Contraseñas hasheadas con bcrypt (no se almacenan en texto plano)
- ✅ JWT tokens firmados con SECRET_KEY
- ✅ Tokens con expiración (24 horas)
- ✅ Validación de campos en backend y frontend
- ✅ HTTPS recomendado en producción
- ⚠️ SECRET_KEY debe ser segura y no versionarse (usar .env)
- ⚠️ Implementar rate limiting para prevenir brute force
- ⚠️ Considerar refresh tokens para sesiones más largas
