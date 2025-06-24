import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [parsedText, setParsedText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setParsedText("");
    setQuestions([]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }
    setLoading(true);

    try {
      // Upload resume
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("http://localhost:5000/upload/", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        alert("Upload failed");
        setLoading(false);
        return;
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
        alert("Failed to get questions");
        setLoading(false);
        return;
      }

      const questionsData = await questionsResponse.json();
      console.log("questionsData:", questionsData);

      if (questionsData.questions) {
        setQuestions(questionsData.questions);
      } else {
        alert("Backend error: " + (questionsData.error || "Unknown error"));
        setQuestions([]);
      }
    } catch (error) {
      alert("Error during upload or question fetch");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h1>Resume Upload & AI Follow-up Questions</h1>

      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading} style={{ marginLeft: 10 }}>
        {loading ? "Processing..." : "Upload & Get Questions"}
      </button>

      {parsedText && (
        <>
          <h2>Extracted Resume Text (first 500 chars):</h2>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              maxHeight: 200,
              overflowY: "auto",
              backgroundColor: "#eee",
              padding: 10,
            }}
          >
            {parsedText.slice(0, 500)}
            {parsedText.length > 500 ? "..." : ""}
          </pre>
        </>
      )}

      {questions.length > 0 && (
        <>
          <h2>AI Follow-up Questions:</h2>
          <ul>
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
