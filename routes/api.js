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
const notifController = require("../controllers/backend/notifs");

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
router.get("/comments/trending", commentsController.getTrendingComments);
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

// Notifs
router.get("/getnotifs", isAuthenticated, notifController.getAllNotifs);
router.delete(
  "/deletenotifs/:notifid",
  isAuthenticated,
  notifController.deleteNotif
);
router.put(
  "/addnotif/:Param1/:Param2/:Val1/:Val2/:NotifID",
  isAuthenticated,
  notifController.addNotifs
);

// Artworks
router.get("/artworks/trending/day", artworksController.getTrendingMoviesByDay);
router.get(
  "/artworks/trending/week",
  artworksController.getTrendingMoviesByWeek
);
router.get("/artworks/trending/upcoming", artworksController.getUpcomingMovies);

// Admin Routes - protected by isAuthenticated middleware and role check in controllers
router.get("/admin/users", isAuthenticated, usersController.getAdminUsers);
router.get(
  "/admin/users/:id",
  isAuthenticated,
  usersController.getAdminUserById
);
router.post("/admin/users", isAuthenticated, usersController.createAdminUser);
router.put(
  "/admin/users/:id",
  isAuthenticated,
  usersController.updateAdminUser
);
router.delete(
  "/admin/users/:id",
  isAuthenticated,
  usersController.deleteAdminUser
);

router.get(
  "/admin/comments",
  isAuthenticated,
  commentsController.getAdminComments
);
router.get(
  "/admin/comments/:id",
  isAuthenticated,
  commentsController.getAdminCommentById
);
router.delete(
  "/admin/comments/:id",
  isAuthenticated,
  commentsController.deleteAdminComment
);

router.get(
  "/admin/artworks",
  isAuthenticated,
  artworksController.getAdminArtworks
);
router.get(
  "/admin/artworks/:id",
  isAuthenticated,
  artworksController.getAdminArtworkById
);
router.post(
  "/admin/artworks",
  isAuthenticated,
  artworksController.createAdminArtwork
);
router.put(
  "/admin/artworks/:id",
  isAuthenticated,
  artworksController.updateAdminArtwork
);
router.delete(
  "/admin/artworks/:id",
  isAuthenticated,
  artworksController.deleteAdminArtwork
);

router.get("/admin/lists", isAuthenticated, watchlistsController.getAdminLists);
router.get(
  "/admin/lists/:id",
  isAuthenticated,
  watchlistsController.getAdminListById
);
router.put(
  "/admin/lists/:id",
  isAuthenticated,
  watchlistsController.updateAdminList
);
router.delete(
  "/admin/lists/:id",
  isAuthenticated,
  watchlistsController.deleteAdminList
);

module.exports = router;
