exports.getWatchlistsByUsername = async (req, res) => {
  const SearchUser = req.params["u"];
  try {
    const query = await executeQuery(
      `SELECT U.UserID, L.ListsID, L.ListsName, U.UpdatedDate
        from Users U
          INNER JOIN Ref_UsersList RULi ON U.UserID = RULi.UserID 
          LEFT JOIN List L ON RULi.ListsID = L.ListsID
          WHERE U.Username = '${SearchUser}' AND U.Confidentiality != 1`
    );
    if (query.length === 0) {
      return res.json({
        Watchlist: null,
      });
    }
    res.json({
      User: { UserID: query[0].UserID, UserURL: `/api/users/${SearchUser}` },
      Watchlist: query.map((element) => ({
        ListsID: element.ListsID,
        ListName: element.ListsName,
        Updated: element.UpdatedDate,
        ListURL: `/api/${SearchUser}/watchlists/${element.ListsName}`,
      })),
    });
  } catch (e) {
    TraceError(req, res, `An error occured ${e}`);
    res.json({
      status: "KO",
      message: `Internal server error : ${e}`,
    });
  }
};

exports.getWatchlistByUsernameAndListname = async (req, res) => {
  const SearchUser = req.params["u"];
  const SearchList = req.params["w"];
  try {
    const query =
      await executeQuery(`SELECT U.UserID, U.ListsID, U.ListsName, U.UpdatedDate, A.ArtworkID, A.ArtworkName, RN.NatureLabel, RT.TypeName 
                                        from Users U 
                                        LEFT JOIN Ref_UsersLists RUL ON U.UserID = RUL.UserID 
                                        LEFT JOIN List U ON RUL.ListsID = U.ListsID 
                                        LEFT JOIN Ref_ListArtwork RULA ON RULA.ListsID = U.ListsID
                                        LEFT JOIN Artwork A ON A.ArtworkID = RULA.ArtworkID
                                        LEFT JOIN Ref_ArtworkType RAT ON RAT.ArtworkID = A.ArtworkID
                                        LEFT JOIN Ref_ArtworkNature RAN ON RAN.ArtworkID = A.ArtworkID
                                        LEFT JOIN Ref_ArtworkCreator RAC ON RAC.ArtworkID = A.ArtworkID
                                        LEFT JOIN Ref_Creator RC ON RC.CreatorID = RAC.CreatorID
                                        WHERE U.Username = '${SearchUser}' AND U.ListsName = '${SearchList}'`);

    res.json({
      User: { UserID: query[0].UserID, UserURL: `/api/users/${SearchUser}` },
      WatchListInfo: {
        ListsID: element.ListsID,
        ListName: element.ListsName,
        Updated: element.UpdatedDate,
        Artwork: query[0].map((element) => ({
          ArtworkID: element.ArtworkID,
          ArtworkName: element.ArtworkName,
          ArtworkNature: element.NatureLabel,
          ArtworkType: element.Ref_ArtworkType,
          ArtworkCreatorURL: `/api/artwork/${element.ArtworkName}/creator`,
        })),
      },
    });
  } catch (e) {
    TraceError(req, res, `An error occured ${e}`);
    res.json({
      status: "KO",
      message: `Internal server error : ${e}`,
    });
  }
};

exports.getUsersLists = async (req, res) => {
  try {
    const user = req.session.user;

    const query =
      await executeQuery(`SELECT L.ListsID AS list_id, L.ListsName AS list_name
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = ${user.id}`);

    res.status(200);
    return res.json(query);
  } catch (error) {
    res.status(400);
    return res.json({
      error: "Une erreur est survenue lors de la récupération des listes.",
    });
  }
};

exports.addArtworkToList = async (req, res) => {
  try {
    const { artwork, lists } = req.body;
    const user = req.session.user;

    // Checks
    if (!artwork) {
      res.status(400);
      return res.json({
        error: "Veuillez renseigner un titre.",
      });
    }

    if (!lists || lists.length === 0) {
      res.status(400);
      return res.json({
        error: "Veuillez sélectionner au moins une liste.",
      });
    }

    // Check if the artwork is already in the database
    const artworkAPILink = `https://api.themoviedb.org/3/movie/${artwork.id}`;

    await executeQuery(
      `IF NOT EXISTS (SELECT * FROM Artwork WHERE ArtworkAPILink = '${artworkAPILink}') INSERT INTO Artwork VALUES ('${artwork.title}', '${artworkAPILink}', '${artwork.poster_path}')`
    );

    // Add artwork to lists
    for (const list of lists)
      await executeQuery(
        `INSERT INTO Ref_ListArtwork VALUES (
            (SELECT ArtworkID FROM Artwork WHERE ArtworkAPILink = '${artworkAPILink}'), 
            (SELECT L.ListsID FROM List L INNER JOIN Ref_UsersList UL ON UL.ListsID = L.ListsID WHERE L.ListsName = '${list}' AND UL.UserID = ${user.id})
          )`
      );

    res.status(200);
    return res.json({
      success: "Le titre a été ajouté à la/aux liste(s) avec succès.",
    });
  } catch (error) {
    res.status(400);
    return res.json({
      error: "Une erreur est survenue lors de la recherche.",
    });
  }
};
