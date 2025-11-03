import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

async function testFirestore() {
  try {
    // Save a test document
    const docRef = await addDoc(collection(db, "testCollection"), {
      message: "Hello Firebase!",
      timestamp: new Date(),
    });

    console.log("Document written with ID:", docRef.id);

    // Fetch all documents to confirm
    const snapshot = await getDocs(collection(db, "testCollection"));
    snapshot.forEach((doc) => {
      console.log("📄", doc.id, "=>", doc.data());
    });
  } catch (err) {
    console.error("Firestore test failed:", err);
  }
}

testFirestore();
