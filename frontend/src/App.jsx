import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
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
        setSelectedIndex(null); // reset selected index for new query
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

  const renderAssistantResults = (results, selectedIndex, setSelectedIndex) => {
    if (!results || results.length === 0) {
      return <p>No relevant troubleshooting steps found.</p>;
    }

    return (
      <div>
        <div className="assistant-options">
          {results.map((item, idx) => (
            <div
              key={idx}
              className={`option-card ${selectedIndex === idx ? "active" : ""}`}
              onClick={() => setSelectedIndex(idx)}
            >
              <strong>Problem:</strong> {item.problem} <br />
              <strong>System:</strong> {item.system}
            </div>
          ))}
        </div>

        {selectedIndex !== null && (
          <div className="assistant-section">
            <p><strong>Problem:</strong> {results[selectedIndex].problem}</p>
            <p><strong>System:</strong> {results[selectedIndex].system}</p>
            {results[selectedIndex].steps && results[selectedIndex].steps.length > 0 && (
              <div>
                <strong>Steps:</strong>
                <ul>
                  {results[selectedIndex].steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            {results[selectedIndex].support && (
              <p><strong>When to call support:</strong> {results[selectedIndex].support}</p>
            )}
          </div>
        )}
      </div>
    );
  };

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
              {msg.sender === "assistant" && Array.isArray(msg.results)
                ? renderAssistantResults(msg.results, selectedIndex, setSelectedIndex)
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
