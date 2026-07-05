/* ================================================= */
/* Firebase Configuration */
/* ================================================= */

const firebaseConfig = {

    apiKey: "",

    authDomain: "",

    projectId: "",

    storageBucket: "",

    messagingSenderId: "",

    appId: "",

    databaseURL: ""

};


/* ================================================= */
/* Initialize Firebase */
/* ================================================= */

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();


/* ================================================= */
/* Collections */
/* ================================================= */

const COLLECTIONS = {

    settings: "settings",

    results: "results",

    notices: "notices",

    liveResults: "liveResults",

    oldResults: "oldResults"

};


/* ================================================= */
/* Global Settings Object */
/* ================================================= */

let siteSettings = {};
/* ================================================= */
/* Firebase Helper Functions */
/* ================================================= */

async function loadSiteSettings() {

    try {

        const doc = await db
            .collection(COLLECTIONS.settings)
            .doc("website")
            .get();

        if (doc.exists) {

            siteSettings = doc.data();

        } else {

            siteSettings = {};

        }

        return siteSettings;

    } catch (error) {

        console.error("Settings Load Error :", error);

        return {};

    }

}


/* ================================================= */
/* Get Collection Data */
/* ================================================= */

async function getCollection(collectionName) {

    try {

        const snapshot = await db
            .collection(collectionName)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    } catch (error) {

        console.error(error);

        return [];

    }

}


/* ================================================= */
/* Save Document */
/* ================================================= */

async function saveDocument(collectionName, documentId, data) {

    return db
        .collection(collectionName)
        .doc(documentId)
        .set(data, { merge: true });

}


/* ================================================= */
/* Delete Document */
/* ================================================= */

async function deleteDocument(collectionName, documentId) {

    return db
        .collection(collectionName)
        .doc(documentId)
        .delete();

}


/* ================================================= */
/* Listen Live Updates */
/* ================================================= */

function listenCollection(collectionName, callback) {

    return db
        .collection(collectionName)
        .onSnapshot(callback);

}

