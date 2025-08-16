import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedResultIndex, setSelectedResultIndex] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSelectedResultIndex(null); // Reset any previous selection

    setMessages((prev) => [...prev, { sender: "you", text: input }]);

    try {
      const res = await fetch("http://35.179.32.94:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", results: data.results },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: "No relevant troubleshooting steps found.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "Error: " + error.message },
      ]);
    }

    setInput("");
  };

  const renderAssistantOptions = (results) => {
    return (
      <div className="assistant-options">
        {results.map((item, idx) => (
          <div
            key={idx}
            className={`option-card ${selectedResultIndex === idx ? "active" : ""}`}
            onClick={() => setSelectedResultIndex(idx)}
          >
            <p><strong>Problem:</strong> {item.problem}</p>
            <p><strong>System:</strong> {item.system}</p>
          </div>
        ))}

        {selectedResultIndex !== null && results[selectedResultIndex] && (
          <div className="assistant-section">
            <p><strong>Problem:</strong> {results[selectedResultIndex].problem}</p>
            <div>
              <strong>Steps:</strong>
              <ul>
                {results[selectedResultIndex].steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <p><strong>When to call support:</strong> {results[selectedResultIndex].support}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <img src="/wingsgtop_logo.png" alt="Wingstop Logo" className="app-logo" />
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong className="sender-label">
              {msg.sender === "you" ? "YOU" : "ASSISTANT"}:
            </strong>
            <div className="bubble">
              {msg.sender === "assistant" && Array.isArray(msg.results)
                ? renderAssistantOptions(msg.results)
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
