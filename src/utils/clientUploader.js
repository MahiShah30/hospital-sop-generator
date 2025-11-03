import { authedFetch } from "./authedFetch"; 

/**
 * Securely uploads a file by sending it to our own Next.js API route.
 * This function DOES NOT talk to Supabase directly.
 *
 * @param {string} draftId
 * @param {string} sectionId
 * @param {File} file
 */
export async function uploadFileSecurely(draftId, sectionId, file) {
  // 1. Create a FormData payload to send the file and its metadata.
  const formData = new FormData();
  formData.append('file', file);
  formData.append('draftId', draftId);
  formData.append('sectionId', sectionId);

  // 2. Use your authenticated fetch wrapper to send the data to your API.
  const response = await authedFetch('/api/storage/upload', { // This must match your API route's URL
    method: 'POST',
    body: formData,
    // Do not set 'Content-Type' header here, the browser does it automatically for FormData
  });

  // 3. Handle the response from your API.
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || 'File upload failed');
  }

  // 4. Return the successful response from your API.
  return response.json(); // This will contain { success: true, path: '...' }
}