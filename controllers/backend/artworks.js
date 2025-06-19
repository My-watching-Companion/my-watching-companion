const { executeQuery, sql } = require("../../db");
const { TMDB_API_KEY } = require("../../config");
const { TraceError } = require("../functions");

exports.getCreatorOfArtwork = async (req, res) => {
  const SearchArtwork = req.params["a"];
  try {
    const query =
      await executeQuery(`SELECT RAC.CreatorID, RC.CreatorName from Artowrk
                                        LEFT JOIN Ref_ArtworkCreator RAC ON RAC.ArtworkID = A.ArtworkID
                                        LEFT JOIN Ref_Creator RC ON RC.CreatorID = RAC.CreatorID
                                        WHERE A.ArtworkName = '${SearchArtwork}'`);
    res.json({
      ArtworkName: SearchArtwork,
      ArtworkCreator: query[0].map((creator) => ({
        CreatorID: creator.CreatorID,
        CreatorName: creator.CreatorName,
      })),
    });
  } catch (e) {
    TraceError(req, res, `An error occured ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.getAllNatures = async (req, res) => {
  try {
    const query = await executeQuery(
      `SELECT * from Ref_Nature order by NatureID`
    );
    res.json({
      Nature: query.map((element) => ({
        NatureID: element.NatureID,
        NatureLabel: element.NatureLabel,
      })),
    });
  } catch (e) {
    TraceError(req, res, `An error occured ${e}`);
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`,
    });
  }
};

exports.getUsersArtworks = async (req, res) => {
  try {
    const user = req.session.user;

    const query =
      await executeQuery(`SELECT L.ListID AS list_id, L.ListName AS list_name, 
                            A.ArtworkID AS artwork_id, A.ArtworkName AS artwork_name, A.ArtworkAPILink AS artwork_api, A.ArtworkPosterImage AS artwork_poster
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListID = L.ListID 
                            LEFT JOIN Ref_ListArtwork RLA ON RLA.ListID = L.ListID
                            LEFT JOIN Artwork A ON A.ArtworkID = RLA.ArtworkID
                            WHERE U.UserID = ${user.id}`);

    res.status(200).json(query);
  } catch (error) {
    res.status(400).json({
      error:
        "Une erreur est survenue lors de la récupération des titres de l'utilisateur.",
    });
  }
};

exports.searchArtworks = async (req, res) => {
  try {
    const { search } = req.body;

    let movies = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${search}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    movies = await movies.json();
    movies = movies.results;

    let categories = await fetch(
      "https://api.themoviedb.org/3/genre/movie/list?language=fr",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    categories = await categories.json();

    movies = movies.map((movie) => {
      movie.genres = movie.genre_ids
        .map((genre) => {
          const category = categories.genres.find(
            (category) => category.id === genre
          );
          return category ? category.name : "";
        })
        .filter((genre) => genre);

      return movie;
    });

    // Send the response to the user immediately
    res.status(200).json(movies);

    // Populate the database after sending the response
    try {
      for (const movie of movies)
        await executeQuery(
          `IF NOT EXISTS (SELECT 1 FROM Artwork WHERE ArtworkAPILink = @apiLink)
           BEGIN
             INSERT INTO Artwork (ArtworkName, ArtworkAPILink, ArtworkPosterImage)
             VALUES (@title, @apiLink, @poster);
           END`,
          [
            { name: "title", type: sql.NVarChar, value: movie.title },
            {
              name: "apiLink",
              type: sql.VarChar,
              value: `https://api.themoviedb.org/3/movie/${movie.id}`,
            },
            {
              name: "poster",
              type: sql.NVarChar,
              value: movie.poster_path,
            },
          ]
        );
    } catch (dbError) {
      console.error("Error populating database:", dbError);
    }
  } catch (error) {
    res.status(400);
    return res.json({
      error: "Une erreur est survenue lors de la recherche.",
    });
  }
};

exports.toggleUserLikedArtworkByID = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user)
      return res.status(401).json({
        error: "Vous devez être connecté pour gérer vos titres aimés.",
      });

    const { id: artwork_id } = req.params;

    if (!artwork_id)
      return res.status(400).json({
        error: "Veuillez spécifier un titre.",
      });

    // Toggle artwork favorite state
    const liked = await executeQuery(
      `IF NOT EXISTS (SELECT 1 FROM Liked WHERE UserID = @userID AND ArtworkID = @artworkID)
       BEGIN
         INSERT INTO Liked (UserID, ArtworkID)
         VALUES (@userID, @artworkID);
         SELECT SCOPE_IDENTITY() AS LikedID;
       END
       ELSE
       BEGIN
         DELETE FROM Liked WHERE UserID = @userID AND ArtworkID = @artworkID
       END`,
      [
        { name: "userID", type: sql.Int, value: user.id },
        { name: "artworkID", type: sql.Int, value: artwork_id },
      ]
    );

    res.status(200).json({
      message: `Le titre a été ${liked === undefined ? "retiré" : "ajouté"
        } de vos "j'aime" avec succès.`,
      liked: liked !== undefined,
    });
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la gestion du titre.",
    });
  }
};

exports.toggleUserWatchedArtworkByID = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user)
      return res.status(401).json({
        error: "Vous devez être connecté pour gérer vos titres visionnés.",
      });

    const { id: artwork_id } = req.params;

    if (!artwork_id)
      return res.status(400).json({
        error: "Veuillez spécifier un titre.",
      });

    // Toggle artwork favorite state
    const watched = await executeQuery(
      `SELECT W.UserID, W.ArtworkID, WT.WatchName FROM Watched W
       LEFT JOIN WatchType WT ON W.WatchTypeID = WT.WatchTypeID
       WHERE W.UserID = @userID AND W.ArtworkID = @artworkID`,
      [
        { name: "userID", type: sql.Int, value: user.id },
        { name: "artworkID", type: sql.Int, value: artwork_id },
      ]
    );
    let watchedState = null;

    if (watched.length === 0) {
      await executeQuery(
        `INSERT INTO Watched (UserID, ArtworkID, WatchTypeID) 
         VALUES (
           @userID, 
           @artworkID, 
           (SELECT WatchTypeID FROM WatchType WHERE WatchName = 'En Cours')
         )`,
        [
          { name: "userID", type: sql.Int, value: user.id },
          { name: "artworkID", type: sql.Int, value: artwork_id },
        ]
      );

      watchedState = "En Cours";
    } else if (watched[0].WatchName === "En Cours") {
      await executeQuery(
        `UPDATE Watched
         SET WatchTypeID = (SELECT WatchTypeID FROM WatchType WHERE WatchName = 'Regardé')
         WHERE UserID = @userID AND ArtworkID = @artworkID`,
        [
          { name: "userID", type: sql.Int, value: user.id },
          { name: "artworkID", type: sql.Int, value: artwork_id },
        ]
      );

      watchedState = "Regardé";
    } else
      await executeQuery(
        `DELETE FROM Watched WHERE UserID = @userID AND ArtworkID = @artworkID`,
        [
          { name: "userID", type: sql.Int, value: user.id },
          { name: "artworkID", type: sql.Int, value: artwork_id },
        ]
      );

    res.status(200).json({
      message: "Le status de votre titre a été modifié.",
      watchedState,
    });
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la gestion du titre.",
    });
  }
};

// Home page
exports.getTrendingMoviesByDay = async (req, res) => {
  try {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${TMDB_API_KEY}`
      }
    };

    const movies = [];

    let moviesByDay = await fetch('https://api.themoviedb.org/3/trending/movie/day?language=fr-FR', options)
    moviesByDay = await moviesByDay.json();
    moviesByDay = moviesByDay.results;

    for (const movie of moviesByDay) {
      const movieData = await executeQuery(
        `IF NOT EXISTS (SELECT 1 FROM Artwork WHERE ArtworkAPILink = @apiLink)
               BEGIN
                 INSERT INTO Artwork (ArtworkName, ArtworkAPILink, ArtworkPosterImage)
                 VALUES (@title, @apiLink, @poster);
                 SELECT * FROM Artwork WHERE ArtworkAPILink = @apiLink;
               END
               ELSE
               BEGIN
                 SELECT * FROM Artwork WHERE ArtworkAPILink = @apiLink;
               END`,
        [
          { name: "title", type: sql.NVarChar, value: movie.title },
          {
            name: "apiLink",
            type: sql.VarChar,
            value: `https://api.themoviedb.org/3/movie/${movie.id}`,
          },
          {
            name: "poster",
            type: sql.NVarChar,
            value: movie.poster_path,
          },
        ]
      );
      movies.push(movieData[0]);
    }

    res.json(movies);
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des tendances du jour.",
    });
  }
}


exports.getTrendingMoviesByWeek = async (req, res) => {
  try {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${TMDB_API_KEY}`
      }
    };

    const movies = [];

    let moviesByWeek = await fetch('https://api.themoviedb.org/3/trending/movie/week?language=fr-FR', options)
    moviesByWeek = await moviesByWeek.json();
    moviesByWeek = moviesByWeek.results;

    for (const movie of moviesByWeek) {
      const movieData = await executeQuery(
        `IF NOT EXISTS (SELECT 1 FROM Artwork WHERE ArtworkAPILink = @apiLink)
               BEGIN
                 INSERT INTO Artwork (ArtworkName, ArtworkAPILink, ArtworkPosterImage)
                 VALUES (@title, @apiLink, @poster);
                 SELECT * FROM Artwork WHERE ArtworkAPILink = @apiLink;
               END
               ELSE
               BEGIN
                 SELECT * FROM Artwork WHERE ArtworkAPILink = @apiLink;
               END`,
        [
          { name: "title", type: sql.NVarChar, value: movie.title },
          {
            name: "apiLink",
            type: sql.VarChar,
            value: `https://api.themoviedb.org/3/movie/${movie.id}`,
          },
          {
            name: "poster",
            type: sql.NVarChar,
            value: movie.poster_path,
          },
        ]
      );
      movies.push(movieData[0]);
    }

    res.json(movies);
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des tendances de la semaine.",
    });
  }
}

exports.getUpcomingMovies = async (req, res) => {
  try {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${TMDB_API_KEY}`
      }
    };

    const movies = [];

    let upcomingMovies = await fetch('https://api.themoviedb.org/3/movie/upcoming?language=fr-FR&page=4', options)
    upcomingMovies = await upcomingMovies.json();
    upcomingMovies = upcomingMovies.results;

    for (const movie of upcomingMovies) {
      const movieData = await executeQuery(
        `IF NOT EXISTS (SELECT 1 FROM Artwork WHERE ArtworkAPILink = @apiLink)
               BEGIN
                 INSERT INTO Artwork (ArtworkName, ArtworkAPILink, ArtworkPosterImage)
                 VALUES (@title, @apiLink, @poster);
                 SELECT * FROM Artwork WHERE ArtworkAPILink = @apiLink;
               END
               ELSE
               BEGIN
                 SELECT * FROM Artwork WHERE ArtworkAPILink = @apiLink;
               END`,
        [
          { name: "title", type: sql.NVarChar, value: movie.title },
          {
            name: "apiLink",
            type: sql.VarChar,
            value: `https://api.themoviedb.org/3/movie/${movie.id}`,
          },
          {
            name: "poster",
            type: sql.NVarChar,
            value: movie.poster_path,
          },
        ]
      );
      movies.push(movieData[0]);
    }

    res.json(movies);
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des films à venir.",
    });
  }
}