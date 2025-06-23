exports.getProfil = (req, res) => {
  console.log(req.session.user);
  res.render("profil", {user: req.session.user,});
};
