const router = require("express").Router();
const { executeQuery } = require("../db");
const CrypotJS = require("crypto-js");
const session = require("express-session");
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

// TODO: Implémenter les différentes routes d'API

router.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API de MyWatchingCompanion" });
});

router.post("/login/ok", async (req, res) => {
  const Username = req.body.Username;
  const Password = req.body.Password;
  try {
    const DBPass = await executeQuery(
      `SELECT password from UsersLogin where Login = '${Username}'`
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
      res.json({ message: "Mot de passe incorrect" });
    }
  } catch (e) {
    res.json({ message: `Internal server Error : ${e}` });
  }
});

router.post("/register/ok", async (req, res) => {
  const LastName = req.body.LastName;
  const FirstName = req.body.FirstName;
  const BirthDate = req.body.BirthDate;
  const Mail = req.body.Mail;
  const Username = req.body.Username;
  const Password = req.body.Password;
  if (
    (await executeQuery(
      `SELECT EmailAddress from UsersGeneralInfos where FirstName = '${FirstName}' and LastName = '${LastName}'`
    ).recordsets[0].EmailAddress) === Mail
  ) {
    res.json({ message: "User already exists" });
  } else {
    try {
      await executeQuery(
        `INSERT INTO Users VALUES(0, GETDATE(), GETDATE()) INSERT INTO UsersGeneralInfos  VALUES('${FirstName}','${LastName}','${BirthDate}','${Mail}','Default') INSERT INTO UsersLogin VALUES('${Username}','${Password}',0)`
      );
      res.json({ message: "Utilisateur créé avec succès" });
    } catch (e) {
      res.json({ message: `Internal server Error : ${e}` });
    }
  }
});

router.get("/user/:u", async (req, res) => {
  const SearchUser = req.param("u");
  try {
    const query = await executeQuery(
      `SELECT * from Users U LEFT JOIN UsersGeneralInfos UGI ON U.UserID = UGI.UserID LEFT JOIN UsersLogin UL ON UL.UserID = UGI.UserID where Login = '${SearchUser}'`
    );
    if (query.length === 0) {
      res.json({ message: "User dosn't exists" });
    } else {
      res.json({
        UserID: `${query.recordsets[0].UserID}`,
        FirstName: `${query.recordsets[0].FirstName}`,
        LastName: `${query.recordsets[0].LastName}`,
        CreationDate: `${query.recordsets[0].CreationDate}`,
        UpdatedDate: `${query.recordsets[0].UpdatedDate}`,
        BirthDate: `${query.recordsets[0].UsersBirthDate}`,
        Role: `${query.recordsets[0].RoleID === 1 ? "Admin" : "User"}`,
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
        LEFT JOIN Ref_UsersLists RUL ON U.UserID = RUL.UserID 
        LEFT JOIN UsersLists UL ON RUL.ListsID = UL.ListsID 
        WHERE U.UserID = '${SearchUser}'`
    );
    res.json({
      User: { UserID: query.recordsets[0].UserID, UserURL: `/api/users/${u}` },
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
      User: { UserID: query.recordsets[0].UserID, UserURL: `/api/users/${u}` },
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
