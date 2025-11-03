import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import "./firebaseTest";
import HomePage from './Homepage';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import MasterQuestionnaire from './MasterQuestionnaire';
import SectionPage from "./components/SectionPage";
import HospitalInfoForm from "./components/HospitalInfoForm";
import DocumentMetadataForm from "./components/DocumentMetadataForm";
import ControlDistributionForm from "./components/ControlDistributionForm";
import PurposeScopeForm from "./components/PurposeScopeForm";
import ResponsibilitiesContactsForm from "./components/ResponsibilitiesContactsForm";
import PoliciesProceduresForm from "./components/PoliciesProceduresForm";
import QualityKPIsForm from "./components/QualityKPIsForm";
import TrainingComplianceForm from "./components/TrainingComplianceForm";
import ReferencesVersionControlForm from "./components/ReferencesVersionControlForm";
import LayoutBrandingForm from "./components/LayoutBrandingForm";
import SummaryClosureForm from "./components/SummaryClosureForm";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
         <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/master-questionnaire" element={<MasterQuestionnaire />} />
          <Route path="/questionnaire/:sectionId" element={<SectionPage />} />
          <Route path="/questionnaire/hospital_info" element={<HospitalInfoForm />} />
          <Route path="/questionnaire/document_metadata" element={<DocumentMetadataForm />} />
          <Route path="/questionnaire/control_distribution" element={<ControlDistributionForm />} />
          <Route path="/questionnaire/purpose_scope" element={<PurposeScopeForm />} />
          <Route path="/questionnaire/responsibilities_contacts" element={<ResponsibilitiesContactsForm />} />
          <Route path="/questionnaire/policies_procedures" element={<PoliciesProceduresForm />} />
          <Route path="/questionnaire/quality_kpis" element={<QualityKPIsForm />} />
          <Route path="/questionnaire/training_compliance" element={<TrainingComplianceForm />} />
          <Route path="/questionnaire/references_version_control" element={<ReferencesVersionControlForm />} />
          <Route path="/questionnaire/layout_branding" element={<LayoutBrandingForm />} />
          <Route path="/questionnaire/summary_closure" element={<SummaryClosureForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
