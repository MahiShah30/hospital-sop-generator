// Questionnaire.jsx
import React, { useState } from 'react';

export default function Questionnaire() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 'hospitalType',
      question: 'What type of hospital are you?',
      type: 'radio',
      options: ['Multispeciality', 'Single Speciality', 'Daycare', 'Diagnostic Center']
    },
    {
      id: 'bedCount',
      question: 'How many beds does your hospital have?',
      type: 'text',
    },
    {
      id: 'hasICU',
      question: 'Does your hospital have an ICU?',
      type: 'radio',
      options: ['Yes', 'No']
    },
    {
      id: 'departments',
      question: 'Select your active departments:',
      type: 'checkbox',
      options: ['Emergency', 'Cardiology', 'Orthopedics', 'Radiology', 'Pathology']
    },
  ];

  const handleChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleCheckboxChange = (id, option) => {
    const current = answers[id] || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    setAnswers({ ...answers, [id]: updated });
  };

  const current = questions[step];

  const next = () => setStep((s) => Math.min(s + 1, questions.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    console.log('Submitted Answers:', answers);
    alert('Answers submitted! (Mock)');
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-xl font-semibold mb-4">Step {step + 1} of {questions.length}</h2>
      <p className="mb-4 font-medium">{current.question}</p>

      {current.type === 'radio' && current.options.map((opt) => (
        <label key={opt} className="block mb-2">
          <input
            type="radio"
            name={current.id}
            value={opt}
            checked={answers[current.id] === opt}
            onChange={() => handleChange(current.id, opt)}
            className="mr-2"
          />
          {opt}
        </label>
      ))}

      {current.type === 'text' && (
        <input
          type="text"
          className="border p-2 rounded w-full"
          value={answers[current.id] || ''}
          onChange={(e) => handleChange(current.id, e.target.value)}
        />
      )}

      {current.type === 'checkbox' && current.options.map((opt) => (
        <label key={opt} className="block mb-2">
          <input
            type="checkbox"
            value={opt}
            checked={(answers[current.id] || []).includes(opt)}
            onChange={() => handleCheckboxChange(current.id, opt)}
            className="mr-2"
          />
          {opt}
        </label>
      ))}

      <div className="mt-6 flex justify-between">
        <button
          onClick={prev}
          disabled={step === 0}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        {step < questions.length - 1 ? (
          <button
            onClick={next}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
