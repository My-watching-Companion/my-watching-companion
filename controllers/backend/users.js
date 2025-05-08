const CryptoJS = require("crypto-js");
const { executeQuery, sql } = require("../../db");
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
        user.Gender,
        user.RoleID
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
      options.Gender === undefined ? req.session.user.gender : options.Gender,
      req.session.user.roleId
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
      req.session.user.gender,
      req.session.user.roleId
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

// Admin functions for user management
exports.getAdminUsers = async (req, res) => {
  // Check if user is admin
  if (!req.session.user || req.session.user.roleId !== 2) {
    return res.status(403).json({
      error: "Vous n'avez pas les droits d'administration nécessaires.",
    });
  }

  try {
    const users = await executeQuery(
      `SELECT UserID, Username, EmailAddress, UserProfilePicture, FirstName, 
              LastName, UsersBirthDate, RoleID, CreationDate, Confidentiality 
       FROM Users
       ORDER BY Username`
    );

    res.status(200).json(users);
  } catch (error) {
    TraceError(req, res, `Error in getAdminUsers: ${error}`);
    res.status(500).json({
      error:
        "Une erreur est survenue lors de la récupération des utilisateurs.",
    });
  }
};

exports.createAdminUser = async (req, res) => {
  // Check if user is admin
  if (!req.session.user || req.session.user.roleId !== 2)
    return res.status(403).json({
      error: "Vous n'avez pas les droits d'administration nécessaires.",
    });

  const {
    username,
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    birthdate,
    securityQuestion,
    securityAnswer,
    role,
  } = req.body;

  // Validate all required fields
  if (
    !username ||
    !email ||
    !password ||
    !confirmPassword ||
    !firstName ||
    !lastName ||
    !birthdate ||
    !securityQuestion ||
    !securityAnswer ||
    !role
  )
    return res.status(400).json({
      error: "Tous les champs sont obligatoires.",
    });

  // Verify passwords match
  if (password !== confirmPassword)
    return res.status(400).json({
      error: "Les mots de passe ne correspondent pas.",
    });

  try {
    // Check if username or email already exists
    const existingUser = await executeQuery(
      `SELECT Username, EmailAddress FROM Users 
       WHERE Username = @username OR EmailAddress = @email`,
      [
        { name: "username", type: sql.VarChar, value: username },
        { name: "email", type: sql.VarChar, value: email },
      ]
    );

    if (existingUser.length > 0)
      return res.status(400).json({
        error:
          "Ce nom d'utilisateur ou cette adresse email est déjà utilisé(e).",
      });

    // Create the user
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      CRYPTO_KEY
    ).toString();

    const userid = await executeQuery(
      `INSERT INTO Users (
        CreationDate, UpdatedDate, Username, LastName, UsersBirthDate, EmailAddress, 
        UserProfilePicture, Password, FirstName, IsActivated, Confidentiality, RoleID,
        SecurityQuestionID, SecurityQuestionAnswer
      ) 
      OUTPUT inserted.UserID 
      VALUES (
        GETDATE(), GETDATE(), @username, @lastName, @birthdate, @email, 
        '\\UsersProfilePicture\\Default.png', @password, @firstName, 1, 0, @role,
        @securityQuestion, @securityAnswer
      )`,
      [
        { name: "username", type: sql.VarChar, value: username },
        { name: "email", type: sql.VarChar, value: email },
        { name: "password", type: sql.VarChar, value: encryptedPassword },
        { name: "firstName", type: sql.VarChar, value: firstName },
        { name: "lastName", type: sql.VarChar, value: lastName },
        { name: "birthdate", type: sql.Date, value: new Date(birthdate) },
        { name: "role", type: sql.Int, value: parseInt(role) },
        {
          name: "securityQuestion",
          type: sql.Int,
          value: parseInt(securityQuestion),
        },
        { name: "securityAnswer", type: sql.VarChar, value: securityAnswer },
      ]
    );

    // Create default list for the user
    const listid = await executeQuery(
      "INSERT INTO List OUTPUT inserted.ListID VALUES ('Ma Liste', GETDATE())"
    );

    await executeQuery(`INSERT INTO Ref_UsersList VALUES (@userID, @listID)`, [
      { name: "userID", type: sql.Int, value: userid[0].UserID },
      { name: "listID", type: sql.Int, value: listid[0].ListID },
    ]);

    TraceLogs(
      req,
      res,
      `Admin ${req.session.user.username} created user ${username}`
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès.",
    });
  } catch (error) {
    TraceError(req, res, `Error in createAdminUser: ${error}`);
    res.status(500).json({
      error: "Une erreur est survenue lors de la création de l'utilisateur.",
    });
  }
};

exports.updateAdminUser = async (req, res) => {
  // Check if user is admin
  if (!req.session.user || req.session.user.roleId !== 2)
    return res.status(403).json({
      error: "Vous n'avez pas les droits d'administration nécessaires.",
    });

  const { id } = req.params;
  const { username, email, firstName, lastName, role, gender, bio } = req.body;

  if (
    !id ||
    (!username &&
      !email &&
      !firstName &&
      !lastName &&
      !role &&
      gender === undefined &&
      !bio)
  )
    return res.status(400).json({
      error: "Des données sont manquantes pour la mise à jour.",
    });

  try {
    // Check if user exists
    const user = await executeQuery(
      `SELECT UserID FROM Users WHERE UserID = @userID`,
      [{ name: "userID", type: sql.Int, value: id }]
    );

    if (user.length === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé.",
      });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [{ name: "userID", type: sql.Int, value: id }];

    if (username) {
      updates.push("Username = @username");
      params.push({ name: "username", type: sql.VarChar, value: username });
    }

    if (email) {
      updates.push("EmailAddress = @email");
      params.push({ name: "email", type: sql.VarChar, value: email });
    }

    if (firstName) {
      updates.push("FirstName = @firstName");
      params.push({ name: "firstName", type: sql.VarChar, value: firstName });
    }

    if (lastName) {
      updates.push("LastName = @lastName");
      params.push({ name: "lastName", type: sql.VarChar, value: lastName });
    }

    if (bio !== undefined) {
      updates.push("Bio = @bio");
      params.push({ name: "bio", type: sql.VarChar, value: bio });
    }

    if (gender !== undefined) {
      if (gender === "" || gender === "null") updates.push("Gender = NULL");
      else {
        updates.push("Gender = @gender");
        // Convert 'true'/'false' strings to actual boolean for SQL
        params.push({
          name: "gender",
          type: sql.Bit,
          value: gender === "true" ? true : false,
        });
      }
    }

    if (role) {
      updates.push("RoleID = @role");
      params.push({ name: "role", type: sql.Int, value: parseInt(role) });
    }

    updates.push("UpdatedDate = GETDATE()");

    if (updates.length > 0)
      await executeQuery(
        `UPDATE Users SET ${updates.join(", ")} WHERE UserID = @userID`,
        params
      );

    TraceLogs(
      req,
      res,
      `Admin ${req.session.user.username} updated user with ID ${id}`
    );

    res.status(200).json({
      message: "Utilisateur mis à jour avec succès.",
    });
  } catch (error) {
    TraceError(req, res, `Error in updateAdminUser: ${error}`);
    res.status(500).json({
      error: "Une erreur est survenue lors de la mise à jour de l'utilisateur.",
    });
  }
};

exports.deleteAdminUser = async (req, res) => {
  // Check if user is admin
  if (!req.session.user || req.session.user.roleId !== 2)
    return res.status(403).json({
      error: "Vous n'avez pas les droits d'administration nécessaires.",
    });

  const { id } = req.params;

  if (!id)
    return res.status(400).json({
      error: "ID utilisateur manquant.",
    });

  try {
    // Check if user exists and is not the current user
    const user = await executeQuery(
      `SELECT UserID, Username FROM Users WHERE UserID = @userID`,
      [{ name: "userID", type: sql.Int, value: id }]
    );

    if (user.length === 0)
      return res.status(404).json({
        error: "Utilisateur non trouvé.",
      });

    if (user[0].UserID === req.session.user.id)
      return res.status(400).json({
        error:
          "Vous ne pouvez pas supprimer votre propre compte via l'administration.",
      });

    // Delete related data one table at a time to avoid syntax errors

    // Delete user's comment likes
    await executeQuery(`DELETE FROM CommentLiked WHERE UserID = @userID`, [
      { name: "userID", type: sql.Int, value: id },
    ]);

    // Delete user's comments
    await executeQuery(`DELETE FROM Comment WHERE UserID = @userID`, [
      { name: "userID", type: sql.Int, value: id },
    ]);

    // Delete user's artwork likes
    await executeQuery(`DELETE FROM Liked WHERE UserID = @userID`, [
      { name: "userID", type: sql.Int, value: id },
    ]);

    // Delete user's watch status
    await executeQuery(`DELETE FROM Watched WHERE UserID = @userID`, [
      { name: "userID", type: sql.Int, value: id },
    ]);

    // Delete user's friend relationships
    await executeQuery(
      `DELETE FROM Friend WHERE (UserID = @userID) OR (FriendsUserID = @userID)`,
      [{ name: "userID", type: sql.Int, value: id }]
    );

    // Delete user's notifications
    await executeQuery(`DELETE FROM Ref_NotifUser WHERE UserID = @userID`, [
      { name: "userID", type: sql.Int, value: id },
    ]);

    // Get user's lists
    const userLists = await executeQuery(
      `SELECT ListID FROM Ref_UsersList WHERE UserID = @userID`,
      [{ name: "userID", type: sql.Int, value: id }]
    );

    // If user has lists, delete artworks from them and then the lists
    if (userLists.length > 0) {
      const listIds = userLists.map((list) => list.ListID);

      // Delete artworks from user's lists
      for (const listId of listIds)
        await executeQuery(
          `DELETE FROM Ref_ListArtwork WHERE ListID = @listID`,
          [{ name: "listID", type: sql.Int, value: listId }]
        );

      // Delete user's lists references
      await executeQuery(`DELETE FROM Ref_UsersList WHERE UserID = @userID`, [
        { name: "userID", type: sql.Int, value: id },
      ]);

      // Delete user's lists
      for (const listId of listIds)
        await executeQuery(`DELETE FROM List WHERE ListID = @listID`, [
          { name: "listID", type: sql.Int, value: listId },
        ]);
    }

    // Delete trace logs
    await executeQuery(`DELETE FROM TraceLogs WHERE TraceUsers = @userID`, [
      { name: "userID", type: sql.Int, value: id },
    ]);

    // Finally delete user
    await executeQuery(`DELETE FROM Users WHERE UserID = @userID`, [
      { name: "userID", type: sql.Int, value: id },
    ]);

    TraceLogs(
      req,
      res,
      `Admin ${req.session.user.username} deleted user with ID ${id} (${user[0].Username})`
    );

    res.status(200).json({
      message: "Utilisateur supprimé avec succès.",
    });
  } catch (error) {
    TraceError(req, res, `Error in deleteAdminUser: ${error}`);
    res.status(500).json({
      error: "Une erreur est survenue lors de la suppression de l'utilisateur.",
    });
  }
};

exports.getAdminUserById = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.user || req.session.user.roleId !== 2)
      return res.status(403).json({
        error: "Vous n'avez pas les droits d'administration nécessaires.",
      });

    const { id } = req.params;

    if (!id)
      return res.status(400).json({
        error: "ID utilisateur manquant.",
      });

    // Include proper SQL parameter and add Bio and Gender fields
    const user = await executeQuery(
      `SELECT UserID, Username, EmailAddress, UserProfilePicture, FirstName, 
              LastName, UsersBirthDate, RoleID, CreationDate, Confidentiality,
              Bio, Gender 
       FROM Users
       WHERE UserID = @userID`,
      [{ name: "userID", type: sql.Int, value: parseInt(id) }]
    );

    if (user.length === 0)
      return res.status(404).json({
        error: "Utilisateur non trouvé.",
      });

    res.status(200).json(user[0]);
  } catch (error) {
    console.error(`Error in getAdminUserById: ${error}`);
    TraceError(req, res, `Error in getAdminUserById: ${error}`);
    res.status(500).json({
      error:
        "Une erreur est survenue lors de la récupération de l'utilisateur.",
    });
  }
};
