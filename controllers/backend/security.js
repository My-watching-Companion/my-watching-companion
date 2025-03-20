const { executeQuery } = require("../../db");
const { TraceError } = require("../functions");
const CryptoJS = require("crypto-js");
const { CRYPTO_KEY } = require("../../config");

exports.getAllSecurityQuestions = async (req, res) => {
  try {
    const query = await executeQuery(`SELECT * FROM SecurityQuestion`);

    const questions = query.map((question) => ({
      SecurityQuestionID: question.SecurityQuestionID,
      SecurityQuestion: question.Question,
    }));

    return res.json({ questions });
  } catch (e) {
    TraceError(req, res, `An error occured ${e}`);
    return res.json({ error: `Internal server error : ${e}` });
  }
};

exports.getSecurityQuestionByUserEmail = async (req, res) => {
  if (!req.body.email)
    return res.json({ error: "Veuillez entrer une adresse email valide." });

  const email = req.body.email;

  try {
    const query = await executeQuery(
      `SELECT U.SecurityQuestionID, SQ.Question AS SecurityQuestion FROM Users U INNER JOIN SecurityQuestion SQ ON U.SecurityQuestionID = SQ.SecurityQuestionID WHERE U.EmailAddress = '${email}'`
    );

    if (query.length === 0)
      return res.json({
        error: "Aucun compte n'est associé à cette adresse email.",
      });

    return res.json({ securityQuestion: query[0].SecurityQuestion });
  } catch (e) {
    return res.json({
      error:
        "Une erreur est survenue lors de la vérification de votre adresse email.",
    });
  }
};

exports.checkSecurityAnswer = async (req, res) => {
  if (!req.body.email || !req.body.response)
    return res.json({ error: "Veuillez remplir tous les champs." });

  const email = req.body.email;
  const response = req.body.response;

  try {
    const query = await executeQuery(
      `SELECT SecurityQuestionAnswer FROM Users WHERE EmailAddress = '${email}'`
    );

    if (query.length === 0)
      return res.json({
        error: "Aucun compte n'est associé à cette adresse email.",
      });

    if (query[0].SecurityQuestionAnswer !== response)
      return res.json({ error: "La réponse est incorrecte." });

    return res.json({ success: true });
  } catch (e) {
    return res.json({
      error: "Une erreur est survenue lors de la vérification de la réponse.",
    });
  }
};

exports.changePassword = async (req, res) => {
  if (!req.body.email || !req.body.response || !req.body.password)
    return res.json({ error: "Veuillez remplir tous les champs." });

  const { email, response, password } = req.body;

  try {
    console.log("1");
    await executeQuery(
      `UPDATE Users SET Password = '${CryptoJS.AES.encrypt(
        password,
        CRYPTO_KEY
      )}' WHERE EmailAddress = '${email}' AND SecurityQuestionAnswer = '${response}'`
    );

    return res.json({ success: true });
  } catch (error) {
    return res.json({
      error:
        "Une erreur est survenue lors de la modification de votre mot de passe.",
    });
  }
};
