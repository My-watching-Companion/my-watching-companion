require("dotenv").config();
const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 3000;

const app = express();

// Définition du répertoire des fichiers et moteur de modèles
app.set("views", path.join(__dirname + "/views"));
app.set("view engine", "ejs");

// Définition du dossier de fichiers statiques
app.use(express.static(path.join(__dirname + "/public")));

// Définition des différentes routes
const appRoute = require("./routes/app");
app.use("/", appRoute);

// TODO: Routes d'API
/*
const api = require("./routes/api");
app.use("/api", api);
*/

// Lancement de l'application sur le port spécifié
app.listen(PORT, async () => {
  console.log(`App lancée sur le port ${PORT} : http://localhost:${PORT}/`);
});
