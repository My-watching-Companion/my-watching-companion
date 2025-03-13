const router = require("express").Router();
const path = require("path");
const multer = require("multer");

const {
  isAuthenticated,
  refreshSession,
  validateSession,
} = require("../controllers/functions");

const usersController = require("../controllers/backend/users");
const friendsController = require("../controllers/backend/friends");
const watchlistsController = require("../controllers/backend/watchlists");
const artworksController = require("../controllers/backend/artworks");
const securityController = require("../controllers/backend/security");
const commentsController = require("../controllers/backend/comments");

const express = require("express");
router.use(express.json());
router.use(express.static("uploads"));
router.use(refreshSession);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${path.join("public/UsersProfilePicture/")}`); // Assure-toi que le dossier "uploads" existe
  },
  filename: (req, file, cb) => {
    cb(null, req.session.user.id + ".png");
  },
});

const uploads = multer({ storage: storage });

// Authentication
router.post("/login/ok", usersController.loginOK);
router.post("/register/ok", usersController.registerOK);
router.post("/logout", usersController.logout);
router.get("/check-session", validateSession, (req, res) => {
  res.json({ status: "OK", user: { username: req.session.user.username } });
});

// Users
router.post(
  "/updateuser",
  uploads.single("file"),
  isAuthenticated,
  usersController.updateUser
);

// Security
router.get("/securityquestions", securityController.getAllSecurityQuestions);
router.post(
  "/getsecurityquestion",
  securityController.getSecurityQuestionByUserEmail
);
router.post("/checksecurityanswer", securityController.checkSecurityAnswer);
router.post("/changepassword", securityController.changePassword);

// Friends
router.get("/addfriends/:user/:friends", friendsController.addFriends);
router.get("/removefriends/:user/:friend", friendsController.removeFriends);

//! Route API pour chercher des choses
router.get(
  "/getuserswithoutfriends/:user",
  friendsController.getUsersWithoutFriends
);

router.get("/users/:u", usersController.getUsersByUsername);

router.get(
  "/getconfidentiality/:user",
  usersController.getConfidentialityByUsername
);

router.get("/artwork/:a/creator", artworksController.getCreatorOfArtwork);

router.get(
  "/modifyconfidentiality/:conf/:user",
  isAuthenticated,
  usersController.changeConfidentialityUser
);

router.get("/friends/:user", friendsController.getFriendsByUser);

router.get("/getallnature", artworksController.getAllNatures);

router.get(
  "/getuserartworks",
  isAuthenticated,
  artworksController.getUsersArtworks
);

router.post("/searchartworks", artworksController.searchArtworks);

// Watchlists
router.get(
  "/users/:u/watchlists",
  watchlistsController.getWatchlistsByUsername
);

router.get(
  "/users/:u/watchlists/:w",
  watchlistsController.getWatchlistByUsernameAndListname
);

// Logged User Watchlists
router.get(
  "/user/watchlists",
  isAuthenticated,
  watchlistsController.getUserWatchlists
);

router.get(
  "/user/watchlists/:name",
  isAuthenticated,
  watchlistsController.getUserWatchlistByName
);

router.post(
  "/user/watchlists",
  isAuthenticated,
  watchlistsController.createUserWatchlist
);

router.put(
  "/user/watchlists/:name",
  isAuthenticated,
  watchlistsController.updateUserWatchlist
);

router.delete(
  "/user/watchlists/:name",
  isAuthenticated,
  watchlistsController.deleteUserWatchlist
);

router.post(
  "/user/watchlists/:name/artworks",
  isAuthenticated,
  watchlistsController.createUserArtworkByWatchlistName
);

router.delete(
  "/user/watchlists/:name/artworks/:id",
  isAuthenticated,
  watchlistsController.deleteUserArtworkByIDFromWatchlistName
);

// Logged User Artworks
router.post(
  "/user/artworks/:id/liked",
  isAuthenticated,
  artworksController.toggleUserLikedArtworkByID
);

router.post(
  "/user/artworks/:id/watched",
  isAuthenticated,
  artworksController.toggleUserWatchedArtworkByID
);

// Comments
router.get("/comments", commentsController.getComments);
router.get("/comments/artworks/:id", commentsController.getCommentsByArtworkID);
router.get(
  "/comments/user",
  isAuthenticated,
  commentsController.getCommentsByUser
);
router.post("/comments", isAuthenticated, commentsController.createComment);
router.put("/comments/:id", isAuthenticated, commentsController.updateComment);
router.delete(
  "/comments/:id",
  isAuthenticated,
  commentsController.deleteComment
);
router.post(
  "/comments/:id/like",
  isAuthenticated,
  commentsController.likeComment
);
router.post(
  "/comments/:id/dislike",
  isAuthenticated,
  commentsController.dislikeComment
);

module.exports = router;
