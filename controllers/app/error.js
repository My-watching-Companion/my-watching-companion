exports.getError = (req, res) => {
  res.status(404);

  res.render("error", { selected: "Erreur" });
};
