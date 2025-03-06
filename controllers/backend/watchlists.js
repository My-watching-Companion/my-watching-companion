const { executeQuery, sql } = require("../../db");
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

// New functions
exports.getUserWatchlists = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user)
      return res.status(401).json({
        error: "Vous devez être connecté pour obtenir ces informations.",
      });

    const query = await executeQuery(
      `SELECT TOP 1 WITH TIES  
                                          L.ListsID AS list_id, 
                                          L.ListsName AS list_name, 
                                          U.Username AS username, 
                                          A.ArtworkPosterImage AS cover_url
                                      FROM Users U
                                      LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                                      LEFT JOIN List L ON RUL.ListsID = L.ListsID
                                      LEFT JOIN Ref_ListArtwork RAL ON L.ListsID = RAL.ListsID
                                      LEFT JOIN Artwork A ON A.ArtworkID = RAL.ArtworkID 
                                      WHERE U.UserID = @userID
                                      ORDER BY ROW_NUMBER() OVER (PARTITION BY L.ListsID ORDER BY A.ArtworkID)`,
      [{ name: "userID", type: sql.Int, value: user.id }]
    );

    res.status(200).json(query);
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des listes.",
    });
  }
};

exports.getUserWatchlistByName = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user)
      return res.status(401).json({
        error: "Vous devez être connecté pour obtenir ces informations.",
      });

    const { name } = req.params;

    if (!name)
      return res.status(401).json({
        error: "Veuillez spécifier une liste à récupérer.",
      });

    const listQuery = await executeQuery(
      `SELECT L.ListsID AS list_id, 
                                                  L.ListsName AS list_name, 
                                                  U.Username AS username, 
                                                  A.ArtworkPosterImage AS cover_url
                                      FROM Users U
                                      LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                                      LEFT JOIN List L ON RUL.ListsID = L.ListsID
                                      LEFT JOIN Ref_ListArtwork RAL ON L.ListsID = RAL.ListsID
                                      LEFT JOIN Artwork A ON A.ArtworkID = RAL.ArtworkID 
                                      WHERE U.UserID = @userID AND L.ListsName = @listName`,
      [
        { name: "userID", type: sql.Int, value: user.id },
        { name: "listName", type: sql.VarChar, value: name },
      ]
    );

    if (listQuery.length === 0)
      return res.status(401).json({
        error: "Vous ne possédez pas cette liste.",
      });

    const list = listQuery[0];

    const artworksQuery = await executeQuery(
      `SELECT A.ArtworkID AS artwork_id,
                                                      A.ArtworkName AS artwork_name,
                                                      A.ArtworkAPILink AS artwork_api_link,
                                                      A.ArtworkPosterImage AS artwork_poster
                                              FROM Artwork A
                                              LEFT JOIN Ref_ListArtwork RLA ON A.ArtworkID = RLA.ArtworkID
                                              LEFT JOIN List L ON RLA.ListsID = L.ListsID
                                              WHERE L.ListsID = @listID`,
      [{ name: "listID", type: sql.Int, value: list.list_id }]
    );

    list.artworks = artworksQuery;

    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des listes.",
    });
  }
};

exports.createUserWatchlist = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user)
      return res.status(401).json({
        error: "Vous devez être connecté pour créer une liste.",
      });

    const { name } = req.body;

    if (!name || name.length === 0)
      return res.status(401).json({
        error: "Le nom de la liste ne peut pas être vide.",
      });

    // Check if the list already exists
    const list = await executeQuery(
      `SELECT L.ListsID AS list_id
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = @userID AND L.ListsName = @listName`,
      [
        { name: "userID", type: sql.Int, value: user.id },
        { name: "listName", type: sql.VarChar, value: name },
      ]
    );

    if (list.length > 0)
      return res.status(401).json({
        error: "Vous possédez déjà une liste avec ce nom.",
      });

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
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des listes.",
    });
  }
};

exports.updateUserWatchlist = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user)
      return res.status(401).json({
        error: "Vous devez être connecté pour modifier une liste.",
      });

    const { id } = req.params;

    if (!id)
      return res.status(400).json({
        error: "Veuillez spécifier une liste à modifier.",
      });

    const { name } = req.body;

    // Check if the list exists
    const list = await executeQuery(
      `SELECT L.ListsID AS list_id, L.ListsName AS list_name, U.Username AS username
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = @userID AND L.ListsID = @listID`,
      [
        { name: "userID", type: sql.Int, value: user.id },
        { name: "listID", type: sql.Int, value: id },
      ]
    );

    if (list.length === 0)
      return res.status(400).json({
        error: "Vous ne possédez pas cette liste.",
      });

    // Check if a list with the new name already exists
    const existingList = await executeQuery(
      `SELECT L.ListsID AS list_id, L.ListsName AS list_name, U.Username AS username
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = @userID AND L.ListsName = @listName`,
      [
        { name: "userID", type: sql.Int, value: user.id },
        { name: "listName", type: sql.VarChar, value: name },
      ]
    );

    if (existingList.length > 0)
      return res.status(400).json({
        error: "Vous possédez déjà une liste avec ce nom.",
      });

    // Update the list
    await executeQuery(
      `UPDATE List SET ListsName = @listName, UpdatedDate = GETDATE() WHERE ListsID = @listID`,
      [
        { name: "listName", type: sql.VarChar, value: name },
        { name: "listID", type: sql.Int, value: id },
      ]
    );

    res.status(200).json({
      message: "La liste a été modifiée avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la modification de la liste.",
    });
  }
};

exports.deleteUserWatchlist = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user)
      return res.status(401).json({
        error: "Vous devez être connecté pour supprimer une liste.",
      });

    const { id } = req.params;

    if (!id)
      return res.status(400).json({
        error: "Veuillez spécifier une liste à supprimer.",
      });

    // Check if the list exists
    const list = await executeQuery(
      `SELECT L.ListsID AS list_id, L.ListsName AS list_name, U.Username AS username
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            WHERE U.UserID = @userID AND L.ListsID = @id`,
      [
        { name: "userID", type: sql.Int, value: user.id },
        { name: "id", type: sql.Int, value: id },
      ]
    );

    if (list.length === 0)
      return res.status(400).json({
        error: "Vous ne possédez pas cette liste.",
      });

    // Delete the list and its references
    await executeQuery(`DELETE FROM Ref_ListArtwork WHERE ListsID = @listID`, [
      { name: "listID", type: sql.Int, value: id },
    ]);
    await executeQuery(`DELETE FROM Ref_UsersList WHERE ListsID = @listID`, [
      { name: "listID", type: sql.Int, value: id },
    ]);
    await executeQuery(`DELETE FROM List WHERE ListsID = @listID`, [
      { name: "listID", type: sql.Int, value: id },
    ]);

    res.status(200).json({
      message: "La liste a été supprimée avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      error:
        "Une erreur est survenue lors de la suppression de la liste.\n" + error,
    });
  }
};

exports.createUserArtworkByWatchlistName = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user)
      return res.status(401).json({
        error: "Vous devez être connecté pour ajouter un titre à une liste.",
      });

    const { artwork } = req.body;

    if (!artwork || !artwork.id)
      return res.status(400).json({
        error: "Données du titre invalides.",
      });

    const { name: list } = req.params;

    if (!list)
      return res.status(400).json({
        error: "Veuillez sélectionner une liste.",
      });

    // Get list ID
    const listQuery = await executeQuery(
      `SELECT L.ListsID 
       FROM List L 
       INNER JOIN Ref_UsersList UL ON UL.ListsID = L.ListsID 
       WHERE L.ListsName = @listName AND UL.UserID = @userId`,
      [
        { name: "listName", type: sql.VarChar, value: list },
        { name: "userId", type: sql.Int, value: user.id },
      ]
    );

    if (listQuery.length === 0)
      return res.status(404).json({
        error: "Vous ne possédez pas cette liste.",
      });

    const listId = listQuery[0].ListsID;

    // Check if artwork exists and get its ID, or insert if not exists
    const artworkQuery = await executeQuery(
      `IF NOT EXISTS (SELECT 1 FROM Artwork WHERE ArtworkAPILink = @apiLink)
       BEGIN
         INSERT INTO Artwork (ArtworkName, ArtworkAPILink, ArtworkPosterImage)
         VALUES (@title, @apiLink, @poster);
         SELECT SCOPE_IDENTITY() AS ArtworkID;
       END
       ELSE
       BEGIN
         SELECT ArtworkID FROM Artwork WHERE ArtworkAPILink = @apiLink;
       END`,
      [
        {
          name: "apiLink",
          type: sql.VarChar,
          value: `https://api.themoviedb.org/3/movie/${artwork.id}`,
        },
        { name: "title", type: sql.VarChar, value: artwork.title },
        { name: "poster", type: sql.VarChar, value: artwork.poster_path },
      ]
    );

    const artworkId = artworkQuery[0].ArtworkID;

    // Check if artwork is already in list
    const existingEntry = await executeQuery(
      `SELECT 1 FROM Ref_ListArtwork 
       WHERE ListsID = @listId AND ArtworkID = @artworkId`,
      [
        { name: "listId", type: sql.Int, value: listId },
        { name: "artworkId", type: sql.Int, value: artworkId },
      ]
    );

    if (existingEntry.length > 0)
      return res.status(400).json({
        error: "Ce titre est déjà dans votre liste.",
      });

    // Add artwork to list
    await executeQuery(
      `INSERT INTO Ref_ListArtwork (ArtworkID, ListsID) 
       VALUES (@artworkId, @listId)`,
      [
        { name: "artworkId", type: sql.Int, value: artworkId },
        { name: "listId", type: sql.Int, value: listId },
      ]
    );

    res.status(201).json({
      message: "Le titre a été ajouté à la liste avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de l'ajout du titre.",
    });
  }
};
