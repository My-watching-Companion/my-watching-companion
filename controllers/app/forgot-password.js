exports.getForgotPassword = (req, res) => {
  res.render("forgot-password", { selected: "Mot de Passe Oublié" });
};
