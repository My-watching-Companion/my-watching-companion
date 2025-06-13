const { executeQuery, sql } = require("../../db");

exports.getComments = async (req, res) => {
  try {
    const userID = req.session.user ? req.session.user.id : null;

    const comments = await executeQuery(
      `SELECT U.UserID AS user_id, 
              U.Username AS username, 
              U.UserProfilePicture AS user_avatar_url, 
              C.ArtworkID AS artwork_id,
              C.CommentID AS comment_id, 
              C.Comment AS comment_content,
              C.CreationDate AS comment_creation,
              C.UpdatedDate AS comment_updated,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 1) AS comment_likes,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 0) AS comment_dislikes,
              (SELECT CommentLiked FROM CommentLiked WHERE CommentID = C.CommentID AND UserID = @userID) AS user_reaction
       FROM Comment C
       LEFT JOIN Users U ON U.UserID = C.UserID
	     ORDER BY comment_id DESC`,
      userID ? [{ name: "userID", type: sql.Int, value: userID }] : []
    );

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCommentsByArtworkID = async (req, res) => {
  const { id: artworkID } = req.params;
  const userID = req.session.user ? req.session.user.id : null;

  if (!artworkID)
    return res.status(400).json({
      error: "An artwork id is required to get comments by artwork.",
    });

  try {
    const comments = await executeQuery(
      `SELECT U.UserID AS user_id, 
              U.Username AS username, 
              U.UserProfilePicture AS user_avatar_url, 
              C.ArtworkID AS artwork_id,
              C.CommentID AS comment_id, 
              C.Comment AS comment_content,
              C.CreationDate AS comment_creation,
              C.UpdatedDate AS comment_updated,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 1) AS comment_likes,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 0) AS comment_dislikes,
              (SELECT CommentLiked FROM CommentLiked WHERE CommentID = C.CommentID AND UserID = @userID) AS user_reaction
       FROM Comment C
       LEFT JOIN Users U ON U.UserID = C.UserID
       WHERE C.ArtworkID = @artworkID
	     ORDER BY comment_id DESC`,
      [
        { name: "artworkID", type: sql.Int, value: artworkID },
        { name: "userID", type: sql.Int, value: userID },
      ]
    );

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCommentsByUser = async (req, res) => {
  const user = req.session.user;

  if (!user)
    return res
      .status(401)
      .json({ error: "You must be logged in to get comments by user." });

  try {
    const comments = await executeQuery(
      `SELECT U.UserID AS user_id, 
              U.Username AS username, 
              U.UserProfilePicture AS user_avatar_url, 
              C.ArtworkID AS artwork_id,
              C.CommentID AS comment_id, 
              C.Comment AS comment_content,
              C.CreationDate AS comment_creation,
              C.UpdatedDate AS comment_updated,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 1) AS comment_likes,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 0) AS comment_dislikes,
              (SELECT CommentLiked FROM CommentLiked WHERE CommentID = C.CommentID AND UserID = @userID) AS user_reaction
       FROM Comment C
       LEFT JOIN Users U ON U.UserID = C.UserID
       WHERE C.UserID = @userID
	     ORDER BY comment_id DESC`,
      [{ name: "userID", type: sql.Int, value: user.id }]
    );

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createComment = async (req, res) => {
  const { artworkID, comment } = req.body;
  const user = req.session.user;

  if (!user)
    return res
      .status(401)
      .json({ error: "You must be logged in to create a comment." });

  if (!artworkID || !comment)
    return res.status(400).json({
      error: "An artwork id and comment are required to create a comment.",
    });

  try {
    await executeQuery(
      `INSERT INTO Comment (ArtworkID, UserID, Comment, CreationDate) VALUES (@artworkID, @userID, @comment, GETDATE())`,
      [
        { name: "artworkID", type: sql.Int, value: artworkID },
        { name: "userID", type: sql.Int, value: user.id },
        { name: "comment", type: sql.NVarChar, value: comment },
      ]
    );

    res.status(201).json({ message: "Comment created successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  const { id: commentID } = req.params;
  const { comment } = req.body;
  const user = req.session.user;

  if (!user)
    return res
      .status(401)
      .json({ error: "You must be logged in to update a comment." });

  if (!commentID || !comment)
    return res.status(400).json({
      error: "A comment id and comment are required to update a comment.",
    });

  try {
    const commentExists = await executeQuery(
      `SELECT UserID FROM Comment WHERE CommentID = @commentID AND UserID = @userID`,
      [
        { name: "commentID", type: sql.Int, value: commentID },
        { name: "userID", type: sql.Int, value: user.id },
      ]
    );

    if (commentExists.length === 0)
      return res.status(403).json({
        error: "You are not authorized to delete this comment.",
      });

    await executeQuery(
      `UPDATE Comment SET Comment = @comment, UpdatedDate = GETDATE() WHERE CommentID = @commentID AND UserID = @userID`,
      [
        { name: "comment", type: sql.VarChar, value: comment },
        { name: "commentID", type: sql.Int, value: commentID },
        { name: "userID", type: sql.Int, value: user.id },
      ]
    );

    res.status(200).json({ message: "Comment updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  const { id: commentID } = req.params;
  const user = req.session.user;

  if (!user)
    return res
      .status(401)
      .json({ error: "You must be logged in to delete a comment." });

  if (!commentID)
    return res.status(400).json({
      error: "A comment id is required to delete a comment.",
    });

  try {
    const comment = await executeQuery(
      `SELECT * FROM Comment WHERE CommentID = @commentID`,
      [{ name: "commentID", type: sql.Int, value: commentID }]
    );

    if (comment[0].UserID !== user.id)
      return res.status(403).json({
        error: "You are not authorized to delete this comment.",
      });

    await executeQuery(
      `DELETE FROM CommentLiked WHERE CommentID = @commentID
       DELETE FROM Comment WHERE CommentID = @commentID AND UserID = @userID`,
      [
        { name: "commentID", type: sql.Int, value: commentID },
        { name: "userID", type: sql.Int, value: user.id },
      ]
    );

    res.status(200).json({ message: "Comment deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.likeComment = async (req, res) => {
  const { id: commentID } = req.params;
  const user = req.session.user;

  if (!user)
    return res
      .status(401)
      .json({ error: "You must be logged in to like a comment." });

  if (!commentID)
    return res.status(400).json({
      error: "A comment id is required to like a comment.",
    });

  try {
    // Check if comment exists
    const commentResult = await executeQuery(
      `SELECT CommentID FROM Comment WHERE CommentID = @commentID`,
      [{ name: "commentID", type: sql.Int, value: commentID }]
    );

    if (commentResult.length === 0)
      return res.status(404).json({ error: "Comment not found." });

    // Check if user has already reacted
    let previousReaction = null;
    let removedReaction = false;

    const existingReaction = await executeQuery(
      `SELECT CommentLiked FROM CommentLiked WHERE CommentID = @commentID AND UserID = @userID`,
      [
        { name: "commentID", type: sql.Int, value: commentID },
        { name: "userID", type: sql.Int, value: user.id },
      ]
    );

    if (existingReaction.length > 0) {
      previousReaction = existingReaction[0].CommentLiked ? "like" : "dislike";

      // If already liked, remove the reaction
      if (previousReaction === "like") {
        await executeQuery(
          `DELETE FROM CommentLiked WHERE CommentID = @commentID AND UserID = @userID`,
          [
            { name: "commentID", type: sql.Int, value: commentID },
            { name: "userID", type: sql.Int, value: user.id },
          ]
        );
        removedReaction = true;
      }
      // Update the reaction from dislike to like
      else
        await executeQuery(
          `UPDATE CommentLiked SET CommentLiked = 1 WHERE CommentID = @commentID AND UserID = @userID`,
          [
            { name: "commentID", type: sql.Int, value: commentID },
            { name: "userID", type: sql.Int, value: user.id },
          ]
        );
    }
    // No existing reaction, insert a new one
    else
      await executeQuery(
        `INSERT INTO CommentLiked (CommentID, UserID, CommentLiked) VALUES (@commentID, @userID, 1)`,
        [
          { name: "commentID", type: sql.Int, value: commentID },
          { name: "userID", type: sql.Int, value: user.id },
        ]
      );

    res.status(200).json({
      message: "Like updated successfully",
      previousReaction,
      removedReaction,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.dislikeComment = async (req, res) => {
  const { id: commentID } = req.params;
  const user = req.session.user;

  if (!user)
    return res
      .status(401)
      .json({ error: "You must be logged in to dislike a comment." });

  if (!commentID)
    return res.status(400).json({
      error: "A comment id is required to dislike a comment.",
    });

  try {
    // Check if comment exists
    const commentResult = await executeQuery(
      `SELECT CommentID FROM Comment WHERE CommentID = @commentID`,
      [{ name: "commentID", type: sql.Int, value: commentID }]
    );

    if (commentResult.length === 0)
      return res.status(404).json({ error: "Comment not found." });

    // Check if user has already reacted
    let previousReaction = null;
    let removedReaction = false;

    const existingReaction = await executeQuery(
      `SELECT CommentLiked FROM CommentLiked WHERE CommentID = @commentID AND UserID = @userID`,
      [
        { name: "commentID", type: sql.Int, value: commentID },
        { name: "userID", type: sql.Int, value: user.id },
      ]
    );

    if (existingReaction.length > 0) {
      previousReaction = existingReaction[0].CommentLiked ? "like" : "dislike";

      // If already disliked, remove the reaction
      if (previousReaction === "dislike") {
        await executeQuery(
          `DELETE FROM CommentLiked WHERE CommentID = @commentID AND UserID = @userID`,
          [
            { name: "commentID", type: sql.Int, value: commentID },
            { name: "userID", type: sql.Int, value: user.id },
          ]
        );
        removedReaction = true;
      }
      // Update the reaction from like to dislike
      else
        await executeQuery(
          `UPDATE CommentLiked SET CommentLiked = 0 WHERE CommentID = @commentID AND UserID = @userID`,
          [
            { name: "commentID", type: sql.Int, value: commentID },
            { name: "userID", type: sql.Int, value: user.id },
          ]
        );
    }
    // No existing reaction, insert a new one
    else
      await executeQuery(
        `INSERT INTO CommentLiked (CommentID, UserID, CommentLiked) VALUES (@commentID, @userID, 0)`,
        [
          { name: "commentID", type: sql.Int, value: commentID },
          { name: "userID", type: sql.Int, value: user.id },
        ]
      );

    res.status(200).json({
      message: "Dislike updated successfully",
      previousReaction,
      removedReaction,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrendingComments = async (req, res) => {
  try {
    const userID = req.session.user ? req.session.user.id : null;

    const comments = await executeQuery(
      `SELECT TOP 20
              U.UserID AS user_id,
              U.Username AS username,
              U.UserProfilePicture AS user_avatar_url,
              A.ArtworkID AS artwork_id,
              A.ArtworkName AS artwork_name,
              A.ArtworkPosterImage AS artwork_poster,
              C.CommentID AS comment_id,
              C.Comment AS comment_content,
              C.CreationDate AS comment_creation,
              C.UpdatedDate AS comment_updated,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 1) AS comment_likes,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 0) AS comment_dislikes,
              ${
                userID
                  ? `(SELECT CommentLiked FROM CommentLiked WHERE CommentID = C.CommentID AND UserID = @userID) AS user_reaction`
                  : "NULL AS user_reaction"
              }
       FROM Comment C
       LEFT JOIN Users U ON U.UserID = C.UserID
       LEFT JOIN Artwork A ON A.ArtworkID = C.ArtworkID
       WHERE C.CreationDate >= DATEADD(day, -7, GETDATE())
       ORDER BY comment_likes DESC`,
      userID ? [{ name: "userID", type: sql.Int, value: userID }] : []
    );

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin functions for comment management
exports.getAdminComments = async (req, res) => {
  // Check if user is admin
  if (!req.session.user || req.session.user.roleId !== 2)
    return res.status(403).json({
      error: "Vous n'avez pas les droits d'administration nécessaires.",
    });

  try {
    const comments = await executeQuery(
      `SELECT C.CommentID, C.Comment AS CommentContent, C.CreationDate, C.UpdatedDate,
              U.Username, U.UserID,
              A.ArtworkName, A.ArtworkID,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 1) AS Likes,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 0) AS Dislikes
       FROM Comment C
       JOIN Users U ON C.UserID = U.UserID
       JOIN Artwork A ON C.ArtworkID = A.ArtworkID
       ORDER BY C.CreationDate DESC`
    );

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({
      error:
        "Une erreur est survenue lors de la récupération des commentaires.",
    });
  }
};

exports.deleteAdminComment = async (req, res) => {
  // Check if user is admin
  if (!req.session.user || req.session.user.roleId !== 2)
    return res.status(403).json({
      error: "Vous n'avez pas les droits d'administration nécessaires.",
    });

  const { id } = req.params;

  if (!id)
    return res.status(400).json({
      error: "ID de commentaire manquant.",
    });

  try {
    // Check if comment exists
    const comment = await executeQuery(
      `SELECT CommentID, UserID FROM Comment WHERE CommentID = @commentID`,
      [{ name: "commentID", type: sql.Int, value: id }]
    );

    if (comment.length === 0)
      return res.status(404).json({
        error: "Commentaire non trouvé.",
      });

    // Delete comment and its likes
    await executeQuery(
      `DELETE FROM CommentLiked WHERE CommentID = @commentID;
       DELETE FROM Comment WHERE CommentID = @commentID;`,
      [{ name: "commentID", type: sql.Int, value: id }]
    );

    res.status(200).json({
      message: "Commentaire supprimé avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la suppression du commentaire.",
    });
  }
};

exports.getAdminCommentById = async (req, res) => {
  // Check if user is admin
  if (!req.session.user || req.session.user.roleId !== 2)
    return res.status(403).json({
      error: "Vous n'avez pas les droits d'administration nécessaires.",
    });

  const { id } = req.params;

  if (!id)
    return res.status(400).json({
      error: "ID de commentaire manquant.",
    });

  try {
    const comment = await executeQuery(
      `SELECT C.CommentID, C.Comment AS CommentContent, C.CreationDate, C.UpdatedDate,
              U.Username, U.UserID,
              A.ArtworkName, A.ArtworkID,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 1) AS Likes,
              (SELECT COUNT(*) FROM CommentLiked WHERE CommentID = C.CommentID AND CommentLiked = 0) AS Dislikes
       FROM Comment C
       JOIN Users U ON C.UserID = U.UserID
       JOIN Artwork A ON C.ArtworkID = A.ArtworkID
       WHERE C.CommentID = @commentID`,
      [{ name: "commentID", type: sql.Int, value: id }]
    );

    if (comment.length === 0)
      return res.status(404).json({
        error: "Commentaire non trouvé.",
      });

    res.status(200).json(comment[0]);
  } catch (error) {
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération du commentaire.",
    });
  }
};
