exports.getSignin = (req, res) => {
  res.render("signin", { selected: "Connexion" });
};

exports.getSignup = (req, res) => {
  res.render("signup", { selected: "Inscription" });
};
