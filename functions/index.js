const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  tokenref = db.ref('temp/Tokens');
  return tokenref.once("value").then(function(snapshot){
    snapshot.forEach(function(child){
      // if(child.val().token!=="ePX-M1UyRhichrPXNATHNi:APA91bHUdy5BKfA4meAdpFPj5Yp1o-ghOwJCF7wLrAu_lTVkEMh1tOIfHWItRfxtHKD0MV9kFui0olnWDcx-hmOSQTTdbIooCCXQctkBPdbZobnKCxiLCH-fu9VAf3dPqmGc6D4161mV")
      // tokens.push(child.val().token);
      var uid = child.key;
      console.log(uid)
      const payload = {
        "data":{
          "title" : "Reminder",
          "body" : "Complete the accepted request now!",
          "sented": uid
        }
      };
      admin.messaging().sendToDevice(child.val().token, payload).then(function(temp){
             return console.log(temp);
           }).catch(function(err){
            return console.log(err);
          });
    });
    return response.status(200).send("success");
  });
    // console.log(tokens)
    //  admin.messaging().sendToDevice(result.val(), payload).then(function(temp){
//      return response.send(temp);
//    }).catch(function(err){
//      return response.send(err);
//    });
//    return null;
//  })
 });

  //   functions.logger.info("Hello logs!", {structuredData: true});
  // initialise(d);
//  users.child("temp").set("Working fine..");
// users.child()
// processref.once('value').then(function(snapshot){
//   snapshot.forEach(function(child){
//     console.log("uid", child.val().favourerUID)
//   })
// })


// return db.ref(`${root}/Tokens/${uid}/token`).once('value').then(function(result){
//    console.log(result.val());
//    admin.messaging().sendToDevice(result.val(), payload).then(function(temp){
//      return response.send(temp);
//    }).catch(function(err){
//      return response.send(err);
//    });
//    return null;
//  })
// });

//Firebase Admin SDK to access Realtime Database
const admin = require('firebase-admin');
// admin.initializeApp();
admin.initializeApp(functions.config().firebase);
var db = admin.database();
var reqref;
var processref;
var tokenref;
var users;
var d = "testing";
var d1 = 'd1';
var d2 = 'd2';
var root;


//initialize global variables for different database
function initialise(url){
  root = url;
  reqref = db.ref(`${root}/requests`);
  processref = db.ref(`${root}/Current_Processing_Request`);
  // tokenref = db.ref(`${root}/Tokens`);
  users = db.ref(`${root}/Users`);
  }

//handling the case where the request has expired, and the notification still needs to be sent
function setExpired(child){
      child.ref.update({
        expired: true
      });
      return processref.once("value").then(function(snapshot){
        snapshot.forEach(function(processDTO){
          if(processDTO.val().requestID === child.val().requestID){
              processDTO.ref.set(null);
          }
        });
        return null;
    });
}

function requestTimerUpdate(){
  var timeNow = Date.now()

  return reqref.once("value").then(function(snapshot){
    snapshot.forEach(function(child){
      if(child.val().isCompleted === false && child.val().expired === false){
        var diff = timeNow - child.val().doc;
        var left = diff/1000;
        left /= 3600;
        left = Math.floor(left);
        left = -left;
        if(child.val().urgent) left += 24
        else left += 168
        if(left <= 0) {
         setExpired(child)
        }
        else if(left!==child.val().timer){
          child.ref.update({
            timer: left
          });
        }
      }
    });
    return null;
  });
}

//updates time left for each request
exports.updateTime = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
  initialise(d);
  requestTimerUpdate();
});
exports.updateTime1 = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
  initialise(d1);
  requestTimerUpdate();
});
exports.updateTime2 = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
  initialise(d2);
  requestTimerUpdate();
});

function notificationDB(){

  var timeNow = Date.now()

      return processref.once("value").then(function(snapshot){
        snapshot.forEach(function(child){
          if(child.val().completed === false && child.val().expired === false && child.val().reminder === true && timeNow >= child.val().notificationTime){

              child.ref.update({
                reminder: false,
                remindingIn: 0,
                notificationTime: ""
              });
              var favourerUID = child.val().favourerUID;
                const payload = {
                  "data":{
                    "title" : "Reminder",
                    "body" : "Complete the accepted request now!",
                    "sented": favourerUID
                  }
                };
                // console.log(favourerUID);
                // console.log(root);
                return db.ref(`${root}/Tokens/${favourerUID}/token`).once('value').then(function(result){
                  // console.log(result.val());
                  admin.messaging().sendToDevice(result.val(), payload).then(function(temp){
                    return console.log("Reminder Notification Send!");
                  }).catch(function(err){
                    return console.log("Error sending notification", err);
                  });
                  return null;
                });
          }
        });
        return null;
      });
}

//checks if there is a reminder notification that needs to be sent
exports.checkNotification = functions.pubsub.schedule('every 10 minutes').onRun((context) => {
  initialise(d);
  notificationDB();
});
exports.checkNotification1 = functions.pubsub.schedule('every 10 minutes').onRun((context) => {
  initialise(d1);
  notificationDB();
});
exports.checkNotification2 = functions.pubsub.schedule('every 10 minutes').onRun((context) => {
  initialise(d2);
  notificationDB();  
});

//update user password Default: (Last 4 digit Mobile Number)+(current date + current hour)
exports.updatePassword = functions.https.onRequest((request, response) => {
    var uid = request.query.uid;
    var mobile = request.query.mobile;
    var d = new Date();
    var hr = d.getHours() + 12;
    var dd = String(d.getDate()).padStart(2, '0');
    var passw = mobile.substring(mobile.length-4) + dd + hr;
    admin.auth().updateUser(uid, {
          password : passw
        }).then(()=>{
          console.log("Update Successfull! Password", passw);
          return response.status(200).send("Update Successfull! Password  " + passw);
        }).catch((err)=>{
          return response.status(400).send("Error updating password!  " + err);
        });
        return null;
  });

exports.sendtoAll = functions.database.ref('/d1/requests/{requestID}').onCreate((change, context)=>{
  var newreq = change.val();
  // console.log(newreq);
  var notuid = newreq.userUid;
  var mbody = newreq.person_name + " has raised a favour request, help out now!"; 
  console.log(mbody);
  tokenref = db.ref('d1/Tokens');
  return tokenref.once("value").then(function(snapshot){
    snapshot.forEach(function(child){
      // if(child.val().token!=="ePX-M1UyRhichrPXNATHNi:APA91bHUdy5BKfA4meAdpFPj5Yp1o-ghOwJCF7wLrAu_lTVkEMh1tOIfHWItRfxtHKD0MV9kFui0olnWDcx-hmOSQTTdbIooCCXQctkBPdbZobnKCxiLCH-fu9VAf3dPqmGc6D4161mV")
      // tokens.push(child.val().token);
      var uid = child.key;
      if(uid === notuid) return;
      // console.log(uid)
      const payload = {
        "data":{
          "title" : "New Favour Request",
          "body" : mbody,
          "sented": uid
        }
      };
      admin.messaging().sendToDevice(child.val().token, payload).then(function(temp){
             return console.log("Success to", uid);
           }).catch(function(err){
            return console.log(err);
          });
    });
    return null;
  });
});
