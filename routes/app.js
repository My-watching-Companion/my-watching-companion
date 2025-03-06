const router = require("express").Router();
const { getAccount } = require("../controllers/app/account");
const { getDiscovery } = require("../controllers/app/discovery");
const { getError } = require("../controllers/app/error");
const { getForgotPassword } = require("../controllers/app/forgot-password");
const { getHome } = require("../controllers/app/home");
const settingsControllers = require("../controllers/app/settings");
const signControllers = require("../controllers/app/sign-in-up");
const { getWatchlists } = require("../controllers/app/watchlists");
const { isAuthenticated } = require("../controllers/functions");

// Définition de la route principale
router.get("/", getHome);

router.get("/signin", signControllers.getSignin);

router.get("/signup", signControllers.getSignup);

router.get("/settings", isAuthenticated, settingsControllers.getSettings);

router.get(
  "/settings/:cat/:sett",
  isAuthenticated,
  settingsControllers.getSettingsByCatAndPage
);

router.get("/discovery", isAuthenticated, getDiscovery);

router.get("/my-watchlist", isAuthenticated, getWatchlists);

router.get("/account", getAccount);

router.get("/forgot-password", getForgotPassword);

// Définition de la route erreur 404
router.get("*", getError);

module.exports = router;
