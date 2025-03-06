exports.getSettings = async (req, res) => {
  res.render("settings", {
    selected: "Paramètres",
    choice: null,
    user: req.session.user,
  });
};

exports.getSettingsByCatAndPage = async (req, res) => {
  const categories = req.params["cat"];
  const page = req.params["sett"];
  let friends = null;
  let allusers = null;
  let nature = null;
  if (categories !== undefined && page !== undefined) {
    if (categories === "profile" && page === "modifyprofile") {
    } else if (categories === "watchlists" && page === "preferences") {
      nature = await fetch("http://localhost:3000/api/getallnature").then(
        (resp) => resp.json()
      );
    }
    console.log(req.session.user);
    res.render("settings", {
      selected: "Paramètres",
      choice: `${categories}/${page}`,
      user: req.session.user,
      friends: friends,
      allusers: allusers,
      nature: nature,
    });
  }
};
