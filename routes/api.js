const router = require("express").Router();
const { executeQuery } = require("../db");
const CryptoJS = require("crypto-js");
const session = require("express-session");
const {CRYPTO_KEY} = require("../config")
var hour = 1000 * 60 * 20;

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/");
  }
}

async function GetUser(req, res, next) {
  if (req.session.user) {
    const user = await executeQuery(
      `SELECT UGI.LastName, UGI.FirstName, UL.Login, UGI.EmailAddress, UGI.UserProfilePicture from UsersLogin UL INNER JOIN UsersGeneralInfos UGI ON UL.UserID = UGI.UserID where UL.Login = '${req.session.user}'`
    );
    return next({ user });
  } else {
    return next({ user: undefined });
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);

  // Récupération du jour, mois, et année
  const day = String(date.getDate()).padStart(2, '0'); // JJ
  const month = String(date.getMonth() + 1).padStart(2, '0'); // MM (mois commence à 0, donc +1)
  const year = date.getFullYear(); // AAAA

  // Format JJ-MM-AAAA
  return `${day}-${month}-${year}`;
}

// TODO: Implémenter les différentes routes d'API

router.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API de MyWatchingCompanion" });
});

router.post("/login/ok", async (req, res) => {
  const Username = req.body.username;
  const Password = req.body.password;
  try {
    const DBPass = await executeQuery(
      `SELECT password from UsersLogin where Login = '${Username}'`
    );
    if (
      Password ===
      CryptoJS.AES.decrypt(DBPass[0].password, CRYPTO_KEY).toString(CryptoJS.enc.Utf8)
    ) {
      req.session.user = Username;
      req.session.cookie.expires = new Date(Date.now() + hour);
      req.session.cookie.maxAge = hour;
      res.render("profil");
    } else {
      res.json({ message: "Mot de passe incorrect" });
    }
  } catch (e) {
    res.json({ message: `Internal server Error : ${e}` });
  }
});

router.post("/register/ok", async (req, res) => {
  const LastName = req.body.lastname;
  const FirstName = req.body.firstname;
  const BirthDate = req.body.birthdate;
  const Mail = req.body.email;
  const Username = req.body.username;
  const Password = req.body.password;
  try {
    if (
      (await executeQuery(
        `SELECT EmailAddress from UsersGeneralInfos where FirstName = '${FirstName}' and LastName = '${LastName}'`
      )) === undefined
    ) {
      res.json({ message: "User already exists" });
    } else {
      await executeQuery(
        `INSERT INTO Users VALUES(0, GETDATE(), GETDATE()) INSERT INTO UsersGeneralInfos  VALUES('${FirstName}','${LastName}','${BirthDate}','${Mail}','Default') INSERT INTO UsersLogin VALUES('${Username}','${CryptoJS.AES.encrypt(
          `${Password}`,
          CRYPTO_KEY
        )}',0)`
      );
      res.json({ message: "Utilisateur créé avec succès" });
    }
  } catch (e) {
    res.json({ message: `Internal server Error : ${e}` });
  }
});

router.get("/users/:u", async (req, res) => {
  const SearchUser = req.param("u");
  try {
    const query = await executeQuery(
      `SELECT * from Users U LEFT JOIN UsersGeneralInfos UGI ON U.UserID = UGI.UserID LEFT JOIN UsersLogin UL ON UL.UserID = UGI.UserID where Login = '${SearchUser}'`
    );
    if (query.length === 0) {
      res.json({ message: "User dosn't exists" });
    } else {
      res.json({
        UserID: `${query[0].UserID[0]}`,
        FirstName: `${query[0].FirstName}`,
        LastName: `${query[0].LastName}`,
        CreationDate: `${formatDate(query[0].CreationDate)}`,
        UpdatedDate: `${formatDate(query[0].UpdatedDate)}`,
        BirthDate: `${formatDate(query[0].UsersBirthDate)}`,
        Role: `${query[0].RoleID === 1 ? "Admin" : "User"}`,
      });
    }
  } catch (e) {
    res.json({ Error: `Internal server error : ${e}` });
  }
});

router.get("/users/:u/watchlists", async (req, res) => {
  const SearchUser = req.param("u");
  try {
    const query = await executeQuery(
      `SELECT * from Users U 
        INNER JOIN UsersLogin ULog ON U.UserID = ULog.UserID
        LEFT JOIN Ref_UsersLists RUL ON U.UserID = RUL.UserID 
        LEFT JOIN UsersLists UL ON RUL.ListsID = UL.ListsID 
        WHERE ULog.Login = '${SearchUser}'`
    );
    res.json({
      User: { UserID: query[0].UserID, UserURL: `/api/users/${SearchUser}` },
      Watchlist: query.recordsets.map((element) => ({
        ListsID: element.ListsID,
        ListName: element.ListsName,
        Updated: element.UpdatedDate,
        ListURL: `/api/${u}/watchlists/${element.ListName}`,
      })),
    });
  } catch (e) {
    res.json({ Error: `Internal server error : ${e}` });
  }
});

router.get("/users/:u/watchlists/:w", async (req, res) => {
  const SearchUser = req.param("u");
  const SearchList = req.param("w");
  try {
    const query = await executeQuery(`SELECT * from Users U 
                                      LEFT JOIN Ref_UsersLists RUL ON U.UserID = RUL.UserID 
                                      LEFT JOIN UsersLists UL ON RUL.ListsID = UL.ListsID 
                                      LEFT JOIN Ref_ArtworkLists RAL ON RAL.ListsID = UL.ListsID
                                      LEFT JOIN Artwork A ON A.ArtworkID = RAL.ArtworkID
                                      LEFT JOIN ArtworkGeneralInfo AGI ON AGI.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_ArtworkType RAT ON RAT.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_ArtworkNature RAN ON RAN.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_ArtworkCreator RAC ON RAC.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_Creator RC ON RC.CreatorID = RAC.CreatorID
                                      WHERE U.UserID = '${SearchUser}' AND UL.ListsName = '${SearchList}'`);

    res.json({
      User: { UserID: query[0].UserID, UserURL: `/api/users/${SearchUser}` },
      WatchListInfo: {
        ListsID: element.ListsID,
        ListName: element.ListsName,
        Updated: element.UpdatedDate,
        Artwork: query.recordsets.map((element) => ({
          ArtworkID: element.ArtworkID,
          ArtworkName: element.ArtworkName,
          ArtworkNature: element.NatureLabel,
          ArtworkType: element.Ref_ArtworkType,
          ArtworkCreatorURL: `/api/artwork/${element.ArtworkName}/creator`,
        })),
      },
    });
  } catch (e) {
    res.json({ Error: `Internal server error : ${e}` });
  }
});

router.get("/artwork/:a/creator", async (req, res) => {
  const SearchArtwork = req.param("a");
  try {
    const query =
      await executeQuery(`SELECT RAC.CreatorID, RC.CreatorName from Artowrk
                                      LEFT JOIN ArtworkGeneralInfo AGI ON AGI.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_ArtworkCreator RAC ON RAC.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_Creator RC ON RC.CreatorID = RAC.CreatorID
                                      WHERE AGI.ArtworkName = '${SearchArtwork}'`);
    res.json({
      ArtworkName: SearchArtwork,
      ArtworkCreator: query.recordsets.map((creator) => ({
        CreatorID: creator.CreatorID,
        CreatorName: creator.CreatorName,
      })),
    });
  } catch (e) {}
});

module.exports = { router, isAuthenticated, GetUser };
