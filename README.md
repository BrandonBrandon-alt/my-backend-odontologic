# Backend Odontológico

Sistema backend para la gestión de citas y usuarios en una clínica odontológica. Desarrollado con Node.js, Express y PostgreSQL, implementa buenas prácticas de seguridad, validación, notificaciones y control de acceso.

---

## 🚀 Características principales

- **Gestión de usuarios** (registro, login, activación, recuperación de contraseña, perfil)
- **Gestión de pacientes invitados** (citas sin registro, validación y control de abuso)
- **Gestión de citas** (creación, confirmación por email, actualización de estado, prevención de doble booking)
- **Gestión de especialidades, tipos de servicio y disponibilidades**
- **Validación avanzada** con Joi y lógica de negocio
- **Envío de correos automáticos** (confirmación, activación, recuperación)
- **Confirmación de cita por email con token seguro**
- **Protección anti-bots** con Google reCAPTCHA
- **Transacciones atómicas** en operaciones críticas
- **Auditoría y logging de intentos fallidos**
- **Pruebas unitarias y de integración con Jest y Supertest**

---

## 📁 Estructura del Proyecto

```
my-backend-odontologic/
├── src/
│   ├── app.js                # Configuración principal de Express
│   ├── index.js              # Punto de entrada
│   ├── config/               # Configuración de entorno y base de datos
│   ├── controllers/          # Lógica de negocio (citas, usuarios, auth, etc.)
│   ├── dtos/                 # Esquemas de validación y DTOs
│   ├── middleware/           # Middlewares personalizados
│   ├── migrations/           # Migraciones de base de datos
│   ├── models/               # Modelos Sequelize y asociaciones
│   ├── routers/              # Rutas de la API
│   ├── seeders/              # Datos de ejemplo
│   ├── tests/                # Pruebas unitarias y de integración
│   └── utils/                # Utilidades (mailer, validaciones, tokens)
├── package.json              # Dependencias y scripts
└── README.md                 # Documentación
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nombre_base_datos
DB_USER=usuario
DB_PASS=contraseña

# JWT
JWT_SECRET=tu_secreto_jwt
JWT_REFRESH_SECRET=tu_refresh_jwt
JWT_EXPIRES_IN=24h

# Email
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion

# reCAPTCHA
RECAPTCHA_SECRET_KEY=tu_clave_secreta_recaptcha

# URL base para enlaces en correos
BASE_URL=http://localhost:3000
```

---

## 🛠 Instalación y uso

1. **Clona el repositorio:**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd my-backend-odontologic
   ```
2. **Instala dependencias:**
   ```bash
   npm install
   ```
3. **Configura el entorno:**
   ```bash
   cp .env.example .env
   # Edita .env con tus datos
   ```
4. **Prepara la base de datos:**
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```
5. **Inicia el servidor:**
   ```bash
   npm start
   # o en desarrollo
   npm run dev
   ```
6. **Ejecuta las pruebas:**
   ```bash
   npm test
   ```

---

## 📚 Endpoints principales

### Autenticación y usuarios
- `POST /api/register` — Registro de usuario (con reCAPTCHA)
- `POST /api/login` — Login (con reCAPTCHA)
- `POST /api/activate` — Activación de cuenta
- `POST /api/forgot-password` — Solicitar recuperación
- `POST /api/reset-password` — Restablecer contraseña
- `GET /api/user/profile` — Obtener perfil (requiere token)
- `PUT /api/user/profile` — Actualizar perfil
- `PUT /api/user/password` — Cambiar contraseña

### Citas y pacientes invitados
- `POST /api/appointments/guest` — Crear cita como invitado (con reCAPTCHA)
- `GET /api/appointments/confirm/:id?token=...&email=...` — Confirmar cita por email
- `GET /api/appointments` — Listar todas las citas (admin)
- `GET /api/appointments/:id` — Obtener detalles de una cita
- `PATCH /api/appointments/:id/status` — Cambiar estado de cita

### Especialidades, tipos de servicio y disponibilidad
- `GET /api/especialidad` — Listar especialidades
- `GET /api/service-type` — Listar tipos de servicio
- `GET /api/disponibilidad` — Listar disponibilidades

### Otros
- `POST /api/guest-patient` — Registrar paciente invitado

---

## 🧩 Validaciones y lógica de negocio
- **Joi** para validación de datos de entrada
- **Prevención de doble booking** y límite de citas activas por paciente
- **Validación de teléfono y email**
- **Confirmación de cita por email** (token seguro y único)
- **Protección anti-bots** con Google reCAPTCHA
- **Transacciones atómicas** en la creación de citas
- **Mensajes de error claros y específicos**

---

## ✉️ Notificaciones y confirmaciones
- **Correo de confirmación de cita** con botón para confirmar
- **Correo de activación de cuenta y recuperación de contraseña**
- **Enlaces seguros y personalizados**

---

## 🧪 Pruebas
- Pruebas unitarias y de integración con Jest y Supertest
- Cobertura para autenticación, usuarios, citas, especialidades, etc.
- Ejecuta las pruebas con:
  ```bash
  npm test
  ```

---

## 🔒 Seguridad y buenas prácticas
- JWT para autenticación y autorización
- reCAPTCHA en endpoints públicos
- Validación y sanitización de datos
- Control de errores y logging
- Límite de citas activas y prevención de spam
- Uso de HTTPS recomendado en producción

---

## 🛠 Tecnologías principales
- Node.js, Express, PostgreSQL, Sequelize
- Joi, JWT, Nodemailer, Google reCAPTCHA
- Jest, Supertest (testing)

---

## 🤝 Contribución

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

---

## ✨ Autor

Brandon Montealegre- brandonmontealegre15@gmail.com

¿Dudas o sugerencias? ¡Abre un issue o contacta al autor! 