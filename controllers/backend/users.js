const CryptoJS = require("crypto-js");
const { executeQuery } = require("../../db");
const {
  ChangeSession,
  TraceError,
  TraceLogs,
  formatDate,
  clearSession,
} = require("../functions");
const { CRYPTO_KEY } = require("../../config");
const path = require("path");

// 1 hour
const SESSION_LIFETIME = 1000 * 60 * 60;
// 1 week for remember me
const REMEMBER_SESSION_LIFETIME = 1000 * 60 * 60 * 24 * 7;

exports.loginOK = async (req, res) => {
  const { username, password, remember } = req.body;

  try {
    const query = await executeQuery(
      `SELECT * from Users where Username = '${username}'`
    );

    const user = query[0];

    if (!user)
      return res.json({
        status: "ERROR",
        message: "User doesn't exist",
      });

    if (
      password ===
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

      // Change session duration based on "remember me" option
      const sessionDuration = remember
        ? REMEMBER_SESSION_LIFETIME
        : SESSION_LIFETIME;
      req.session.cookie.expires = new Date(Date.now() + sessionDuration);
      req.session.cookie.maxAge = sessionDuration;

      TraceLogs(req, res, `User ${username} successfully login`);

      // Check if we should redirect to a specific page
      const redirectTo = req.session.returnTo || "/";
      delete req.session.returnTo;

      res.redirect(redirectTo);
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

// Add logout functionality
exports.logout = async (req, res) => {
  try {
    if (req.session.user) {
      TraceLogs(req, res, `User ${req.session.user.username} logged out`);
      await clearSession(req);
    }
    res.redirect("/signin");
  } catch (e) {
    console.error("Logout error:", e);
    res.redirect("/");
  }
};

exports.registerOK = async (req, res) => {
  const {
    lastname,
    firstname,
    birthdate,
    email,
    username,
    password,
    question,
    answer,
  } = req.body;

  try {
    const VerifMail = await executeQuery(
      `SELECT EmailAddress from Users where FirstName = '${firstname}' and LastName = '${lastname}'`
    );
    const VerifLogin = await executeQuery(
      `SELECT Username FROM Users WHERE Username = '${username}'`
    );
    if (VerifMail[0] !== undefined) {
      res.redirect("/signup"); ///+ {message: "L'email est déjà utilisé pour un compte"})
    } else if (VerifLogin[0] !== undefined) {
      res.redirect("/signup"); ///+ {message: 'Pseudonyme déjà utilisé'})
    } else {
      const userid = await executeQuery(
        `INSERT INTO Users(CreationDate, UpdatedDate, Username, LastName, UsersBirthDate, EmailAddress, UserProfilePicture, Password, FirstName, IsActivated, Confidentiality, RoleID, SecurityQuestionAnswer, SecurityQuestionID) OUTPUT inserted.UserID VALUES(GETDATE(), GETDATE(), '${username}', '${lastname}', '${birthdate}','${email}', '\\UsersProfilePicture\\Default.png', '${CryptoJS.AES.encrypt(
          password,
          CRYPTO_KEY
        )}', '${firstname}', 0, 0, 1, '${answer}','${question}')`
      );
      const listid = await executeQuery(
        "INSERT INTO List OUTPUT inserted.ListID VALUES ('Ma Liste',GETDATE())"
      );
      await executeQuery(
        `INSERT INTO Ref_UsersList VALUES (${userid[0].UserID}, ${listid[0].ListID})`
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

exports.updateUser = async (req, res) => {
  const user = req.session.user;

  const { username, password, confidentiality, bio, gender } = req.body;

  const avatar_url = req.file
    ? path.join("/UsersProfilePicture/", req.session.user.id + ".png")
    : undefined;

  const options = {
    Username: username,
    Password: password,
    Confidentiality: confidentiality,
    Bio: bio,
    Gender: gender ? (gender === "men" ? 0 : 1) : undefined,
    UserProfilePicture: avatar_url,
  };

  try {
    await executeQuery(
      `UPDATE Users SET ${Object.keys(options)
        .filter((key) => options[key] !== undefined)
        .map(
          (key) =>
            `${key} = ${
              typeof options[key] === "string"
                ? `'${options[key]}'`
                : options[key]
            }`
        )
        .join(", ")} WHERE UserID = ${user.id}`
    );

    TraceLogs(
      req,
      res,
      `User ${req.session.user.username} changed his ${Object.keys(options)
        .filter((key) => options[key])
        .map((key) => key)
        .join(", ")}`
    );

    ChangeSession(
      req,
      req.session.user.id,
      options.Username ? options.Username : req.session.user.username,
      options.UserProfilePicture
        ? options.UserProfilePicture
        : req.session.user.avatar_url,
      req.session.user.email,
      req.session.user.firstname,
      req.session.user.lastname,
      options.Confidentiality
        ? options.Confidentiality
        : req.session.user.confidentiality,
      options.Bio ? options.Bio : req.session.user.bio,
      options.Gender === undefined ? req.session.user.gender : options.Gender
    );

    res.status(200).redirect("/settings/profile/modifyprofile");
  } catch (error) {
    res.status(500).json({
      error: "Internal server error.",
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
