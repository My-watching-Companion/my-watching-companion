const router = require("express").Router();
const { executeQuery } = require("../db");
const CryptoJS = require("crypto-js");
const session = require("express-session");
const { CRYPTO_KEY, TMDB_API_KEY } = require("../config");
const path = require("path");
const multer = require("multer");

const {
  isAuthenticated,
  ChangeSession,
  CheckAge,
  GetUser,
  TraceLogs,
  TraceError,
} = require("../controllers/functions");

const express = require("express");
const {
  loginOK,
  registerOK,
  modifyBio,
  changePP,
  changeGender,
  getUsersByUsername,
  getConfidentialityByUsername,
  changeConfidentialityUser,
} = require("../controllers/backend/users");

const {
  addFriends,
  removeFriends,
  getUsersWithoutFriends,
  getFriendsByUser,
} = require("../controllers/backend/friends");

const {
  getWatchlistsByUsername,
  getWatchlistByUsernameAndListname,
  getUsersLists,
  addArtworkToList,
} = require("../controllers/backend/watchlists");

const {
  getCreatorOfArtwork,
  getAllNatures,
  getUsersArtworks,
  searchArtworks,
} = require("../controllers/backend/artworks");

const {
  getSecurityQuestions,
  getAllSecurityQuestions,
  checkSecurityAnswer,
} = require("../controllers/backend/security");

router.use(express.json());
router.use(express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${path.join("public/UsersProfilePicture/")}`); // Assure-toi que le dossier "uploads" existe
  },
  filename: (req, file, cb) => {
    cb(null, req.session.user.id + ".png");
  },
});

const uploads = multer({ storage: storage });

//! Route API pour Insérer / modifier en base

router.post("/login/ok", loginOK);

router.post("/register/ok", registerOK);

router.get("/addfriends/:user/:friends", addFriends);

router.get("/removefriends/:user/:friend", removeFriends);

router.post("/modifybio", isAuthenticated, modifyBio);

router.post("/changePP", uploads.single("file"), isAuthenticated, changePP);

router.get("/modifygender/:gender", isAuthenticated, changeGender);

//! Route API pour chercher des choses

router.get("/getuserswithoutfriends/:user", getUsersWithoutFriends);

router.get("/users/:u", getUsersByUsername);

router.get("/users/:u/watchlists", getWatchlistsByUsername);

router.get("/users/:u/watchlists/:w", getWatchlistByUsernameAndListname);

router.get("/getconfidentiality/:user", getConfidentialityByUsername);

router.get("/artwork/:a/creator", getCreatorOfArtwork);

router.get("/modifyconfidentiality/:conf/:user",isAuthenticated,changeConfidentialityUser);

router.get("/friends/:user", getFriendsByUser);

router.get("/securityquestions", getAllSecurityQuestions);

router.get("/getallnature", getAllNatures);

router.post("/getsecurityquestion", getSecurityQuestions);

router.post("/checksecurityanswer", checkSecurityAnswer);

router.post(
  "/changepassword",
  async (req, res, next) => {
    if (!req.body.email || !req.body.response)
      return res.json({ error: "Veuillez remplir tous les champs." });

    const email = req.body.email;
    const response = req.body.response;

    try {
      const query = await executeQuery(
        `SELECT SecurityQuestionAnswer from Users WHERE EmailAddress = '${email}'`
      );

      if (query.length === 0)
        return res.json({
          error: "Aucun compte n'est associé à cette adresse email.",
        });

      if (query[0].SecurityQuestionAnswer !== response)
        return res.json({ error: "La réponse est incorrecte." });

      next();
    } catch (e) {
      return res.json({
        error: "Une erreur est survenue lors de la vérification de la réponse.",
      });
    }
  },
  async (req, res) => {
    if (!req.body.email || !req.body.response || !req.body.password)
      return res.json({ error: "Veuillez remplir tous les champs." });

    const { email, response, password } = req.body;

    try {
      await executeQuery(
        `UPDATE Users SET Password = '${CryptoJS.AES.encrypt(
          password,
          CRYPTO_KEY
        )}' WHERE EmailAddress = '${email}' AND SecurityQuestionAnswer = '${response}'`
      );

      return res.json({ success: true });
    } catch (error) {
      return res.json({
        error:
          "Une erreur est survenue lors de la modification de votre mot de passe.",
      });
    }
  }
);

router.get("/getuserartworks", isAuthenticated, getUsersArtworks);

router.get("/getuserlists", isAuthenticated, getUsersLists);

router.post("/searchartworks", searchArtworks);

router.post("/addartworktolists", isAuthenticated, addArtworkToList);

module.exports = { router, isAuthenticated, GetUser, CheckAge };
