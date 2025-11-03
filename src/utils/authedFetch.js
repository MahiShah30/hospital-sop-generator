// In src/utils/authedFetch.js

import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function getCurrentUser() {
  return new Promise((resolve, reject) => {
  
    if (auth.currentUser) {
      return resolve(auth.currentUser);
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe(); 
        if (user) {
          resolve(user);
        } else {
          reject(new Error("Not authenticated: User is not signed in."));
        }
      },
      (error) => {
      
        unsubscribe();
        reject(error);
      }
    );
  });
}

export async function authedFetch(input, init = {}) {
  try {
  
    const currentUser = await getCurrentUser();
    const idToken = await currentUser.getIdToken();

    console.log("Client sending token (first 30 chars):", idToken.substring(0, 30));
    
    const headers = new Headers(init.headers || {});
    headers.set("authorization", `Bearer ${idToken}`);
    
    return fetch(input, { ...init, headers });

  } catch (error) {
  
    console.error("Authentication error in authedFetch:", error.message);
    throw error;
  }
}