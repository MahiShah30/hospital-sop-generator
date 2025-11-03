import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; 
import { uploadFileSecurely } from "./clientUploader"; 

export async function saveSectionAnswers(userId, draftId, sectionId, answers = {}, progress = 1) {
  if (!userId || !draftId || !sectionId) {
    throw new Error("saveSectionAnswers: missing userId, draftId or sectionId");
  }

  const sectionRef = doc(db, "users", userId, "sopDrafts", draftId, "sections", sectionId);
  const masterRef = doc(db, "users", userId, "sopDrafts", draftId);

  const toSave = JSON.parse(JSON.stringify(answers));
  const originalAnswers = answers;


  async function uploadFile(file) {
    // It calls the function that sends the file to your API route
    const result = await uploadFileSecurely(draftId, sectionId, file);
    return {
      name: file.name,
      size: file.size,
      contentType: file.type,
      storagePath: result.path, 
      bucket: 'sop-files',
    };
  }

  // This helper finds where the file objects are in your form data
  async function scanAndUpload(obj, path = []) {
    if (!obj) return;

    if (typeof File !== "undefined" && obj instanceof File) {
      const metadata = await uploadFile(obj);
      assignToPath(toSave, path, metadata);
      return;
    }

    if (Array.isArray(obj)) {
      const areFiles = obj.length && (typeof File !== "undefined" && obj[0] instanceof File);
      if (areFiles) {
        const uploaded = await Promise.all(obj.map(file => uploadFile(file)));
        assignToPath(toSave, path, uploaded);
        return;
      }
      for (let i = 0; i < obj.length; i++) {
        await scanAndUpload(obj[i], path.concat(i));
      }
      return;
    }

    if (typeof obj === "object") {
      for (const k of Object.keys(obj)) {
        await scanAndUpload(obj[k], path.concat(k));
      }
      return;
    }
  }

  // This helper puts the upload metadata back into the object to be saved
  function assignToPath(target, path, value) {
    let cur = target;
    for (let i = 0; i < path.length - 1; i++) {
      cur = cur[path[i]];
    }
    cur[path[path.length - 1]] = value;
  }

  // Start the process
  await scanAndUpload(originalAnswers);

  // Save the final data (with upload metadata) to Firestore
  await setDoc(
    sectionRef,
    {
      answers: toSave,
      progress,
      completed: progress >= 0.99,
      lastSavedAt: serverTimestamp()
    },
    { merge: true }
  );

  // Update master doc
  await updateDoc(masterRef, {
    [`sections.${sectionId}`]: progress >= 0.99,
    updatedAt: serverTimestamp()
  });

  return { ok: true };
}