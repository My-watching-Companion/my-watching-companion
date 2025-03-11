const { executeQuery, sql } = require("../../db");

exports.getComments = async (req, res) => {
  try {
    const comments = await executeQuery(
      `SELECT U.UserID AS user_id, 
              U.Username AS username, 
              U.UserProfilePicture AS user_avatar_url, 
              C.CommentID AS id, 
              C.Comment AS comment
       FROM Comment C
       LEFT JOIN Users U ON U.UserID = C.UserID`
    );

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCommentsByArtworkID = async (req, res) => {
  const { id: artworkID } = req.params;

  if (!artworkID)
    return res.status(400).json({
      error: "An artwork id is required to get comments by artwork.",
    });

  try {
    const comments = await executeQuery(
      `SELECT U.UserID AS user_id, 
              U.Username AS username, 
              U.UserProfilePicture AS user_avatar_url, 
              C.CommentID AS id,
              C.Comment AS comment
       FROM Comment C
       LEFT JOIN Users U ON U.UserID = C.UserID
       WHERE C.ArtworkID = @artworkID`,
      [{ name: "artworkID", type: sql.Int, value: artworkID }]
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
              C.CommentID AS id,
              C.Comment AS comment
       FROM Comment C
       LEFT JOIN Users U ON U.UserID = C.UserID 
       WHERE C.UserID = @userID`,
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
    const result = await executeQuery(
      `INSERT INTO Comment (ArtworkID, UserID, Comment) VALUES (@artworkID, @userID, @comment)`,
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
    const comment = await executeQuery(
      `SELECT UserID FROM Comment WHERE CommentID = @commentID`,
      [{ name: "commentID", type: sql.Int, value: commentID }]
    );

    if (comment.recordset[0].UserID !== user.id)
      return res.status(403).json({
        error: "You are not authorized to delete this comment.",
      });

    await executeQuery(
      `UPDATE Comment SET Comment = @comment WHERE ID = @commentID AND UserID = @userID`,
      [
        { name: "comment", type: sql.NVarChar, value: comment },
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
      `DELETE FROM Comment WHERE CommentID = @commentID AND UserID = @userID`,
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
