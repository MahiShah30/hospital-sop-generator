// HomePage.jsx
import React, { useRef } from 'react';
// Router-agnostic; use anchor tags

export default function HomePage() {
  const aboutRef = useRef(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-blue-400 text-white min-h-screen">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">HOSPITAL SOP GENERATOR</h1>
        <div className="flex space-x-5">
          <button onClick={scrollToAbout} className="hover:text-gray-400">ABOUT</button>
          <a href="/login" className="hover:text-gray-400">LOGIN</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex items-center min-h-screen px-16">
        {/* Left Side Content */}
        <div className="w-2/3 pl-0">
          <h1 className="text-8xl font-bold">
            HOSPITAL SOP GENERATOR<span className="text-white">:</span>
          </h1>
          <p className="text-2xl mt-4">One Platform To Build All Your SOPs</p>
        </div>

        {/* Right Side Image */}
        <div className="absolute top-0 right-0 w-1/2 h-full">
          <img
            src="https://img.freepik.com/premium-photo/female-doctor-holding-stethoscope-white-background_392895-128647.jpg"
            alt="Knowledge Lightbulb"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="bg-gray-900 text-white p-6">
        <h2 className="text-3xl font-semibold">About This Tool</h2>
        <p className="mt-4 text-gray-300 text-lg">
          Hospital SOP Generator is an AI-powered web application designed to streamline the creation and management of Standard Operating Procedures (SOPs) in hospitals and healthcare institutions.Managing operations in a hospital requires strict protocols, consistency, and documentation — but drafting and updating SOPs manually is time-consuming and error-prone. Our platform automates this process by generating customized SOPs based on a simple questionnaire filled by the user. Whether it's for OPD, IPD, ICU, OT, Pharmacy, Diagnostics, or Administration, our tool provides standardized, protocol-based documents that align with NABH, JCI, and other accreditation requirements.


        </p>
      </section>
    </div>
  );
}
