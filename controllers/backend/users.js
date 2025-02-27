const CryptoJS = require("crypto-js");
const { executeQuery } = require("../../db");
const { ChangeSession, TraceError, TraceLogs, formatDate } = require("../functions");
const { CRYPTO_KEY, TMDB_API_KEY } = require("../../config");
const path = require("path");

const HOUR = 1000 * 60 * 20;


exports.loginOK = async (req, res) => {
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
      ChangeSession(
        req,
        user.UserID,
        user.Username,
        user.UserProfilePicture,
        user.EmailAddress,
        user.FirstName,
        user.LastName,
        user.Confidentiality,
        user.Bio,
        user.Gender
      );
      req.session.cookie.expires = new Date(Date.now() + HOUR);
      req.session.cookie.maxAge = HOUR;

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
};

exports.registerOK = async (req, res) => {
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
      const userid = await executeQuery(
        `INSERT INTO Users OUTPUT inserted.UserID VALUES(GETDATE(), GETDATE(), '${Username}', '${LastName}', '${BirthDate}','${Mail}', '\\UsersProfilePicture\\Default.png', '${CryptoJS.AES.encrypt(
          Password,
          CRYPTO_KEY
        )}', '${FirstName}', 0, 0, 0, '${SecurityAnswer}','${SecurityQuestion}')`
      );
      const listid = await executeQuery(
        "INSERT INTO List OUTPUT inserted.ListsID VALUES ('Ma Liste',GETDATE())"
      );
      console.log(listid);
      await executeQuery(
        `INSERT INTO Ref_UsersList VALUES (${userid[0].UserID}, ${listid[0].ListsID})`
      );
      res.redirect("/signin"); ///+ {message: 'Utilisateur créé avec succès'})
    }
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.modifyBio = async (req, res) => {
  const newbio = req.body.newbio;
  console.log(newbio);
  try {
    await executeQuery(
      `UPDATE Users SET Bio = '${newbio}' WHERE Username = '${req.session.user.username}'`
    );
    TraceLogs(req, res, `User ${req.session.user.username} changed his bio`);
    ChangeSession(
      req,
      req.session.user.id,
      req.session.user.username,
      req.session.user.avatar_url,
      req.session.user.email,
      req.session.user.firstname,
      req.session.user.lastname,
      req.session.user.confidentiality,
      newbio,
      req.session.user.gender
    );
    res.redirect("/settings/profile/modifyprofile");
  } catch (e) {
    TraceError(
      req,
      res,
      `An error occured when attempted to changed bio : ${e}`
    );
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.changePP = async (req, res) => {
  try {
    if (!req.file) {
      return res.send("Aucun fichier sélectionné.");
    }

    const filePath = path.join(
      "/UsersProfilePicture/",
      req.session.user.id + ".png"
    );
    await executeQuery(
      `UPDATE Users SET UserProfilePicture = '${filePath}' WHERE UserID = ${req.session.user.id}`
    );
    TraceLogs(
      req,
      res,
      `User ${req.session.user.username} successfully change his profile picture`
    );

    res.redirect("/settings/profile/modifyprofile");
  } catch (e) {
    TraceError(req, res, `KO by user ${req.session.user.username} : ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.changeGender = async (req, res) => {
  let gender = req.params["gender"];
  gender = gender === "men" ? 0 : 1;
  try {
    await executeQuery(
      `UPDATE Users SET Gender = ${gender} WHERE UserID = ${req.session.user.id}`
    );
    ChangeSession(
      req,
      req.session.user.id,
      req.session.user.username,
      req.session.user.avatar_url,
      req.session.user.email,
      req.session.user.firstname,
      req.session.user.lastname,
      req.session.user.confidentiality,
      req.session.user.bio,
      gender
    );
    TraceLogs(
      req,
      res,
      `User ${req.session.user.username} successfully change his gender`
    );
    res.redirect("/settings/profile/modifyprofile");
  } catch (e) {
    TraceError(req, res, `KO by user ${req.session.user.username} : ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.getUsersByUsername = async (req, res) => {
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
    TraceError(req, res, `An error occured ${e}`);
    res.json({
      status: "KO",
      message: `Internal server error : ${e}`,
    });
  }
};

exports.getConfidentialityByUsername = async (req, res) => {
  const user = req.params["user"];
  try {
    const query = await executeQuery(
      `SELECT Confidentiality FROM Users where Username = '${user}'`
    );
    res.json({
      confidentiality: query[0],
    });
  } catch {
    TraceError(req, res, `An error occured ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.changeConfidentialityUser = async (req, res) => {
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

    TraceLogs(
      req,
      res,
      `User ${req.session.user.username} has modify his confidentiality`
    );
    ChangeSession(
      req,
      req.session.user.id,
      req.session.user.username,
      req.session.user.avatar_url,
      req.session.user.email,
      req.session.user.firstname,
      req.session.user.lastname,
      nbconf,
      req.session.user.bio,
      req.session.user.gender
    );
    res.json({
      status: "OK",
      message: "Query executed with successed",
    });
  } catch (e) {
    TraceError(req, res, `An error occured ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};
