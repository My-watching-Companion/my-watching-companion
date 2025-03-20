const express = require("express");
const path = require("path");
const session = require("express-session");
const PORT = process.env.PORT || 3000;
const { CRYPTO_KEY } = require("./config");
const api = require("./routes/api");
const app = express();
app.use(
  session({
    secret: CRYPTO_KEY,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
// Définition du répertoire des fichiers et moteur de modèles
app.set("views", path.join(__dirname + "/views"));
app.set("view engine", "ejs");

// Définition du dossier de fichiers statiques
app.use(express.static(path.join(__dirname + "/public")));

// TODO: Routes d'API

app.use("/api", api);

// Définition des différentes routes
const appRoute = require("./routes/app");
app.use("/", appRoute);

// Lancement de l'application sur le port spécifié
app.listen(PORT, async () => {
  console.log(`App lancée sur le port ${PORT} : http://localhost:${PORT}/`);
});
