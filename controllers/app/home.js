exports.getHome = (req, res) => {
  res.render("home", 
    { selected: "Accueil",
      user: req.session.user,
    });
}