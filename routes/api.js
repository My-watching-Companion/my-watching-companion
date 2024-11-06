const router = require("express").Router();
const { executeQuery } = require("../db");
const CrypotJS = require("crypto-js");
const session = require("express-session");
var hour = 1000 * 60 * 20;

function isAuthenticated(req, res, next) {
  return req.session.user ? true : false;
}

// TODO: Implémenter les différentes routes d'API

router.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API de MyWatchingCompanion" });
});

router.post("/login/ok", async (req, res) => {
  const Username = req.body.Username;
  const Password = req.body.Password;
  try {
    const DBPass = await executeQuery(
      `SELECT password from Users where username = ${Username}`
    );
    if (
      Password ===
      CrypotJS.AES.decrypt(DBPass.recordsets[0].password, CRYPTO_KEY)
    ) {
      req.session.user = Username;
      req.session.cookie.expires = new Date(Date.now() + hour);
      req.session.cookie.maxAge = hour;
      res.render("profil");
    } else {
      res.send("Mot de passe incorrect");
    }
  } catch (e) {
    res.send(`Internal server Error : ${e}`);
  }
});

router.post("/register/ok", async (req, res) => {
  const LastName = req.body.LastName;
  const FirstName = req.body.FirstName;
  const BirthDate = req.body.BirthDate;
  const Mail = req.body.Mail;
  const Username = req.body.Username;
  const Password = req.body.Password;
  if(await executeQuery(`SELECT EmailAddress from UsersGeneralInfos where FirstName = '${FirstName}' and LastName = '${LastName}'`).recordsets[0].EmailAddress === Mail){
    res.json({message: 'User already exists'})
  }
  else{
    try {
      await executeQuery(
        `INSERT INTO Users VALUES(0, GETDATE(), GETDATE()) INSERT INTO UsersGeneralInfos  VALUES('${FirstName}','${LastName}','${BirthDate}','${Mail}','Default') INSERT INTO UsersLogin VALUES('${Username}','${Password}',0)`
      );
      res.send("Utilisateur créé avec succès");
    } catch (e) {
      res.send(`Internal server Error : ${e}`);
    }
  }
});

router.get("/isconnected", (req, res) => {
  res.json({ message: isAuthenticated(req) });
});

module.exports = router;
