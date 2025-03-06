const { executeQuery } = require("../../db");
const { TraceError } = require("../functions");

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

    res.status(200).json(query);
  } catch (error) {
    res.status(400).json({
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

    if (!lists || lists.length === 0)
      return res.status(400).json({
        error: "Veuillez sélectionner au moins une liste.",
      });

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

    res.status(200).json({
      success: "Le titre a été ajouté à la/aux liste(s) avec succès.",
    });
  } catch (error) {
    res.status(400).json({
      error: "Une erreur est survenue lors de la recherche.",
    });
  }
};

// New functions
exports.getUserWatchlists = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      res.status(400);
      return res.json({
        error: "Vous devez être connecté pour obtenir ces informations.",
      });
    }

    const query = await executeQuery(`SELECT TOP 1 WITH TIES  
                                          L.ListsID AS list_id, 
                                          L.ListsName AS list_name, 
                                          U.Username AS username, 
                                          A.ArtworkPosterImage AS cover_url
                                      FROM Users U
                                      LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                                      LEFT JOIN List L ON RUL.ListsID = L.ListsID
                                      LEFT JOIN Ref_ListArtwork RAL ON L.ListsID = RAL.ListsID
                                      LEFT JOIN Artwork A ON A.ArtworkID = RAL.ArtworkID 
                                      WHERE U.UserID = ${user.id}
                                      ORDER BY ROW_NUMBER() OVER (PARTITION BY L.ListsID ORDER BY A.ArtworkID)`);

    res.status(200).json(query);
  } catch (error) {
    res.status(400).json({
      error: "Une erreur est survenue lors de la récupération des listes.",
    });
  }
};

exports.getUserWatchlistByName = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      res.status(400);
      return res.json({
        error: "Vous devez être connecté pour obtenir ces informations.",
      });
    }

    const { name } = req.params;

    if (!name) {
      res.status(400);
      return res.json({
        error: "Veuillez spécifier une liste à récupérer.",
      });
    }

    const listQuery = await executeQuery(`SELECT L.ListsID AS list_id, 
                                                  L.ListsName AS list_name, 
                                                  U.Username AS username, 
                                                  A.ArtworkPosterImage AS cover_url
                                      FROM Users U
                                      LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                                      LEFT JOIN List L ON RUL.ListsID = L.ListsID
                                      LEFT JOIN Ref_ListArtwork RAL ON L.ListsID = RAL.ListsID
                                      LEFT JOIN Artwork A ON A.ArtworkID = RAL.ArtworkID 
                                      WHERE U.UserID = ${user.id} AND L.ListsName = '${name}'`);

    if (listQuery.length === 0) {
      res.status(400);
      return res.json({
        error: "Vous ne possédez pas cette liste.",
      });
    }

    const list = listQuery[0];

    const artworksQuery = await executeQuery(`SELECT A.ArtworkID AS artwork_id,
                                                      A.ArtworkName AS artwork_name,
                                                      A.ArtworkAPILink AS artwork_api_link,
                                                      A.ArtworkPosterImage AS artwork_poster
                                              FROM Artwork A
                                              LEFT JOIN Ref_ListArtwork RLA ON A.ArtworkID = RLA.ArtworkID
                                              LEFT JOIN List L ON RLA.ListsID = L.ListsID
                                              WHERE L.ListsID = ${list.list_id}`);

    list.artworks = artworksQuery;

    res.status(200).json(list);
  } catch (error) {
    res.status(400).json({
      error: "Une erreur est survenue lors de la récupération des listes.",
    });
  }
};

exports.createUserWatchlist = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      res.status(400);
      return res.json({
        error: "Vous devez être connecté pour créer une liste.",
      });
    }

    const { name } = req.body;

    if (!name || name.length === 0) {
      res.status(400);
      return res.json({
        error: "Le nom de la liste ne peut pas être vide.",
      });
    }

    // Check if the list already exists
    const list = await executeQuery(`SELECT L.ListsID AS list_id
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = ${user.id} AND L.ListsName = '${name}'`);

    if (list.length > 0) {
      res.status(400);
      return res.json({
        error: "Vous possédez déjà une liste avec ce nom.",
      });
    }

    // Create the list
    const insertedList = await executeQuery(
      `INSERT INTO List OUTPUT INSERTED.ListsID VALUES ('${name}', GETDATE())`
    );

    // Link the list to the user
    await executeQuery(
      `INSERT INTO Ref_UsersList VALUES (${user.id}, ${insertedList[0].ListsID})`
    );

    res.status(201).json({
      message: "La liste a été créée avec succès.",
    });
  } catch (error) {
    res.status(400).json({
      error: "Une erreur est survenue lors de la récupération des listes.",
    });
  }
};

exports.updateUserWatchlist = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      res.status(400);
      return res.json({
        error: "Vous devez être connecté pour modifier une liste.",
      });
    }

    const { id } = req.params;

    if (!id) {
      res.status(400);
      return res.json({
        error: "Veuillez spécifier une liste à modifier.",
      });
    }

    const { name } = req.body;

    // Check if the list exists
    const list =
      await executeQuery(`SELECT L.ListsID AS list_id, L.ListsName AS list_name, U.Username AS username
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = ${user.id} AND L.ListsID = ${id}`);

    if (list.length === 0) {
      res.status(400);
      return res.json({
        error: "Vous ne possédez pas cette liste.",
      });
    }

    // Check if a list with the new name already exists
    const existingList =
      await executeQuery(`SELECT L.ListsID AS list_id, L.ListsName AS list_name, U.Username AS username
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = ${user.id} AND L.ListsName = '${name}'`);

    if (existingList.length > 0) {
      res.status(400);
      return res.json({
        error: "Vous possédez déjà une liste avec ce nom.",
      });
    }

    // Update the list
    await executeQuery(
      `UPDATE List SET ListsName = '${name}', UpdatedDate = GETDATE() WHERE ListsID = ${id}`
    );

    res.status(200).json({
      message: "La liste a été modifiée avec succès.",
    });
  } catch (error) {
    res.status(400).json({
      error:
        "Une erreur est survenue lors de la modification de la liste.\n" +
        error,
    });
  }
};

exports.deleteUserWatchlist = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      res.status(400);
      return res.json({
        error: "Vous devez être connecté pour supprimer une liste.",
      });
    }

    const { id } = req.params;

    if (!id) {
      res.status(400);
      return res.json({
        error: "Veuillez spécifier une liste à supprimer.",
      });
    }

    // Check if the list exists
    const list =
      await executeQuery(`SELECT L.ListsID AS list_id, L.ListsName AS list_name, U.Username AS username
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = ${user.id} AND L.ListsID = ${id}`);

    if (list.length === 0) {
      res.status(400);
      return res.json({
        error: "Vous ne possédez pas cette liste.",
      });
    }

    // Delete the list and its references
    await executeQuery(`DELETE FROM Ref_ListArtwork WHERE ListsID = ${id}`);
    await executeQuery(`DELETE FROM Ref_UsersList WHERE ListsID = ${id}`);
    await executeQuery(`DELETE FROM List WHERE ListsID = ${id}`);

    res.status(200).json({
      message: "La liste a été supprimée avec succès.",
    });
  } catch (error) {
    res.status(400).json({
      error:
        "Une erreur est survenue lors de la suppression de la liste.\n" + error,
    });
  }
};
