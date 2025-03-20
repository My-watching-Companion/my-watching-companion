exports.getHome = (req, res) => {
    res.render("home", { selected: "Accueil" });
  }