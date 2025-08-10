// index.js
const app = require("./app");
require("./config/validate-env");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(
    `✅ Servidor backend iniciado y escuchando en el puerto ${PORT}.`
  );
});
