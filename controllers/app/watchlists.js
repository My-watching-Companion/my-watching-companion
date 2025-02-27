exports.getWatchlists = (req, res) => {
    res.render("my-watchlist", {
      selected: "Ma Watchlist",
      user: req.session.user,
    });
  }