# Backend Odontológico

Sistema backend completo para la gestión de citas, usuarios y comunicación en una clínica odontológica. Desarrollado con Node.js, Express y PostgreSQL, implementa buenas prácticas de seguridad, validación, notificaciones, control de acceso y servicio de contacto.

---

## 🚀 Características principales

### 🔐 Gestión de Usuarios y Autenticación
- **Registro y login** con validación de reCAPTCHA
- **Activación de cuenta** por email con código de verificación
- **Recuperación de contraseña** con tokens seguros
- **Gestión de perfiles** y actualización de datos
- **Control de roles** (usuario, dentista, admin)

### 📅 Gestión de Citas
- **Creación de citas** para usuarios registrados e invitados
- **Confirmación por email** con enlaces seguros y botones de acción
- **Prevención de doble booking** y límite de citas activas
- **Actualización de estados** de citas
- **Validación de disponibilidad** en tiempo real

### 👥 Gestión de Pacientes
- **Pacientes registrados** con perfiles completos
- **Pacientes invitados** para citas sin registro previo
- **Validación de datos** y control de abuso
- **Reactivación automática** de pacientes inactivos

### 🏥 Gestión Clínica
- **Especialidades dentales** con descripciones
- **Tipos de servicio** por especialidad
- **Disponibilidades** de dentistas por fecha y hora
- **Asociaciones** entre dentistas y especialidades

### 📧 Servicio de Contacto
- **Formulario de contacto** con validación completa
- **Rate limiting** para prevenir spam (3 mensajes por hora)
- **Envío automático de emails** de confirmación y notificación
- **Almacenamiento** de mensajes en base de datos
- **Validación de datos** con express-validator

### ✉️ Notificaciones y Comunicación
- **Correos automáticos** para confirmación de citas
- **Emails de activación** y recuperación de contraseña
- **Notificaciones de contacto** al administrador
- **Plantillas HTML** profesionales y responsivas

### 🛡️ Seguridad y Validación
- **JWT** para autenticación y autorización
- **Google reCAPTCHA** en endpoints públicos
- **Validación con Joi** y express-validator
- **Rate limiting** en servicios críticos
- **Sanitización** de datos de entrada

---

## 📁 Estructura del Proyecto

```
my-backend-odontologic/
├── src/
│   ├── app.js                    # Configuración principal de Express
│   ├── index.js                  # Punto de entrada del servidor
│   ├── config/
│   │   └── config.js            # Configuración de base de datos
│   ├── controllers/
│   │   ├── auth-controller.js    # Autenticación y registro
│   │   ├── user-controller.js    # Gestión de usuarios
│   │   ├── appointment-controller.js # Gestión de citas
│   │   ├── guest-patient-controller.js # Pacientes invitados
│   │   ├── especialidad-controller.js # Especialidades
│   │   ├── service-type-controller.js # Tipos de servicio
│   │   ├── disponibilidad-controller.js # Disponibilidades
│   │   └── contact-controller.js # Servicio de contacto
│   ├── dtos/
│   │   ├── registro-dto.js      # Validación de registro
│   │   ├── login-dto.js         # Validación de login
│   │   ├── appointment-dto.js   # Validación de citas
│   │   ├── contact-dto.js       # Validación de contacto
│   │   └── ...                  # Otros DTOs
│   ├── middleware/
│   │   ├── auth-middleware.js   # Middleware de autenticación
│   │   ├── contact-validation.js # Validación de contacto
│   │   └── contact-rate-limiter.js # Rate limiting
│   ├── migrations/              # Migraciones de base de datos
│   ├── models/
│   │   ├── index.js             # Configuración de modelos
│   │   ├── user-model.js        # Modelo de usuario
│   │   ├── appointment-model.js # Modelo de cita
│   │   ├── contact-message-model.js # Modelo de contacto
│   │   └── ...                  # Otros modelos
│   ├── routers/
│   │   ├── auth-router.js       # Rutas de autenticación
│   │   ├── user-router.js       # Rutas de usuario
│   │   ├── appointment-router.js # Rutas de citas
│   │   ├── contact-router.js    # Rutas de contacto
│   │   └── ...                  # Otros routers
│   ├── seeders/                 # Datos de ejemplo
│   ├── tests/                   # Pruebas unitarias
│   │   ├── auth/               # Pruebas de autenticación
│   │   ├── appointment/        # Pruebas de citas
│   │   ├── contact/            # Pruebas de contacto
│   │   └── ...                 # Otras pruebas
│   └── utils/
│       ├── mailer.js           # Servicio de emails
│       ├── appointment-validations.js # Validaciones de citas
│       └── confirmation-token.js # Generación de tokens
├── package.json                 # Dependencias y scripts
├── .sequelizerc                # Configuración de Sequelize
└── README.md                   # Documentación
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
ADMIN_EMAIL=admin@clinica.com

# reCAPTCHA
RECAPTCHA_SECRET_KEY=tu_clave_secreta_recaptcha

# URL base para enlaces en correos
BASE_URL=http://localhost:3000

# Rate Limiting (opcional)
RATE_LIMIT_MAX=3
RATE_LIMIT_WINDOW=3600
```

---

## 🛠 Instalación y Configuración

### 1. Prerrequisitos
- **Node.js** (versión 18 o superior)
- **PostgreSQL** (versión 12 o superior)
- **npm** o **yarn**

### 2. Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd my-backend-odontologic
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env con tus datos de base de datos, email, etc.
```

### 5. Configurar la base de datos
```bash
# Crear la base de datos en PostgreSQL
createdb nombre_base_datos

# Ejecutar migraciones
npx sequelize-cli db:migrate

# Cargar datos de ejemplo (opcional)
npx sequelize-cli db:seed:all
```

### 6. Configurar email (Gmail)
1. Activa la verificación en 2 pasos en tu cuenta de Gmail
2. Genera una contraseña de aplicación
3. Usa esa contraseña en `EMAIL_PASS`

### 7. Configurar reCAPTCHA (opcional)
1. Ve a https://www.google.com/recaptcha/
2. Registra tu sitio
3. Usa la clave secreta en `RECAPTCHA_SECRET_KEY`

---

## 🚀 Uso del Proyecto

### Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

### Ejecutar pruebas
```bash
# Todas las pruebas
npm test

# Pruebas específicas
npm test -- src/tests/contact/contact-basic.test.js
```

### Comandos útiles
```bash
# Ver logs en tiempo real
npm run dev

# Ejecutar migraciones
npx sequelize-cli db:migrate

# Revertir migración
npx sequelize-cli db:migrate:undo

# Ejecutar seeders
npx sequelize-cli db:seed:all
```

---

## 📚 Endpoints de la API

### 🔐 Autenticación y Usuarios
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/api/register` | Registro de usuario | No |
| `POST` | `/api/login` | Login de usuario | No |
| `POST` | `/api/activate` | Activación de cuenta | No |
| `POST` | `/api/forgot-password` | Solicitar recuperación | No |
| `POST` | `/api/reset-password` | Restablecer contraseña | No |
| `GET` | `/api/user/profile` | Obtener perfil | Sí |
| `PUT` | `/api/user/profile` | Actualizar perfil | Sí |
| `PUT` | `/api/user/password` | Cambiar contraseña | Sí |

### 📅 Citas y Pacientes
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/api/appointments/guest` | Crear cita como invitado | No |
| `GET` | `/api/appointments/confirm/:id` | Confirmar cita por email | No |
| `GET` | `/api/appointments` | Listar citas (admin) | Sí |
| `GET` | `/api/appointments/:id` | Obtener cita | Sí |
| `PATCH` | `/api/appointments/:id/status` | Cambiar estado | Sí |
| `POST` | `/api/guest-patient` | Registrar paciente invitado | No |

### 🏥 Gestión Clínica
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/api/especialidad` | Listar especialidades | No |
| `GET` | `/api/service-type` | Listar tipos de servicio | No |
| `GET` | `/api/disponibilidad` | Listar disponibilidades | No |

### 📧 Servicio de Contacto
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/api/contact/send-message` | Enviar mensaje de contacto | No |

---

## 📧 Servicio de Contacto

### Estructura del mensaje
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+57 300 123-4567",
  "subject": "consulta",
  "message": "Hola, me gustaría consultar sobre..."
}
```

### Tipos de asunto válidos
- `consulta` - Consulta General
- `cita` - Agendar Cita
- `emergencia` - Emergencia Dental
- `presupuesto` - Solicitar Presupuesto
- `otro` - Otro

### Características del servicio
- ✅ **Validación completa** de datos
- ✅ **Rate limiting** (3 mensajes por hora por IP)
- ✅ **Envío de emails** de confirmación y notificación
- ✅ **Almacenamiento** en base de datos
- ✅ **Protección anti-spam**

---

## 🧩 Validaciones y Lógica de Negocio

### Validaciones de Entrada
- **Joi** para validación de esquemas
- **express-validator** para validación de contacto
- **Sanitización** de datos de entrada
- **Validación de formato** de email y teléfono

### Lógica de Negocio
- **Prevención de doble booking** en citas
- **Límite de citas activas** por paciente
- **Validación de disponibilidad** en tiempo real
- **Reactivación automática** de pacientes inactivos
- **Rate limiting** en servicios críticos

### Seguridad
- **JWT** para autenticación
- **reCAPTCHA** en endpoints públicos
- **Tokens seguros** para confirmación de citas
- **Validación de IP** y User-Agent

---

## ✉️ Sistema de Notificaciones

### Emails Automáticos
- **Confirmación de cita** con enlace seguro
- **Activación de cuenta** con código
- **Recuperación de contraseña** con token
- **Confirmación de contacto** al usuario
- **Notificación de contacto** al administrador

### Características de los Emails
- **Plantillas HTML** profesionales
- **Diseño responsivo** para móviles
- **Enlaces seguros** con tokens únicos
- **Botones de acción** integrados
- **Información detallada** de citas

---

## 🧪 Pruebas

### Ejecutar todas las pruebas
```bash
npm test
```

### Pruebas específicas
```bash
# Pruebas de autenticación
npm test -- src/tests/auth/auth.test.js

# Pruebas de citas
npm test -- src/tests/appointment/guest-appointment.test.js

# Pruebas de contacto
npm test -- src/tests/contact/contact-basic.test.js
```

### Cobertura de pruebas
- ✅ Autenticación y registro
- ✅ Gestión de usuarios
- ✅ Creación de citas
- ✅ Servicio de contacto
- ✅ Validaciones de datos
- ✅ Rate limiting

---

## 🔒 Seguridad y Buenas Prácticas

### Autenticación y Autorización
- **JWT** con refresh tokens
- **Middleware de autenticación** en rutas protegidas
- **Validación de roles** para operaciones críticas

### Protección contra Ataques
- **reCAPTCHA** en formularios públicos
- **Rate limiting** en endpoints críticos
- **Validación de datos** en todos los inputs
- **Sanitización** de datos de entrada

### Manejo de Errores
- **Logging** de errores y eventos
- **Mensajes de error** claros y específicos
- **Transacciones atómicas** en operaciones críticas
- **Rollback automático** en caso de errores

---

## 🛠 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **Sequelize** - ORM para Node.js

### Autenticación y Seguridad
- **JWT** - JSON Web Tokens
- **bcrypt** - Hash de contraseñas
- **Google reCAPTCHA** - Protección anti-bots

### Validación y Testing
- **Joi** - Validación de esquemas
- **express-validator** - Validación de formularios
- **Jest** - Framework de testing
- **Supertest** - Testing de APIs

### Comunicación
- **Nodemailer** - Envío de emails
- **rate-limiter-flexible** - Rate limiting

---

## 🚀 Deployment

### Preparación para Producción
1. **Configurar variables de entorno** para producción
2. **Configurar base de datos** de producción
3. **Configurar email** de producción
4. **Configurar reCAPTCHA** para dominio de producción

### Comandos de Deployment
```bash
# Instalar dependencias de producción
npm install --production

# Ejecutar migraciones
npx sequelize-cli db:migrate

# Iniciar servidor
npm start
```

### Variables de Entorno de Producción
```env
NODE_ENV=production
PORT=3000
DB_HOST=tu_host_produccion
DB_NAME=tu_db_produccion
DB_USER=tu_usuario_produccion
DB_PASS=tu_password_produccion
JWT_SECRET=secreto_muy_seguro_produccion
EMAIL_USER=tu_email_produccion
EMAIL_PASS=tu_password_email_produccion
ADMIN_EMAIL=admin@tudominio.com
RECAPTCHA_SECRET_KEY=tu_recaptcha_produccion
BASE_URL=https://tu-dominio.com
```

---

## 🤝 Contribución

### Cómo Contribuir
1. **Fork** del proyecto
2. **Crea una rama** para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abre un Pull Request**

### Estándares de Código
- **ESLint** para linting
- **Prettier** para formateo
- **Conventional Commits** para mensajes de commit
- **Pruebas** para nuevas funcionalidades

### Reportar Bugs
- Usa el sistema de **Issues** de GitHub
- Incluye **pasos para reproducir**
- Adjunta **logs de error** si es posible
- Especifica **versión** y **entorno**

---

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

---

## 👨‍💻 Autor

**Brandon Montealegre**
- 📧 Email: brandonmontealegre15@gmail.com
- 🔗 GitHub: [Tu usuario de GitHub]
- 💼 LinkedIn: [Tu perfil de LinkedIn]

---

## 📞 Soporte

### Contacto
- **Email**: brandonmontealegre15@gmail.com
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/my-backend-odontologic/issues)

### Documentación Adicional
- **API Documentation**: [Swagger/OpenAPI](link-a-documentacion)
- **Guía de Deployment**: [Guía completa](link-a-guia)
- **Troubleshooting**: [Solución de problemas](link-a-troubleshooting)

---

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] **Dashboard administrativo** con estadísticas
- [ ] **Sistema de notificaciones push**
- [ ] **Integración con calendarios** (Google Calendar, Outlook)
- [ ] **Sistema de pagos** integrado
- [ ] **API para móviles** (React Native, Flutter)
- [ ] **Sistema de recordatorios** automáticos
- [ ] **Reportes y analytics** avanzados

### Mejoras Técnicas
- [ ] **Docker** para containerización
- [ ] **Redis** para caché y sesiones
- [ ] **WebSockets** para notificaciones en tiempo real
- [ ] **Microservicios** para escalabilidad
- [ ] **CI/CD** automatizado

---

¿Dudas o sugerencias? ¡Abre un issue o contacta al autor! 🚀 