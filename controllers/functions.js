const { executeQuery } = require("../db");



function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/signin");
  }
}

function ChangeSession(
  req,
  UserID,
  Username,
  UserProfilePicture,
  EmailAddress,
  FirstName,
  LastName,
  Confidentiality,
  Bio,
  Gender
) {
  req.session.user = {
    id: UserID,
    username: Username,
    avatar_url: UserProfilePicture,
    email: EmailAddress,
    firstname: FirstName,
    lastname: LastName,
    confidentiality: Confidentiality,
    bio: Bio,
    gender: Gender,
  };
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


module.exports = {
  isAuthenticated,
  ChangeSession,
  CheckAge,
  GetUser,
  TraceLogs,
  TraceError,
};