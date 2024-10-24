const router = require("express").Router();
const {executeQuery} = require("../db")
const CrypotJS = require("crypto-js")
const {CRYPTO_KEY} = require("../config")

// TODO: Implémenter les différentes routes d'API

router.post("/connexion/ok",async (req,res)=>{
    const user = req.body.username
    const pass = req.body.password
    try{
        const DBPass = await executeQuery(`SELECT password from Users where username = ${user}`)
        if(pass === CrypotJS.AES.decrypt(DBPass.recordsets[0].password,CRYPTO_KEY)){
            res.render("profil")
        }
        else{
            res.send("Mot de passe incorrect")
        }
    }
    catch(e){
        res.send("Internal Server Error")
    }
})

router.post("/regiter/ok", async(req,res)=>{
    
})