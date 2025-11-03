"use client";

import SectionPage from "../../../src/components/SectionPage";
import AuthGuard from "../../../src/components/AuthGuard";

export default function SectionRoutePage({ params, searchParams }) {
  const draftId = typeof searchParams?.draftId === "string" ? searchParams.draftId : undefined;
  return (
    <AuthGuard>
      <SectionPage sectionId={params.sectionId} draftId={draftId} />
    </AuthGuard>
  );
}


