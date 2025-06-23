const { GetUserNotifications} = require("../../controllers/functions");

exports.getHome = async(req, res) => {
  userId = req.session.user ? req.session.user.id : null;
   let notifData = { notifications: [], unreadCount: 0 };

  if (userId) {
    notifData = await GetUserNotifications(userId);
  }

  res.render('home', {
    notifications: notifData.notifications,
    unreadCount: notifData.unreadCount,
    user: req.session.user,
    selected: "Accueil",
  });
};