import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [parsedText, setParsedText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setParsedText("");
    setQuestions([]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Upload resume
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("http://localhost:5000/upload/", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = await uploadResponse.json();
      setParsedText(uploadData.text);

      // Get follow-up questions
      const questionsResponse = await fetch("http://localhost:5000/questions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: uploadData.text }),
      });

      if (!questionsResponse.ok) {
        throw new Error("Failed to get questions");
      }

      const questionsData = await questionsResponse.json();
      if (questionsData.error) throw new Error(questionsData.error);
      setQuestions(questionsData.questions || []);
    } catch (err) {
      setError(err.message || "Unknown error occurred");
      setQuestions([]);
      setParsedText("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Resume Upload & AI Follow-up Questions</h1>

      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button 
        onClick={handleUpload} 
        disabled={loading} 
        style={{ marginLeft: 10, padding: "6px 12px", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Processing..." : "Upload & Get Questions"}
      </button>

      {error && (
        <div style={{ marginTop: 20, color: "red", fontWeight: "bold" }}>
          Error: {error}
        </div>
      )}

      {parsedText && (
        <>
          <h2>Extracted Resume Text (first 500 chars):</h2>
          <pre style={{ 
            whiteSpace: "pre-wrap", 
            maxHeight: 200, 
            overflowY: "auto", 
            backgroundColor: "#f0f0f0", 
            padding: 10, 
            borderRadius: 4,
            border: "1px solid #ccc"
          }}>
            {parsedText.slice(0, 500)}{parsedText.length > 500 ? "..." : ""}
          </pre>
        </>
      )}

      {questions.length > 0 ? (
        <>
          <h2>AI Follow-up Questions:</h2>
          <ul>
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </>
      ) : !loading && parsedText ? (
        <p><i>No questions generated.</i></p>
      ) : null}
    </div>
  );
}

export default App;
