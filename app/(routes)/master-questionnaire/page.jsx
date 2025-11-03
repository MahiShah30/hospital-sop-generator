"use client";

import MasterQuestionnaire from "../../../src/MasterQuestionnaire";
import AuthGuard from "../../../src/components/AuthGuard";

export default function MasterQuestionnairePage() {
  return (
    <AuthGuard>
      <MasterQuestionnaire />
    </AuthGuard>
  );
}


