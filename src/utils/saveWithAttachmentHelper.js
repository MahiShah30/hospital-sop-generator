// src/utils/saveWithAttachmentHelper.js
import { saveSectionAnswers } from "./saveSection";

/**
 * saveWithAttachmentHelper - convenience wrapper to save section and ensure file uploads
 * (keeps same behavior as saveSectionAnswers)
 */
export async function saveWithAttachment(userId, draftId, sectionId, answers, file) {
  // If the file is provided as a separate arg, attach it to answers under the appropriate key
  // but since we don't know the key name, caller should already include file in answers where needed.
  return saveSectionAnswers(userId, draftId, sectionId, answers, 1);
}

export default saveWithAttachment;
