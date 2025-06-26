import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [parsedText, setParsedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [tailoredResult, setTailoredResult] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingTailored, setLoadingTailored] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setParsedText("");
    setQuestions([]);
    setTailoredResult("");
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF resume");
      return;
    }
    setLoadingUpload(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setParsedText(data.text);
    } catch (error) {
      alert("Failed to upload resume");
      console.error(error);
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleGetQuestions = async () => {
    if (!jobDescription.trim()) {
      alert("Please paste a job description first");
      return;
    }

    setLoadingQuestions(true);
    try {
      const response = await fetch("http://localhost:5000/job-description/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription }),
      });

      const data = await response.json();
      if (data.questions) {
        setQuestions(data.questions);
      } else {
        alert("Error getting questions: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert("Error getting follow-up questions");
      console.error(error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleGenerateTailored = async () => {
    if (!parsedText || !jobDescription.trim()) {
      alert("Resume and job description required");
      return;
    }

    setLoadingTailored(true);
    setTailoredResult("");

    try {
      const response = await fetch("http://localhost:5000/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: parsedText, job_description: jobDescription }),
      });

      const data = await response.json();
      setTailoredResult(data.result || "No result returned.");
    } catch (error) {
      alert("Failed to generate tailored result");
      console.error(error);
    } finally {
      setLoadingTailored(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h1>Smart Resume + Cover Letter Generator</h1>

      {/* === Upload Resume === */}
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loadingUpload} style={{ marginLeft: 10 }}>
        {loadingUpload ? "Uploading..." : "Upload Resume"}
      </button>

      {parsedText && (
        <>
          <h3>Extracted Resume Text (preview):</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              maxHeight: 200,
              overflowY: "auto",
              backgroundColor: "#eee",
              padding: 10,
              marginTop: 10,
            }}
          >
            {parsedText.slice(0, 500)}{parsedText.length > 500 ? "..." : ""}
          </pre>
        </>
      )}

      {/* === Job Description === */}
      <hr />
      <h2>Paste Job Description</h2>
      <textarea
        rows={8}
        style={{ width: "100%", padding: 10, fontSize: 14 }}
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste job description here..."
      />

      <button onClick={handleGetQuestions} disabled={loadingQuestions} style={{ marginTop: 10 }}>
        {loadingQuestions ? "Generating Questions..." : "Get Follow-up Questions"}
      </button>

      {/* === Follow-up Questions === */}
      {questions.length > 0 && (
        <>
          <h3>Follow-up Questions to Improve Application:</h3>
          <ul>
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </>
      )}

      {/* === Generate Tailored Output === */}
      {questions.length > 0 && (
        <>
          <hr />
          <h2>Generate Tailored Result</h2>
          <button onClick={handleGenerateTailored} disabled={loadingTailored}>
            {loadingTailored ? "Generating..." : "Generate Tailored Resume / Cover Letter"}
          </button>
        </>
      )}

      {tailoredResult && (
        <>
          <h3>Tailored Output:</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              backgroundColor: "#eef",
              padding: 15,
              borderRadius: 6,
              marginTop: 10,
            }}
          >
            {tailoredResult}
          </pre>
        </>
      )}
    </div>
  );
}

export default App;
