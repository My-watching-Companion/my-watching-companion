const router = require("express").Router();
const { executeQuery } = require("../db");
const CryptoJS = require("crypto-js");
const session = require("express-session");
const { CRYPTO_KEY, TMDB_API_KEY } = require("../config");
var hour = 1000 * 60 * 20;

const express = require("express");
router.use(express.json());

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/signin");
  }
}

async function CheckAge(username, age) {
  const query = await executeQuery(
    `SELECT UsersBirthDate, GETDATE() AS Today from Users WHERE Username = '${username}'`
  );
  const Today = formatDate(query[0].Today);
  const UserBirthDate = formatDate(query[0].UsersBirthDate);

  return Today - UserBirthDate >
    Today -
      formatDate(
        `${Today.getFullYear() - age}-${Today.getMonth()}-${Today.getDay()}`
      )
    ? true
    : false;
}

async function GetUser(req, res, next) {
  if (req.session.user) {
    const user = await executeQuery(
      `SELECT U.LastName, U.FirstName, U.Username, U.EmailAddress, U.UserProfilePicture from Users
      where Username = '${req.session.user.username}'`
    );
    return next({ user });
  } else {
    return next({ user: undefined });
  }
}

async function TraceLogs(req, res, message) {
  await executeQuery(
    `INSERT INTO TraceLogs VALUES (GETDATE(), (SELECT UserID FROM Users where Username = '${req.session.user.username}'), '${message}', 0)`
  );
}

async function TraceError(req, res, message) {
  await executeQuery(
    `INSERT INTO TraceLogs VALUES (GETDATE(), (SELECT UserID FROM Users where Username = '${req.session.user.username}'), '${message}', 1)`
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);

  // Récupération du jour, mois, et année
  const day = String(date.getDate()).padStart(2, "0"); // JJ
  const month = String(date.getMonth() + 1).padStart(2, "0"); // MM (mois commence à 0, donc +1)
  const year = date.getFullYear(); // AAAA

  // Format JJ-MM-AAAA
  return new Date(year, month, day);
}

//! Route API pour Insérer / modifier en base

router.post("/login/ok", async (req, res) => {
  const Username = req.body.username;
  const Password = req.body.password;
  try {
    const query = await executeQuery(
      `SELECT * from Users where Username = '${Username}'`
    );

    const user = query[0];

    if (
      Password ===
      CryptoJS.AES.decrypt(user.Password, CRYPTO_KEY).toString(
        CryptoJS.enc.Utf8
      )
    ) {
      req.session.user = {
        id: user.UserID,
        username: user.Username,
        avatar_url: user.UserProfilePicture,
        email: user.EmailAddress,
        firstname: user.FirstName,
        lastname: user.LastName,
      };
      req.session.cookie.expires = new Date(Date.now() + hour);
      req.session.cookie.maxAge = hour;

      TraceLogs(req, res, `User ${Username} successfully login`);

      res.redirect("/");
    } else {
      TraceError(req, res, `Users use wrong password`);

      res.json({
        status: "ERROR",
        message: "Mot de passe incorrect",
      });
    }
  } catch (e) {
    TraceError(req, res, `Internal Server Error ${e}`);

    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

router.post("/register/ok", async (req, res) => {
  const LastName = req.body.lastname;
  const FirstName = req.body.firstname;
  const BirthDate = req.body.birthdate;
  const Mail = req.body.email;
  const Username = req.body.username;
  const Password = req.body.password;
  const SecurityQuestion = req.body.question;
  const SecurityAnswer = req.body.answer;

  try {
    const VerifMail = await executeQuery(
      `SELECT EmailAddress from Users where FirstName = '${FirstName}' and LastName = '${LastName}'`
    );
    const VerifLogin = await executeQuery(
      `SELECT Username FROM Users WHERE Username = '${Username}'`
    );
    if (VerifMail[0] !== undefined) {
      res.redirect("/signup"); ///+ {message: "L'email est déjà utilisé pour un compte"})
    } else if (VerifLogin[0] !== undefined) {
      res.redirect("/signup"); ///+ {message: 'Pseudonyme déjà utilisé'})
    } else {
      await executeQuery(
        `INSERT INTO Users VALUES(GETDATE(), GETDATE(), '${Username}', '${LastName}', '${BirthDate}','${Mail}', 'Default', '${CryptoJS.AES.encrypt(
          Password,
          CRYPTO_KEY
        )}', '${FirstName}', 0, 0, 0, '${SecurityAnswer}','${SecurityQuestion}')`
      );
      res.redirect("/signin"); ///+ {message: 'Utilisateur créé avec succès'})
    }
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

router.get("/addfriends/:user/:friends", async (req, res) => {
  const user = req.params["user"];
  const friends = req.params["friends"];
  try {
    await executeQuery(
      `INSERT INTO Friend VALUES((SELECT UserID From Users where Username = '${friends}'), (SELECT UserID From Users where Username = '${user}'))`
    );
    res.redirect("/settings/confidentiality/friends");
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

router.get("/removefriends/:user/:friend", async (req, res) => {
  const user = req.params["user"];
  const friend = req.params["friend"];
  try {
    await executeQuery(`DELETE FROM Friend
                        WHERE UserID = (SELECT UserID from Users where Username = '${user}') AND FriendsUserID = (SELECT UserID from Users where Username = '${friend}')`);
    res.redirect("/settings/confidentiality/friends");
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

router.post("/changePP/:user", async (req, res) => {
  try {
    const user = req.params["user"];
    const base64Image = req.body.ProfilePicture;

    const image = `data:${user}/png;base64,${base64Image}`;
    const query = executeQuery(`UPDATE Users
      SET UserProfilePicture = '${image}'
      where UserID = (SELECT UserID FROM Users where Username = '${user}')`);

    res.json({
      status: "OK",
      message: "Profile Picture of user was modified with success",
    });
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

//! Route API pour chercher des choses

router.get("/getuserswithoutfriends/:user", async (req, res) => {
  try {
    const user = req.params["user"];
    const query = await executeQuery(`
      SELECT U.UserID, U.Username, U.FirstName, U.LastName, U.CreationDate, U.UpdatedDate, U.UsersBirthDate, U.UserProfilePicture  from Users U
	    WHERE U.UserID NOT IN (SELECT FriendsUserID FROM Friend where UserID = 
							(SELECT UserID from Users WHERE Username = '${user}'))
      `);

    res.json({
      Users: query.map((element) => ({
        UserID: `${element.UserID}`,
        Username: `${element.Username}`,
        FirstName: `${element.FirstName}`,
        LastName: `${element.LastName}`,
        CreationDate: `${formatDate(element.CreationDate)}`,
        UpdatedDate: `${formatDate(element.UpdatedDate)}`,
        BirthDate: `${formatDate(element.UsersBirthDate)}`,
        ProfilePicture: element.UserProfilePicture,
      })),
    });
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

router.get("/users/:u", async (req, res) => {
  const SearchUser = req.params["u"];
  try {
    const query = await executeQuery(
      `SELECT U.UserID, U.FirstName, U.LastName, U.CreationDate, U.UpdatedDate, U.UsersBirthDate, U.RoleID, U.UserProfilePicture from Users U
      where Username = '${SearchUser}'`
    );
    if (query.length === 0) {
      res.json({
        status: "ERROR",
        message: "User dosn't exists",
      });
    } else {
      res.json({
        UserID: `${query[0].UserID}`,
        FirstName: `${query[0].FirstName}`,
        LastName: `${query[0].LastName}`,
        CreationDate: `${formatDate(query[0].CreationDate)}`,
        UpdatedDate: `${formatDate(query[0].UpdatedDate)}`,
        BirthDate: `${formatDate(query[0].UsersBirthDate)}`,
        ProfilePicture: query[0].UserProfilePicture,
        Role: `${query[0].RoleID === 1 ? "Admin" : "User"}`,
      });
    }
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal server error : ${e}`,
    });
  }
});

router.get("/users/:u/watchlists", async (req, res) => {
  const SearchUser = req.params["u"];
  try {
    const query = await executeQuery(
      `SELECT U.UserID, L.ListsID, L.ListsName, U.UpdatedDate
      from Users U
        INNER JOIN Ref_UsersList RULi ON U.UserID = RULi.UserID 
        LEFT JOIN List L ON RULi.ListsID = L.ListsID
        WHERE U.Username = '${SearchUser}'`
    );
    console.log(query);
    if (query.length === 0) {
      return res.json({
        Watchlist: null,
      });
    }
    res.json({
      User: { UserID: query[0].UserID, UserURL: `/api/users/${SearchUser}` },
      Watchlist: query.map((element) => ({
        ListsID: element.ListsID,
        ListName: element.ListsName,
        Updated: element.UpdatedDate,
        ListURL: `/api/${SearchUser}/watchlists/${element.ListsName}`,
      })),
    });
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal server error : ${e}`,
    });
  }
});

router.get("/users/:u/watchlists/:w", async (req, res) => {
  const SearchUser = req.params["u"];
  const SearchList = req.params["w"];
  try {
    const query =
      await executeQuery(`SELECT U.UserID, U.ListsID, U.ListsName, U.UpdatedDate, A.ArtworkID, A.ArtworkName, RN.NatureLabel, RT.TypeName 
                                      from Users U 
                                      LEFT JOIN Ref_UsersLists RUL ON U.UserID = RUL.UserID 
                                      LEFT JOIN List U ON RUL.ListsID = U.ListsID 
                                      LEFT JOIN Ref_ListArtwork RULA ON RULA.ListsID = U.ListsID
                                      LEFT JOIN Artwork A ON A.ArtworkID = RULA.ArtworkID
                                      LEFT JOIN Ref_ArtworkType RAT ON RAT.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_ArtworkNature RAN ON RAN.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_ArtworkCreator RAC ON RAC.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_Creator RC ON RC.CreatorID = RAC.CreatorID
                                      WHERE U.Username = '${SearchUser}' AND U.ListsName = '${SearchList}'`);

    res.json({
      User: { UserID: query[0].UserID, UserURL: `/api/users/${SearchUser}` },
      WatchListInfo: {
        ListsID: element.ListsID,
        ListName: element.ListsName,
        Updated: element.UpdatedDate,
        Artwork: query[0].map((element) => ({
          ArtworkID: element.ArtworkID,
          ArtworkName: element.ArtworkName,
          ArtworkNature: element.NatureLabel,
          ArtworkType: element.Ref_ArtworkType,
          ArtworkCreatorURL: `/api/artwork/${element.ArtworkName}/creator`,
        })),
      },
    });
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal server error : ${e}`,
    });
  }
});

router.get("/artwork/:a/creator", async (req, res) => {
  const SearchArtwork = req.params["a"];
  try {
    const query =
      await executeQuery(`SELECT RAC.CreatorID, RC.CreatorName from Artowrk
                                      LEFT JOIN Ref_ArtworkCreator RAC ON RAC.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_Creator RC ON RC.CreatorID = RAC.CreatorID
                                      WHERE A.ArtworkName = '${SearchArtwork}'`);
    res.json({
      ArtworkName: SearchArtwork,
      ArtworkCreator: query[0].map((creator) => ({
        CreatorID: creator.CreatorID,
        CreatorName: creator.CreatorName,
      })),
    });
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

router.get("/getallnature", async (req, res) => {
  try {
    const query = await executeQuery(
      `SELECT * from Ref_Nature order by NatureID`
    );
    res.json({
      Nature: query.map((element) => ({
        NatureID: element.NatureID,
        NatureLabel: element.NatureLabel,
      })),
    });
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

router.get(
  "/modifyconfidentiality/:conf/:user",
  isAuthenticated,
  async (req, res) => {
    const conf = req.params["conf"];
    const user = req.params["user"];
    let nbconf = 0;
    try {
      if (conf === "public") {
        nbconf = 0;
      } else if (conf === "private") {
        nbconf = 1;
      } else if (conf === "friends") {
        nbconf = 2;
      } else {
        res.json({
          status: "ERROR",
          message: `Confidentiality dosn't exist`,
        });
      }
      await executeQuery(`UPDATE Users
                          SET Confidentiality = '${nbconf}'
                          WHERE Username = '${user}'`);
      res.json({
        status: "OK",
        message: "Query executed with successed",
      });
    } catch (e) {
      res.json({
        status: "KO",
        message: `Internal Server Error ${e}`,
      });
    }
  }
);

router.get("/friends/:user", async (req, res) => {
  const user = req.params["user"];
  try {
    const friendslist =
      await executeQuery(`SELECT RF.FriendsUserID, U.Username, U.FirstName, U.LastName, U.UserProfilePicture, U.Confidentiality from Friend RF
                                            INNER JOIN Users U ON RF.FriendsUserID = U.UserID
                                            WHERE RF.UserID = (SELECT UserID from Users where Username = '${user}')`);
    res.json({
      Friends: friendslist.map((element) => ({
        UserID: element.FriendsUserID,
        Username: element.Username,
        FirstName: element.FirstName,
        LastName: element.LastName,
        UserProfilePicture: element.UserProfilePicture,
        Confidentiality: element.Confidentiality,
      })),
    });
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
});

router.get("/securityquestions", async (req, res) => {
  try {
    const query = await executeQuery(`SELECT * FROM SecurityQuestion`);

    const questions = query.map((question) => ({
      SecurityQuestionID: question.SecurityQuestionID,
      SecurityQuestion: question.Question,
    }));

    return res.json({ questions });
  } catch (e) {
    return res.json({ error: `Internal server error : ${e}` });
  }
});

router.post("/getsecurityquestion", async (req, res) => {
  if (!req.body.email)
    return res.json({ error: "Veuillez entrer une adresse email valide." });

  const email = req.body.email;

  try {
    const query = await executeQuery(
      `SELECT U.SecurityQuestionID, SQ.Question as SecurityQuestion from Users AS U INNER JOIN SecurityQuestions AS SQ ON U.SecurityQuestionID = SQ.SecurityQuestionID WHERE U.EmailAddress = '${email}'`
    );

    if (query.length === 0)
      return res.json({
        error: "Aucun compte n'est associé à cette adresse email.",
      });

    return res.json({ securityQuestion: query[0].SecurityQuestion });
  } catch (e) {
    return res.json({
      error:
        "Une erreur est survenue lors de la vérification de votre adresse email.",
    });
  }
});

router.post("/checksecurityanswer", async (req, res) => {
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

    return res.json({ success: true });
  } catch (e) {
    return res.json({
      error: "Une erreur est survenue lors de la vérification de la réponse.",
    });
  }
});

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

router.get("/getuserartworks", isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;

    const query =
      await executeQuery(`SELECT L.ListsID AS list_id, L.ListsName AS list_name, 
                          A.ArtworkID AS artwork_id, A.ArtworkName AS artwork_name, A.ArtworkAPILink AS artwork_api, A.ArtworkPosterImage AS artwork_poster
                          FROM Users U
                          LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                          LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                          LEFT JOIN Ref_ListArtwork RLA ON RLA.ListsID = L.ListsID
                          LEFT JOIN Artwork A ON A.ArtworkID = RLA.ArtworkID
                          WHERE U.UserID = ${user.id}`);

    res.status(200);
    return res.json(query);
  } catch (error) {
    res.status(400);
    return res.json({
      error:
        "Une erreur est survenue lors de la récupération des titres de l'utilisateur.",
    });
  }
});

router.get("/getuserlists", isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;

    const query =
      await executeQuery(`SELECT L.ListsID AS list_id, L.ListsName AS list_name
                          FROM Users U
                          LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                          LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                          WHERE U.UserID = ${user.id}`);

    res.status(200);
    return res.json(query);
  } catch (error) {
    res.status(400);
    return res.json({
      error: "Une erreur est survenue lors de la récupération des listes.",
    });
  }
});

router.post("/searchartworks", async (req, res) => {
  try {
    const { search } = req.body;

    let movies = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${search}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    movies = await movies.json();
    movies = movies.results;

    let categories = await fetch(
      "https://api.themoviedb.org/3/genre/movie/list?language=fr",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    categories = await categories.json();

    movies = movies.map((movie) => {
      movie.genres = movie.genre_ids
        .map((genre) => {
          const category = categories.genres.find(
            (category) => category.id === genre
          );
          return category ? category.name : "";
        })
        .filter((genre) => genre);

      return movie;
    });

    res.status(200);
    return res.json(movies);
  } catch (error) {
    res.status(400);
    return res.json({
      error: "Une erreur est survenue lors de la recherche.",
    });
  }
});

router.post("/addartworktolists", isAuthenticated, async (req, res) => {
  try {
    const { artwork, lists } = req.body;
    const user = req.session.user;

    // Checks
    if (!artwork) {
      res.status(400);
      return res.json({
        error: "Veuillez renseigner un titre.",
      });
    }

    if (!lists || lists.length === 0) {
      res.status(400);
      return res.json({
        error: "Veuillez sélectionner au moins une liste.",
      });
    }

    // Check if the artwork is already in the database
    const artworkAPILink = `https://api.themoviedb.org/3/movie/${artwork.id}`;

    await executeQuery(
      `IF NOT EXISTS (SELECT * FROM Artwork WHERE ArtworkAPILink = '${artworkAPILink}') INSERT INTO Artwork VALUES ('${artwork.title}', '${artworkAPILink}', '${artwork.poster_path}')`
    );

    // Add artwork to lists
    for (const list of lists)
      await executeQuery(
        `INSERT INTO Ref_ListArtwork VALUES (
          (SELECT ArtworkID FROM Artwork WHERE ArtworkAPILink = '${artworkAPILink}'), 
          (SELECT L.ListsID FROM List L INNER JOIN Ref_UsersList UL ON UL.ListsID = L.ListsID WHERE L.ListsName = '${list}' AND UL.UserID = ${user.id})
        )`
      );

    res.status(200);
    return res.json({
      success: "Le titre a été ajouté à la/aux liste(s) avec succès.",
    });
  } catch (error) {
    res.status(400);
    return res.json({
      error: "Une erreur est survenue lors de la recherche.",
    });
  }
});

// Définition de la route erreur 404
router.get("*", (req, res) => {
  res.status(404);
  res.json({
    status: "ERROR",
    message: "Page not found",
  });
});

module.exports = { router, isAuthenticated, GetUser, CheckAge };
