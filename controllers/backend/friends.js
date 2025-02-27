const { executeQuery } = require("../../db");
const { TraceLogs, TraceError, formatDate } = require("../functions");

exports.addFriends = async (req, res) => {
  const user = req.params["user"];
  const friends = req.params["friends"];
  try {
    await executeQuery(
      `INSERT INTO Friend VALUES((SELECT UserID From Users where Username = '${friends}'), (SELECT UserID From Users where Username = '${user}'))`
    );
    TraceLogs(
      req,
      res,
      `User ${req.session.user.username} has adding friend : ${friends}`
    );
    res.redirect("/discovery");
  } catch (e) {
    TraceError(req, res, `An error has occured with : ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.removeFriends = async (req, res) => {
  const user = req.params["user"];
  const friend = req.params["friend"];
  try {
    await executeQuery(`DELETE FROM Friend
                          WHERE UserID = (SELECT UserID from Users where Username = '${user}') AND FriendsUserID = (SELECT UserID from Users where Username = '${friend}')`);

    TraceLogs(
      req,
      res,
      `User ${req.session.user.username} has remove friend : ${friend}`
    );
    res.redirect("/discovery");
  } catch (e) {
    TraceError(req, res, `An error has occured with : ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.getUsersWithoutFriends = async (req, res) => {
  try {
    const user = req.params["user"];
    const query = await executeQuery(`
        SELECT U.UserID, U.Username, U.FirstName, U.LastName, U.CreationDate, U.UpdatedDate, U.UsersBirthDate, U.UserProfilePicture from Users U
        WHERE Username not in (
        SELECT U.Username from Friend F 
        INNER JOIN Users U ON U.UserID = FriendsUserID
        where F.UserID = (SELECT UserID FROM Users where Username = '${user}'))
        AND U.Username != '${user}'
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
};

exports.getFriendsByUser = async (req, res) => {
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
    TraceError(req, res, `An error occured ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};
