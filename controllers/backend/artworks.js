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
      await executeQuery(`SELECT L.ListsID AS list_id, L.ListsName AS list_name, 
                            A.ArtworkID AS artwork_id, A.ArtworkName AS artwork_name, A.ArtworkAPILink AS artwork_api, A.ArtworkPosterImage AS artwork_poster
                            FROM Users U
                            LEFT JOIN Ref_UsersList RUL ON U.UserID = RUL.UserID 
                            LEFT JOIN List L ON RUL.ListsID = L.ListsID 
                            LEFT JOIN Ref_ListArtwork RLA ON RLA.ListsID = L.ListsID
                            LEFT JOIN Artwork A ON A.ArtworkID = RLA.ArtworkID
                            WHERE U.UserID = ${user.id}`);

    res.status(200);
    return res.json(query);
  } catch (error) {
    res.status(400);
    return res.json({
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
  
      res.status(200);
      return res.json(movies);
    } catch (error) {
      res.status(400);
      return res.json({
        error: "Une erreur est survenue lors de la recherche.",
      });
    }
  }