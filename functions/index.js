const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

//Firebase Admin SDK to access Realtime Database
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var db = admin.database();
var ref = db.ref("requests");

exports.updateStatus = functions.https.onRequest((req, resp) =>{
    let now = Date.now()
    let query = ref.
})