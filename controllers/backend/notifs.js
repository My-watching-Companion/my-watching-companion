const { name } = require("ejs")
const { executeQuery, sql } = require("../../db")

exports.getAllNotifs = async (req, res) => {
    userid = req.session.user.id
    try{
        const verifyQuery = await executeQuery(`SELECT UserID FROM Ref_NotifUser WHERE UserID = @UserID`,
            [
              { name: "UserID", type: sql.Int, value: userid },
            ])
        console.log(verifyQuery)

        if(verifyQuery.length != 0){
            if(verifyQuery[0].UserID != req.session.user.id){
                return res.json({
                    status: "KO",
                    message: `You are not allowed to gets those notifications`,
                })
            }else{
                const query = await executeQuery(`SELECT * FROM Ref_NotifUser WHERE UserID = @UserID`,
                    [
                      { name: "UserID", type: sql.Int, value: userid },
                    ])
        
                
              res.json({
                  notifications: query.map((element) => ({
                      NotificationID: `${element.NotificationID}`,
                      UserID: `${element.UserID}`,
                      NotificationType: `${element.NotificationType}`,
                      NotificationContent: `${element.NotificationContent}`,
                      NotificationDate: `${element.NotificationDate}`,
                      NotificationRead: `${element.NotificationRead}`,
                  }))
              })
            }
        }else{
            res.json({
                status: "OK",
                message: `You don't have any notifications`,
                notif: 0
            })
        }
        
        
    }
    catch(e){
        res.json({
            status: "KO",
            message: `Internal Server Error ${e}`,
        });
    }
}

exports.deleteNotif = async (req, res) => {
    notifid = req.params["notifid"]
    try{
        const verifyQuery = await executeQuery(`SELECT UserID FROM Notifications WHERE NotificationID = @NotificationID`,
            [
              { name: "NotificationID", type: sql.Int, value: notifid },
            ])
        if(verifyQuery[0].UserID != req.session.user.id){
            return res.json({
                status: "KO",
                message: `You are not allowed to delete this notification`,
            })
        }
        query = await executeQuery(`DELETE FROM Ref_NotifUser WHERE NotifID = @NotificationID`,
            [
              { name: "NotificationID", type: sql.Int, value: notifid },
            ])
        res.json({
            status: "OK",
            message: "Notification deleted"
        })
    }
    catch(e){
        res.json({
            status: "KO",
            message: `Internal Server Error ${e}`,
        });
    }
}

exports.addNotifs = async (req, res) => {
    try{
        const Params = req.body["Params"]
        const Values = req.body["Values"]
        const NotifID = req.body["NotifID"]

        for(param in Params){
            
        }
        const ReplaceID = await executeQuery(`INSERT INTO Replace OUTPUT inserted.ReplaceID VALUES (@Param1,@Val1),(@Param2,@Val2)`,[
            { name: "Param1", type: sql.VarChar, value: Param1 },
            { name: "Val1", type: sql.VarChar, value: Val1 },
            { name: "Param2", type: sql.VarChar, value: Param2 },
            { name: "Val2", type: sql.VarChar, value: Val2 },
        ])
        await executeQuery(`INSERT INTO Ref_NotifUser VALUES (@UserID, @NotifID, @ReplaceID, 0, GETDATE())`,[
            { name: "ReplaceID", type: sql.Int, value: ReplaceID[0].ReplaceID },
            { name: "UserID", type: sql.Int, value: req.session.user.id },
            { name: "NotifID", type: sql.Int, value: NotifID },
        ])

        res.json({
            status: "OK",
            message: "Notification added"
        })
    }
    catch(e){
        res.json({
            status: "KO",
            message: `Internal Server Error ${e}`,
        });
    }
}
