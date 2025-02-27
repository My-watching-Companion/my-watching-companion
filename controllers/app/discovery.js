exports.getDiscovery = async (req, res) => {
  const user = req.session.user;
  let isfriends = false;
  let iswl = false;
  const friends = await fetch(
    `http://localhost:3000/api/friends/${req.session.user.username}`
  ).then((resp) => resp.json());

  let allusers = await fetch(
    `http://localhost:3000/api/getuserswithoutfriends/${req.session.user.username}`
  ).then((resp) => resp.json());

  let wloffriends = {};
  if (friends.Friends.length > 0) {
    isfriends = true;
  }
  for (const element of friends.Friends) {
    const watchlists = await fetch(
      `http://localhost:3000/api/users/${element.Username}/watchlists`
    ).then((resp) => resp.json());
    if (watchlists.Watchlist === null) {
      continue;
    } else {
      wloffriends[element.Username] = watchlists;
    }
  }
  for (const user of Object.keys(wloffriends)) {
    for (const wl of wloffriends[user].Watchlist) {
      if (wl !== null || wl !== undefined || wl.length !== 0) {
        iswl = true;
        break;
      }
    }
  }
  res.render("discovery", {
    selected: "Découverte",
    friends: friends,
    wloffriends: wloffriends,
    isfriends: isfriends,
    iswl: iswl,
    user: req.session.user,
    allusers: allusers,
  });
};
