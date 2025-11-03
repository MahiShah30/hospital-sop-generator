// src/schemas/sections.js
// Schema used by the FormRenderer / per-section forms.
// Keys are dash-separated to match your Dashboard routes (e.g., /questionnaire/hospital-info).
export const SECTION_SCHEMAS = {
  "hospital-info": {
    title: "Hospital Info",
    description: "Name, address, logo and contact details",
    fields: [
      { name: "hospitalName", label: "Hospital name", type: "text", placeholder: "Full legal name of hospital", required: true, maxLength: 200, helpText: "Will appear on cover page and headers", required: true},
      { name: "hospitalLogo", label: "Hospital logo upload", type: "file", placeholder: "Upload PNG / SVG (transparent preferred)", required: false, accept: "image/*", helpText: "Top-left on each SOP page. Provide vector if available", required: true },
      { name: "addressFull", label: "Hospital full address", type: "textarea", placeholder: "Street, Area, City, State, Postal code", required: true, maxLength: 500, helpText: "Used on cover and footer", required: true },
      { name: "primaryPhone", label: "Primary phone number", type: "phone", placeholder: "+91 9XXXXXXXXX", required: true, helpText: "Main contact for public queries", required: true},
      { name: "primaryEmail", label: "Primary email", type: "email", placeholder: "info@hospital.com", required: false, helpText: "Displayed on cover and contact block", required: true },
      { name: "website", label: "Website", type: "text", placeholder: "https://examplehospital.com", required: false, helpText: "Displayed on contact block" },
      { name: "hospitalLogoAltText", label: "Logo alt text (for accessibility & SEO)", type: "text", placeholder: "e.g., SuperCare Hospital logo — Hospital Operations & Management", required: false, helpText: "Include keywords: Hospital Software, Operations, Management, Quality, Training" }
    ]
  },

  "document-metadata": {
    title: "Document Metadata",
    description: "SOP title, reference number, dates, authors and approvers",
    fields: [
      { name: "sopTitle", label: "Title of the SOP", type: "text", placeholder: "e.g., Patient Admission and Transfer Policy", required: true, maxLength: 200 },
      { name: "documentNumber", label: "Document number", type: "text", placeholder: "e.g., A1/NABH/AAC/01-2025", required: true, helpText: "Use hospital numbering convention" },
      { name: "creationDate", label: "Date of creation", type: "date", required: true },
      { name: "implementationDate", label: "Date of implementation", type: "date", required: true },
      { name: "preparedBy", label: "Prepared by (name and designation)", type: "text", placeholder: "e.g., A. Kumar, Quality Coordinator", required: true, helpText: "Name to appear in Prepared by block" },
      { name: "approvedBy", label: "Approved by (name and designation)", type: "text", placeholder: "e.g., Dr. R. Singh, Medical Director", required: true },
      { name: "documentVersion", label: "Initial version number", type: "text", placeholder: "e.g., v1.0", required: true },
      { name: "approxPages", label: "Approximate number of pages", type: "number", placeholder: "e.g., 8", required: false, min: 1, helpText: "Optional - used for printing estimates" }
    ]
  },

  "control-distribution": {
    title: "Control & Distribution",
    description: "Who controls the manual and where copies are stored",
    fields: [
      { name: "documentOwner", label: "Document controller (name & designation)", type: "text", placeholder: "e.g., Quality Head / Management Representative", required: true },
      {
        name: "distributionList",
        label: "Distribution list (who receives copies)",
        type: "repeater",
        itemSchema: {
          recipientName: { type: "text", placeholder: "Name or department", required: true },
          recipientDesignation: { type: "text", placeholder: "Designation / role", required: false },
          copyType: { type: "select", options: ["Hard copy", "Soft copy (PDF)", "Server copy"], required: true }
        },
        required: false,
        helpText: "E.g., Chairman, CEO, Quality Head, HODs, Nurse In-Charge"
      },
      { name: "acknowledgementNeeded", label: "Require acknowledgement on receipt", type: "select", options: ["Yes", "No"], required: true, default: "Yes" },
      { name: "storageLocations", label: "Soft & hard copy storage locations", type: "textarea", placeholder: "e.g., Quality Office folder, /server/sops/, Department files", required: true }
    ]
  },

  "purpose-scope": {
    title: "Purpose & Scope",
    description: "Purpose, scope and objectives of the SOP",
    fields: [
      { name: "purposeStatement", label: "Purpose statement", type: "textarea", placeholder: "Why this SOP exists (2-4 sentences)", required: true, maxLength: 800 },
      { name: "scopeDescription", label: "Scope", type: "textarea", placeholder: "Which departments, staff categories or patient groups are covered", required: true, maxLength: 800 },
      { name: "applicabilityExceptions", label: "Applicability exceptions (if any)", type: "textarea", placeholder: "Any exclusions or special-case notes", required: false },
      {
        name: "objectivesList",
        label: "Objectives (list measurable outcomes)",
        type: "repeater",
        itemSchema: { objectiveText: { type: "text", placeholder: "Objective (short)", required: true } },
        required: false,
        helpText: "E.g., Standardize admission process, Reduce admission TAT to X minutes"
      }
    ]
  },



  "policies-procedures": {
    title: "Policies & Procedures",
    description: "Main policy statements and step-by-step procedures",
    fields: [
      { name: "policyStatement", label: "Main policy statement", type: "textarea", placeholder: "Concise policy (1-3 paragraphs) describing standardization & compliance", required: true, maxLength: 1500 },
      { name: "procedureOverview", label: "Procedure overview (summary flow)", type: "textarea", placeholder: "High-level flow: Registration -> Admission -> Transfer -> Discharge", required: true },
      {
        name: "procedureSteps",
        label: "Step-by-step procedures",
        type: "repeater",
        itemSchema: {
          stepOrder: { type: "number", placeholder: "Step number", required: true },
          stepTitle: { type: "text", placeholder: "Step title (short)", required: true },
          stepDescription: { type: "textarea", placeholder: "Detailed actions, who does what", required: true },
          relatedForms: { type: "multi-select", options: ["Registration Form","Consent Form","Transfer Summary","Discharge Summary","Investigation Request","Referral Letter","Other"], required: false }
        },
        required: true,
        helpText: "Use multiple entries to describe the entire SOP process in ordered steps"
      },
      { name: "caseClassifications", label: "Case types / classifications", type: "multi-select", options: ["Elective", "Emergency", "Daycare / OPD", "ICU admission", "Referral", "Other"], required: false, helpText: "Tick all that apply" },
      {
        name: "formsRequired",
        label: "Forms and documents required",
        type: "repeater",
        itemSchema: {
          formName: { type: "text", placeholder: "Form name", required: true },
          formPurpose: { type: "text", placeholder: "Purpose of form", required: false },
          templateUpload: { type: "file", placeholder: "Upload template (optional)", required: false }
        },
        required: true,
        helpText: "Attach templates where available"
      },
      {
        name: "checklistsTemplates",
        label: "Checklists / templates to include",
        type: "repeater",
        itemSchema: {
          checklistName: { type: "text", placeholder: "Checklist name", required: true },
          attachFile: { type: "file", placeholder: "Upload checklist template", required: false }
        },
        required: false
      }
    ]
  },

  "quality-kpis": {
    title: "Quality & KPIs",
    description: "Turnaround times, KPIs and monitoring mechanisms",
    fields: [
      {
        name: "expectedTAT",
        label: "Expected Turnaround times (TAT) or service standards",
        type: "repeater",
        itemSchema: {
          activity: { type: "text", placeholder: "Activity (e.g., Lab report)", required: true },
          tatValue: { type: "text", placeholder: "TAT (e.g., 6 hours / 30 minutes)", required: true }
        },
        required: false
      },
      {
        name: "performanceMonitoring",
        label: "How performance will be monitored",
        type: "multi-select",
        options: ["Audits", "Checklists", "Monthly KPI dashboard", "Feedback forms", "Incident reports", "NABH audit"],
        required: true
      },
      {
        name: "kpiList",
        label: "KPIs and measurable outcomes",
        type: "repeater",
        itemSchema: {
          kpiName: { type: "text", placeholder: "KPI (e.g., Admission TAT)", required: true },
          kpiTarget: { type: "text", placeholder: "Target (e.g., <= 30 minutes)", required: true },
          frequency: { type: "select", options: ["Daily", "Weekly", "Monthly", "Quarterly"], required: true }
        },
        required: false
      },
      { name: "auditOwner", label: "Department responsible for audits", type: "text", placeholder: "E.g., Quality Department / Internal Audit", required: true }
    ]
  },

  "training-compliance": {
    title: "Training & Compliance",
    description: "Staff training, orientation and audit schedule",
    fields: [
      {
        name: "trainingMethod",
        label: "How training/orientation will be delivered",
        type: "multi-select",
        options: ["In-person classroom", "On-the-job", "E-learning (LMS)", "Simulation / Drills", "Train the Trainer"],
        required: true
      },
      {
        name: "trainingFrequency",
        label: "Refresher training frequency",
        type: "select",
        options: ["Monthly", "Quarterly", "Biannual", "Annually", "As-required"],
        required: true
      },
      { name: "trainingRecordsOwner", label: "Department responsible for training records", type: "text", placeholder: "E.g., HR / Quality", required: true },
      { name: "complianceAuditSchedule", label: "Compliance and audit schedule (summary)", type: "textarea", placeholder: "E.g., Internal audits monthly, NABH annual mock audit", required: false }
    ]
  },



  "layout-branding": {
    title: "Layout & Branding",
    description: "Cover, footer, page style and controlled document footer",
    fields: [
      { name: "includeCoverPage", label: "Include cover page", type: "select", options: ["Yes", "No"], required: true, default: "Yes" },
      { name: "coverElements", label: "Cover page elements", type: "multi-select", options: ["Title", "Logo", "Document number", "Prepared by", "Approved by", "Date", "Address"], required: false },
      { name: "footerControlledDoc", label: "Include Controlled Document footer (version/date metadata)", type: "select", options: ["Yes", "No"], required: true, default: "Yes", helpText: "Displays version and revision date on footer" },
      { name: "pageStyle", label: "Page style & fonts", type: "select", options: ["Default (Hospital brand colors)", "Minimal (black & white)", "Compact (smaller margins)"], required: true, default: "Default (Hospital brand colors)" },
      { name: "headerElements", label: "Header elements", type: "multi-select", options: ["Logo", "Hospital name", "SOP title", "Document number", "Page number"], required: false },
      { name: "customBrandColors", label: "Brand primary color (hex)", type: "text", placeholder: "#00aaff", required: false, validationRegex: "^#([A-Fa-f0-9]{6})$", helpText: "Optional - used to style headings" }
    ]
  },

  "summary-closure": {
    title: "Summary & Closure",
    description: "Concluding note and approvals",
    fields: [
      { name: "concludingNote", label: "Concluding note (assurance of compliance)", type: "textarea", placeholder: "Short closure statement confirming compliance and responsibility", required: false, maxLength: 500 },
      { name: "finalApprovalPreparedBy", label: "Prepared by (final signature block)", type: "text", placeholder: "Name and designation", required: true },
      { name: "finalApprovalApprovedBy", label: "Approved by (final signature block)", type: "text", placeholder: "Name and designation", required: true },
      { name: "finalApprovalDate", label: "Approval date", type: "date", required: true }
    ]
  }
};
