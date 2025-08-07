import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages([...messages, { sender: "you", text: input }]);

    try {
      const res = await fetch("http://35.179.32.94:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      if (data.results) {
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", results: data.results },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", text: "No results found." },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "Error: " + error },
      ]);
    }

    setInput("");
  };

  const renderAssistantResults = (results) => (
    <div className="assistant-section">
      {results.map((item, index) => (
        <div className="result-block" key={index}>
          <p><strong>Problem:</strong> {item.problem}</p>
          <strong>Steps:</strong>
          <ul>
            {item.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p><strong>When to call support:</strong> {item.support}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="chat-container">
      <img src="/wingsgtop_logo.png" alt="Wingstop Logo" className="app-logo" />
      <h2>AI Troubleshooting Assistant</h2>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong>{msg.sender === "you" ? "YOU" : "ASSISTANT"}:</strong>
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
