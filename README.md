# Backend Odontológico

Backend desarrollado con Node.js y Express para un sistema de gestión odontológica.

## 🚀 Características

- Autenticación y autorización con JWT
- Gestión de usuarios
- Base de datos PostgreSQL con Sequelize ORM
- Validación de datos con Joi
- Sistema de envío de correos electrónicos
- API RESTful
- Sistema de migraciones para la base de datos

## 📋 Prerrequisitos

- Node.js (versión recomendada: 18.x o superior)
- PostgreSQL (versión recomendada: 14.x o superior)
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd my-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```
Editar el archivo `.env` con tus configuraciones locales.

4. Configurar la base de datos:
```bash
# Crear la base de datos en PostgreSQL
createdb [NOMBRE_DE_LA_BASE_DE_DATOS]

# Ejecutar migraciones
npx sequelize-cli db:migrate
```

5. Iniciar el servidor:
```bash
npm start
```

## 📁 Estructura del Proyecto

```
my-backend/
├── config/           # Configuraciones de la aplicación
├── dto/             # Data Transfer Objects
├── middleware/      # Middleware personalizado
├── migrations/      # Migraciones de la base de datos
├── models/          # Modelos de Sequelize
├── routers/         # Rutas de la API
├── tests/           # Pruebas unitarias y de integración
├── utils/           # Utilidades y funciones auxiliares
├── app.js           # Configuración de Express
└── index.js         # Punto de entrada de la aplicación
```

## 🔐 Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nombre_base_datos
DB_USER=usuario
DB_PASSWORD=contraseña

# JWT
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=24h

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
```

## 📚 API Endpoints

### Autenticación
- `POST /register` - Registro de usuarios
- `POST /login` - Inicio de sesión
- `POST /activate` - Activación de cuenta
- `POST /forgot-password` - Recuperación de contraseña
- `POST /reset-password` - Restablecimiento de contraseña

### Usuarios
- `GET /user/profile` - Obtener perfil de usuario
- `PUT /user/profile` - Actualizar perfil
- `PUT /user/password` - Cambiar contraseña

## 🧪 Testing

Ejecutar las pruebas:
```bash
npm test
```

## 🛠 Tecnologías Utilizadas

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Sequelize](https://sequelize.org/)
- [JWT](https://jwt.io/)
- [Joi](https://joi.dev/)
- [Nodemailer](https://nodemailer.com/)
- [Jest](https://jestjs.io/)

## 📝 Scripts Disponibles

- `npm start` - Inicia el servidor
- `npm test` - Ejecuta las pruebas
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## ✨ Autor

[Tu Nombre] - [Tu Email]

---
Si tienes alguna pregunta o sugerencia, no dudes en abrir un issue en el repositorio. 