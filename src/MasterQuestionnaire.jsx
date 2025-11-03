import React, { useState } from "react";

export default function MasterQuestionnaire() {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: "2rem", backgroundColor: "#f9fafb" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Master Questionnaire</h1>
      
      {/* 1️⃣ Hospital Details */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "1rem" }}>Hospital Details</h2>
      <label>Hospital Name:<br/>
        <input type="text" name="hospitalName" onChange={handleChange} />
      </label><br/>
      <label>Hospital Type:<br/>
        <select name="hospitalType" onChange={handleChange}>
          <option value="">Select</option>
          <option value="Clinic">Clinic</option>
          <option value="Nursing Home">Nursing Home</option>
          <option value="Multi-speciality">Multi-speciality</option>
          <option value="Superspeciality">Superspeciality</option>
          <option value="Teaching">Teaching</option>
        </select>
      </label><br/>
      <label>Number of Beds:<br/>
        <input type="number" name="numberOfBeds" onChange={handleChange} />
      </label><br/>
      <label>Accreditation:<br/>
        <select name="accreditation" multiple onChange={handleChange}>
          <option value="NABH">NABH</option>
          <option value="JCI">JCI</option>
          <option value="ISO">ISO</option>
          <option value="None">None</option>
        </select>
      </label><br/>
      <label>Ownership:<br/>
        <select name="ownership" onChange={handleChange}>
          <option value="">Select</option>
          <option value="Trust">Trust</option>
          <option value="Private">Private</option>
          <option value="Corporate">Corporate</option>
          <option value="Government">Government</option>
        </select>
      </label><br/>

      {/* 2️⃣ Key Contacts */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "1rem" }}>Key Contacts</h2>
      <label>CEO/Director Contact:<br/>
        <input type="text" name="ceoContact" onChange={handleChange} />
      </label><br/>
      <label>Medical Superintendent Contact:<br/>
        <input type="text" name="msContact" onChange={handleChange} />
      </label><br/>
      <label>Nursing Head Contact:<br/>
        <input type="text" name="nursingHeadContact" onChange={handleChange} />
      </label><br/>
      <label>Quality/Accreditation Coordinator Contact:<br/>
        <input type="text" name="qualityContact" onChange={handleChange} />
      </label><br/>

      {/* 3️⃣ Clinical Setup */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "1rem" }}>Clinical Setup</h2>
      <label>Departments:<br/>
        <input type="text" name="departments" placeholder="List departments (comma separated)" onChange={handleChange} />
      </label><br/>
      <label>Special Services:<br/>
        <input type="text" name="specialServices" placeholder="Cath Lab, Dialysis, etc." onChange={handleChange} />
      </label><br/>

      {/* 4️⃣ Operational Systems */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "1rem" }}>Operational Systems</h2>
      <label>HMIS Present?
        <input type="checkbox" name="hmis" onChange={handleChange} />
      </label><br/>
      <label>Queue Management?
        <input type="checkbox" name="qms" onChange={handleChange} />
      </label><br/>
      <label>TPA Desk?
        <input type="checkbox" name="tpaDesk" onChange={handleChange} />
      </label><br/>
      <label>Billing Type:<br/>
        <select name="billingType" onChange={handleChange}>
          <option value="">Select</option>
          <option value="Manual">Manual</option>
          <option value="Software">Software</option>
        </select>
      </label><br/>

      {/* 5️⃣ SOP Preferences */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "1rem" }}>SOP Preferences</h2>
      <label>Preferred Format:<br/>
        <select name="format" onChange={handleChange}>
          <option value="">Select</option>
          <option value="PDF">PDF</option>
          <option value="Word">Word</option>
          <option value="Both">Both</option>
        </select>
      </label><br/>
      <label>Level of Detail:<br/>
        <select name="detailLevel" onChange={handleChange}>
          <option value="">Select</option>
          <option value="Basic">Basic</option>
          <option value="Detailed">Detailed (NABH/JCI)</option>
        </select>
      </label><br/>
      <label>Language:<br/>
        <input type="text" name="language" placeholder="English, Hindi, Marathi" onChange={handleChange} />
      </label><br/>

      <button type="submit" style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", backgroundColor: "#2563eb", color: "white", borderRadius: "0.5rem", fontSize: "1.125rem", cursor: "pointer" }}>
        ✅ Submit Questionnaire
      </button>
    </form>
  );
}

// ---------------------------
// JSON Schema for the form
// ---------------------------

export const masterQuestionnaireSchema = {
  hospitalDetails: {
    hospitalName: "string",
    hospitalType: ["Clinic", "Nursing Home", "Multi-speciality", "Superspeciality", "Teaching"],
    numberOfBeds: "number",
    accreditation: ["NABH", "JCI", "ISO", "None"],
    ownership: ["Trust", "Private", "Corporate", "Government"]
  },
  keyContacts: {
    ceoContact: "string",
    msContact: "string",
    nursingHeadContact: "string",
    qualityContact: "string"
  },
  clinicalSetup: {
    departments: "array",
    specialServices: "array"
  },
  operationalSystems: {
    hmis: "boolean",
    qms: "boolean",
    tpaDesk: "boolean",
    billingType: ["Manual", "Software"]
  },
  sopPreferences: {
    format: ["PDF", "Word", "Both"],
    detailLevel: ["Basic", "Detailed"],
    language: "string"
  }
};
