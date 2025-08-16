import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "you", text: input }]);
    setSelectedResult(null;

    try {
      const res = await fetch("http://35.179.32.94:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data.type === "match" && Array.isArray(data.results)) {
        setMessages((prev) => [...prev, { sender: "assistant", results: data.results }]);
      } else {
        setMessages((prev) => [...prev, { sender: "assistant", text: data.reply || "Sorry, I didn’t get that." }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "assistant", text: "Error: " + error.message }]);
    }

    setInput("");
  };

  const handleSelect = (result) => {
    setSelectedResult(result);
  };

  const renderAssistantResults = (results) => {
    if (selectedResult) {
      return (
        <div className="assistant-section selected">
          <p><strong>Problem:</strong> {selectedResult.problem}</p>
          <p><strong>System:</strong> {selectedResult.system || "N/A"}</p>
          {selectedResult.steps?.length > 0 && (
            <div>
              <strong>Steps:</strong>
              <ul>
                {selectedResult.steps.map((step, i) => <li key={i}>{step}</li>)}
              </ul>
            </div>
          )}
          {selectedResult.support && (
            <p><strong>When to call support:</strong> {selectedResult.support}</p>
          )}
        </div>
      );
    }

    return (
      <div className="assistant-options">
        {results.map((item, idx) => (
          <div key={idx} className="result-block" onClick={() => handleSelect(item)}>
            <p><strong>Problem:</strong> {item.problem}</p>
            <p><strong>System:</strong> {item.system || "N/A"}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <img src="/wingsgtop_logo.png" alt="Wingstop Logo" className="app-logo" />
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong className="sender-label">{msg.sender === "you" ? "YOU" : "ASSISTANT"}:</strong>
            <div className="bubble">
              {msg.sender === "assistant" && Array.isArray(msg.results)
                ? renderAssistantResults(msg.results)
                : <p>{msg.text || ""}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
