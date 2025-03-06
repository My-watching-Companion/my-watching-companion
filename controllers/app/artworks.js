const { TMDB_API_KEY } = require("../../config");
const { executeQuery } = require("../../db");

exports.getArtwork = async (req, res) => {
  const artworkId = req.params.id;

  const artwork = await executeQuery(
    `SELECT * FROM Artwork WHERE ArtworkID = ${artworkId}`
  );

  if (artwork.length === 0) {
    res.status(404);
    res.render("error", { selected: "Erreur" });
    return;
  }

  let artworkTMDBInfos = await fetch(
    artwork[0].ArtworkAPILink + "?language=fr-FR",
    {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    }
  );
  artworkTMDBInfos = await artworkTMDBInfos.json();

  artwork[0].ArtworkTMDB = artworkTMDBInfos;

  res.render("artwork", {
    selected: "Artwork",
    user: req.session.user,
    artwork: artwork[0],
  });
};
