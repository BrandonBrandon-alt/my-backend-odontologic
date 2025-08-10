const requiredEnv = [
  "DB_USER",
  "DB_HOST",
  "DB_NAME",
  "DB_PASS",
  "DB_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "RECAPTCHA_V3_SECRET_KEY",
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `\nFALTAN VARIABLES DE ENTORNO CRÍTICAS: ${missing.join(", ")}`
  );
  process.exit(1);
}
