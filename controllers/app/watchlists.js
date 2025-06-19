exports.getWatchlists = (req, res) => {
  res.render("my-watchlists", {
    selected: "Mes Watchlists",
    user: req.session.user,
  });
};

exports.getWatchlistByName = (req, res) => {
  const { name } = req.params;

  if (!name) return res.redirect("/my-watchlists");

  res.render("watchlist", {
    selected: "Mes Watchlists",
    user: req.session.user,
    listName: name,
  });
};
