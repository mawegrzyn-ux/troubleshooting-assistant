import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "you", text: input }]);
    setSelectedResult(null); // Reset selection

    try {
      const res = await fetch("http://35.179.32.94:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data.intent === "troubleshooting") {
        if (data.results?.length) {
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
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", text: data.reply || "..." },
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

  const renderAssistantResults = (results) => {
    if (selectedResult !== null) {
      const item = results[selectedResult];
      return (
        <div className="result-block full">
          <p><strong>Problem:</strong> {item.problem}</p>
          {item.system && <p><strong>System:</strong> {item.system}</p>}
          {item.steps && item.steps.length > 0 && (
            <>
              <strong>Steps:</strong>
              <ul>
                {item.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
          {item.support && (
            <p><strong>When to call support:</strong> {item.support}</p>
          )}
        </div>
      );
    }

    return (
      <div className="result-list">
        {results.map((item, idx) => (
          <div
            key={idx}
            className="result-summary"
            onClick={() => setSelectedResult(idx)}
          >
            <p><strong>Problem:</strong> {item.problem}</p>
            {item.system && <p><strong>System:</strong> {item.system}</p>}
          </div>
        ))}
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
              {msg.sender === "assistant" && msg.results
                ? renderAssistantResults(msg.results)
                : <p>{msg.text}</p>}
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
