const router = require("express").Router();
const { isAuthenticated, GetUser } = require("./api");

// Définition de la route principale
router.get("/", (req, res) => {
  res.render("home", { selected: "Accueil" });
});

router.get("/signin", (req, res) => {
  res.render("signin", { selected: "Connexion" });
});

router.get("/signup", (req, res) => {
  res.render("signup", { selected: "Inscription" });
});

router.get("/settings", (req,res)=>{
  res.render("settings", { selected: "Paramètres" })
})

router.get("/settings/:cat/:sett", (req,res)=>{
  const categories = req.param("cat")
  const page = req.param("s")
  if (categories === "profile"){
    if (page === "modifyprofile"){

    }
    else if (page === "notifications"){

    }
  }

  else if(categories === "confidentiality"){
    if (page === "account"){

    }
    else if (page === "friends"){

    }
    else if (page === "lockperson"){

    }
  }

  else if(categories === "watchlists"){
    if (page === "confidentiality"){

    }
    else if (page === "preferences"){

    }
    else if (page === "autorisations"){

    }
  }
  
  else{
    res.redirect("/settings/404")
  }
})

// Définition de la route erreur 404
router.get("*", (req, res) => {
  res.status(404);

  res.render("error");
});

module.exports = router;
