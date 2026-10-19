const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  projectId: "gen-lang-client-0784956522",
  appId: "1:702957150463:web:79527121ac459e565b6cca",
  apiKey: "AIzaSyD-3FS-ry2OQPvCtiY4VU4fSWINyUjVM0g",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testWrite() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, "JacksonMartins184@gmail.com", "password123");
    const userId = userCredential.user.uid;
    console.log("Signed in as", userId);

    const playerId = "test-player-123";
    const data = {
      name: "Test Player",
      type: "mensalista",
      rating: 3,
      paymentStatus: "pago",
      isGoalkeeper: false,
      isPresent: false,
      stats: {
        goals: 0,
        assists: 0,
        matchesWon: 0,
        matchesPlayed: 0,
        goalsConceded: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerId: userId
    };

    await setDoc(doc(db, `shared/data/players`, playerId), data, { merge: true });
    console.log("Success writing player!");
  } catch (e) {
    console.error("Error writing:", e.message);
  }
  process.exit(0);
}
testWrite();
