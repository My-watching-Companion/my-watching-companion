const router = require("express").Router();
const { executeQuery } = require("../db");
const CryptoJS = require("crypto-js");
const session = require("express-session");
const { CRYPTO_KEY } = require("../config");
var hour = 1000 * 60 * 20;

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/signin");
  }
}

async function CheckAge(username, age) {
  const query = await executeQuery(`SELECT UsersBirthDate, GETDATE() AS Today from UsersGeneralInfos WHERE Username = '${username}'`)
  const Today = formatDate(query[0].Today)
  const UserBirthDate = formatDate(query[0].UsersBirthDate)
  
  return (Today - UserBirthDate) > (Today - (formatDate(`${Today.getFullYear()-age}-${Today.getMonth()}-${Today.getDay()}`))) ? true : false
}

async function GetUser(req, res, next) {
  if (req.session.user) {
    const user = await executeQuery(
      `SELECT UGI.LastName, UGI.FirstName, UGI.Username, UGI.EmailAddress, UGI.UserProfilePicture from UsersLogin UL 
      INNER JOIN Ref_UsersLogin RUL ON RUL.LoginID = UL.LoginID
      INNER JOIN UsersGeneralInfos UGI ON RUL.UserID = UGI.UserID 
      where UL.Login = 'Twisste' '${req.session.user}'`
    );
    return next({ user });
  } else {
    return next({ user: undefined });
  }
}

async function TraceLogs(req, res, message){
  await executeQuery(`INSERT INTO TraceLogs VALUES (GETDATE(), 1, '${message}', 0)`) /// A MODIF LE USERID
}

async function TraceError(req, res, message) {
  await executeQuery(`INSERT INTO TraceLogs VALUES (GETDATE(), 1, '${message}', 1)`) /// A MODIF LE USERID
}

function formatDate(dateString) {
  const date = new Date(dateString);

  // Récupération du jour, mois, et année
  const day = String(date.getDate()).padStart(2, "0"); // JJ
  const month = String(date.getMonth() + 1).padStart(2, "0"); // MM (mois commence à 0, donc +1)
  const year = date.getFullYear(); // AAAA

  // Format JJ-MM-AAAA
  return (new Date(year, month, day));
}

//! Route API pour Insérer / modifier en base

router.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API de MyWatchingCompanion" });
});

router.post("/login/ok", async (req, res) => {
  const Username = req.body.username;
  const Password = req.body.password;
  try {
    const DBPass = await executeQuery(
      `SELECT password from UsersLogin where Login = '${Username}'`
    );
    if (
      Password ===
      CryptoJS.AES.decrypt(DBPass[0].password, CRYPTO_KEY).toString(
        CryptoJS.enc.Utf8
      )
    ) {
      req.session.user = Username;
      req.session.cookie.expires = new Date(Date.now() + hour);
      req.session.cookie.maxAge = hour;

      TraceLogs(req,res,`User ${Username} successfully login`)

      res.redirect("/");
    } else {
      TraceError(req,res, `Users use wrong password`)

      res.json({ 
        status: "ERROR",
        message: "Mot de passe incorrect" });
    }
  } catch (e) {
    TraceError(req,res, `Internal Server Error ${e}`)

    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`
    })
  }
});

router.post("/register/ok", async (req, res) => {
  const LastName = req.body.lastname;
  const FirstName = req.body.firstname;
  const BirthDate = req.body.birthdate;
  const Mail = req.body.email;
  const Username = req.body.username;
  const Password = req.body.password;
  try {
    const VerifMail = await executeQuery(`SELECT EmailAddress from UsersGeneralInfos where FirstName = '${FirstName}' and LastName = '${LastName}'`)
    const VerifLogin = await executeQuery(`SELECT Login FROM UsersLogin WHERE Login = '${Username}'`)
    if (
      (VerifMail[0] !== undefined)
    ) {
      res.redirect('/signup') ///+ {message: "L'email est déjà utilisé pour un compte"})
    } else if 
    (VerifLogin[0] !== undefined){
      res.redirect('/signup') ///+ {message: 'Pseudonyme déjà utilisé'})
    }
    else {
      await executeQuery(
        `INSERT INTO Users VALUES(0, GETDATE(), GETDATE()) 
         INSERT INTO UsersGeneralInfos  VALUES('${Username}','${FirstName}','${LastName}','${BirthDate}','${Mail}','Default',1,'0',0) 
         INSERT INTO UsersLogin VALUES('${Username}','${CryptoJS.AES.encrypt(`${Password}`,CRYPTO_KEY)}',0)
         INSERT INTO Ref_UsersLogin VALUES((SELECT UserID FROM UsersGeneralInfos where Username = '${Username}'),(SELECT UserID FROM UsersGeneralInfos where Username = '${Username}'))` 
      );
      res.redirect('/signin') ///+ {message: 'Utilisateur créé avec succès'})
    }
  } catch (e) {
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`
    })
  }
});

router.get("/addfriends/:user/:friends", async(req,res)=>{
  const user = req.params["user"]
  const friends = req.params["friends"]
  try{
    await executeQuery(`INSERT INTO Ref_Friends VALUES((SELECT UserID From UsersGeneralInfos where Username = '${user}'), (SELECT UserID From UsersGeneralInfos where Username = '${friends}'))`)
    res.redirect("/settings/confidentiality/friends")
  }
  catch(e){
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`
    })
  }
})

router.get("/removefriends/:user/:friend", async(req,res)=>{
  const user = req.params["user"]
  const friend = req.params["friend"]
  try{
    await executeQuery(`DELETE FROM Ref_Friends
                        WHERE UserID = (SELECT UserID from UsersGeneralInfos where Username = '${user}') AND FriendsUserID = (SELECT UserID from UsersGeneralInfos where Username = '${friend}')`)
    res.redirect("/settings/confidentiality/friends")
  }
  catch(e){
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`
    })
  }
})


router.post("/changePP/:user", async (req, res) => {
  try {
    const user = req.params['user'];
    const base64Image = req.body.ProfilePicture; 

    const image = `data:${user}/png;base64,${base64Image}`
    const query =  executeQuery(`UPDATE UsersGeneralInfos
      SET UserProfilePicture = '${image}'
      where UserID = (SELECT UserID FROM UsersGeneralInfos where Username = '${user}')`)

      res.json({
      status: "OK",
      message: "Profile Picture of user was modified with success"})
  }
  catch(e){
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`
    })
  }
})



//! Route API pour chercher des choses 

router.get("/getuserswithoutfriends/:user", async (req,res)=>{
  try{
    const user = req.params['user']
    const query = await executeQuery(`
      SELECT UGI.UserID, UGI.Username, UGI.FirstName, UGI.LastName, U.CreationDate, U.UpdatedDate, UGI.UsersBirthDate, UGI.UserProfilePicture  from Users U
      INNER JOIN UsersGeneralInfos UGI ON UGI.UserID = U.UserID
      INNER JOIN Ref_UsersLogin RUL ON RUL.UserID = U.UserID
      INNER JOIN UsersLogin UL ON UL.LoginID = RUL.LoginID
	    WHERE U.UserID NOT IN (SELECT FriendsUserID FROM Ref_Friends where UserID = 
							(SELECT UserID from UsersGeneralInfos WHERE Username = '${user}'))
      `)

    res.json({
      Users : query.map((element)=>({
        UserID: `${element.UserID}`,
        Username: `${element.Username}`,
        FirstName: `${element.FirstName}`,
        LastName: `${element.LastName}`,
        CreationDate: `${formatDate(element.CreationDate)}`,
        UpdatedDate: `${formatDate(element.UpdatedDate)}`,
        BirthDate: `${formatDate(element.UsersBirthDate)}`,
        ProfilePicture: element.UserProfilePicture,
      }))
      
    })
  }
  catch(e){
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`
    })
  }
})


router.get("/users/:u", async (req, res) => {
  const SearchUser = req.param("u");
  try {
    const query = await executeQuery(
      `SELECT U.UserID, UGI.FirstName, UGI.LastName, U.CreationDate, U.UpdatedDate, UGI.UsersBirthDate, UL.RoleID, UGI.UserProfilePicture from Users U 
      LEFT JOIN UsersGeneralInfos UGI ON U.UserID = UGI.UserID 
      LEFT JOIN Ref_UsersLogin RUL ON RUL.UserID = U.UserID
      LEFT JOIN UsersLogin UL ON UL.LoginID = RUL.LoginID 
      where Login = '${SearchUser}'`
    );
    if (query.length === 0) {
      res.json({ 
        status: "ERROR",
        message: "User dosn't exists" 
      });
    } else {
      res.json({
        UserID: `${query[0].UserID}`,
        FirstName: `${query[0].FirstName}`,
        LastName: `${query[0].LastName}`,
        CreationDate: `${formatDate(query[0].CreationDate)}`,
        UpdatedDate: `${formatDate(query[0].UpdatedDate)}`,
        BirthDate: `${formatDate(query[0].UsersBirthDate)}`,
        ProfilePicture: query[0].UserProfilePicture,
        Role: `${query[0].RoleID === 1 ? "Admin" : "User"}`,
      });
    }
  } catch (e) {
    res.json({ 
      status: "KO",
      message: `Internal server error : ${e}` });
  }
});

router.get("/users/:u/watchlists", async (req, res) => {
  const SearchUser = req.param("u");
  try {
    const query = await executeQuery(
      `SELECT U.UserID, UL.ListsID, UL.ListsName, UL.UpdatedDate
      from Users U
		    INNER JOIN Ref_UsersLogin RUL ON RUL.UserID = U.UserID 
        INNER JOIN UsersLogin ULog ON RUL.LoginID = ULog.LoginID
        LEFT JOIN Ref_UsersLists RULi ON U.UserID = RULi.UserID 
        LEFT JOIN UsersLists UL ON RULi.ListsID = UL.ListsID
        WHERE ULog.Login = '${SearchUser}'`
    );
    res.json({
      User: { UserID: query[0].UserID, UserURL: `/api/users/${SearchUser}` },
      Watchlist: query.recordsets.map((element) => ({
        ListsID: element.ListsID,
        ListName: element.ListsName,
        Updated: element.UpdatedDate,
        ListURL: `/api/${u}/watchlists/${element.ListName}`,
      })),
    });
  } catch (e) {
    res.json({ 
      status: "KO",
      message: `Internal server error : ${e}` });
  }
});

router.get("/users/:u/watchlists/:w", async (req, res) => {
  const SearchUser = req.param("u");
  const SearchList = req.param("w");
  try {
    const query = await executeQuery(`SELECT U.UserID, UL.ListsID, UL.ListsName, UL.UpdatedDate, A.ArtworkID, A.ArtworkName, RN.NatureLabel, RT.TypeName 
                                      from Users U 
                                      INNER JOIN UserGeneralInfos UGI ON UGI.UserID = U.UserID
                                      LEFT JOIN Ref_UsersLists RUL ON U.UserID = RUL.UserID 
                                      LEFT JOIN UsersLists UL ON RUL.ListsID = UL.ListsID 
                                      LEFT JOIN Ref_UsersListsArtwork RULA ON RULA.ListsID = UL.ListsID
                                      LEFT JOIN Artwork A ON A.ArtworkID = RULA.ArtworkID
                                      LEFT JOIN Ref_ArtworkType RAT ON RAT.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_ArtworkNature RAN ON RAN.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_ArtworkCreator RAC ON RAC.ArtworkID = A.ArtworkID
                                      LEFT JOIN Ref_Creator RC ON RC.CreatorID = RAC.CreatorID
                                      WHERE UGI.Username = '${SearchUser}' AND UL.ListsName = '${SearchList}'`);

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
    res.json({ 
      status: "KO",
      message: `Internal server error : ${e}` });
  }
});

router.get("/artwork/:a/creator", async (req, res) => {
  const SearchArtwork = req.param("a");
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
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`
    })
  }
});

router.get("/modifyconfidentiality/:conf/:user", isAuthenticated, async (req,res)=>{
  const conf = req.params['conf']
  const user = req.params['user']
  let nbconf = 0
    try{
      if(conf === 'public'){
        nbconf = 0
      }
      else if(conf === 'private'){
        nbconf = 1
      }
      else if (conf === 'friends') {
        nbconf = 2
      }
      else{
        res.json({
          status: "ERROR",
          message: `Confidentiality dosn't exist`
        })
      }
      await executeQuery(`UPDATE UsersGeneralInfos
                          SET Confidentiality = '${nbconf}'
                          WHERE Username = '${user}'`)
      res.json({
        status: "OK",
        message: 'Query executed with successed'
      })
    }
    catch(e){
      res.json({
        status: "KO",
        message: `Internal Server Error ${e}`
      })
    }
  
  
})

router.get('/friends/:user', async (req,res)=>{
  const user = req.params['user']
  try{
    const friendslist = await executeQuery(`SELECT RF.FriendsUserID, UGI.Username, UGI.FirstName, UGI.LastName, UGI.UserProfilePicture, UGI.Confidentiality from Ref_Friends RF
                                            INNER JOIN Users U ON RF.FriendsUserID = U.UserID
                                            INNER JOIN UsersGeneralInfos UGI ON UGI.UserID = U.UserID
                                            WHERE RF.UserID = (SELECT UserID from UsersGeneralInfos where Username = '${user}')`)
      res.json({
      Friends : friendslist.map((element) => ({
        UserID: element.FriendsUserID,
        Username: element.Username,
        FirstName: element.FirstName,
        LastName: element.LastName,
        UserProfilePicture: element.UserProfilePicture,
        Confidentiality: element.Confidentiality
      }))
    })
  }
  catch(e){
    res.json({
      status: "KO",
      message: `Internal Server Error ${e}`
    })
  }
})



module.exports = { router, isAuthenticated, GetUser, CheckAge };