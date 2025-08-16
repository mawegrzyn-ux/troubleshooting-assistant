import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Reset selection
    setSelectedResult(null);

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

  const renderOptionSelection = (results) => (
    <div className="assistant-options">
      {results.map((item, idx) => (
        <div
          key={idx}
          className="option-card"
          onClick={() => setSelectedResult(item)}
        >
          <strong>Problem:</strong> {item.problem} <br />
          <strong>System:</strong> {item.system}
        </div>
      ))}
    </div>
  );

  const renderSelectedResult = (item) => (
    <div className="bubble">
      <div className="assistant-section">
        <p><strong>Problem:</strong> {item.problem}</p>
        <p><strong>System:</strong> {item.system}</p>
        {item.steps && item.steps.length > 0 && (
          <div>
            <strong>Steps:</strong>
            <ul>
              {item.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        )}
        {item.support && (
          <p><strong>When to call support:</strong> {item.support}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="chat-container">
      <img
        src="/wingsgtop_logo.png"
        alt="Wingstop Logo"
        className="app-logo"
      />
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong className="sender-label">
              {msg.sender === "you" ? "YOU" : "ASSISTANT"}:
            </strong>
            <div className="bubble">
              {msg.sender === "assistant" && msg.results
                ? renderOptionSelection(msg.results)
                : <p>{msg.text || ""}</p>}
            </div>
          </div>
        ))}

        {selectedResult && (
          <div className="message assistant">
            <strong className="sender-label">ASSISTANT:</strong>
            {renderSelectedResult(selectedResult)}
          </div>
        )}
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
