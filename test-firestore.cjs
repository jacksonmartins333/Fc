const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "gen-lang-client-0784956522",
  appId: "1:702957150463:web:79527121ac459e565b6cca",
  apiKey: "AIzaSyD-3FS-ry2OQPvCtiY4VU4fSWINyUjVM0g",
};

const app = initializeApp(firebaseConfig);
try {
  const db = getFirestore(app, undefined);
  console.log("Success!");
} catch (e) {
  console.error("Error:", e.message);
}
