exports.getSignin = (req, res) => {
  if (req.session.user) return res.redirect("/");

  // Check if there's a redirect parameter in the URL
  const redirectUrl = req.query.redirect;
  if (redirectUrl) req.session.returnTo = redirectUrl;

  // Check if there's an "expired" parameter which indicates session expiration
  const sessionExpired = req.query.expired === "true";

  res.render("signin", {
    title: "Sign In",
    selected: "Connexion",
    sessionExpired: sessionExpired,
  });
};

exports.getSignup = (req, res) => {
  res.render("signup", { selected: "Inscription" });
};

exports.getForgotPassword = (req, res) => {
  res.render("forgot-password", { selected: "Mot de Passe Oublié" });
};
