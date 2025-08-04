import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "you", text: input }]);

    try {
      const res = await fetch("http://YOUR_LIGHTSAIL_PUBLIC_IP:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { sender: "assistant", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "assistant", text: "Error: " + error }]);
    }

    setInput("");
  };

  const renderAssistantMessage = (text) => {
    return (
      <div className="assistant-section">
        {text.split("- ").map((section, i) => {
          if (section.startsWith("Problem:")) {
            return (
              <p key={i}>
                <strong>Problem:</strong> {section.replace("Problem:", "").trim()}
              </p>
            );
          }
          if (section.startsWith("Steps:")) {
            const steps = section
              .replace("Steps:", "")
              .split("•")
              .filter((s) => s.trim().length > 0);
            return (
              <div key={i}>
                <strong>Steps:</strong>
                <ul>
                  {steps.map((step, j) => (
                    <li key={j}>{step.trim()}</li>
                  ))}
                </ul>
              </div>
            );
          }
          if (section.startsWith("When to call support:")) {
            return (
              <p key={i}>
                <strong>When to call support:</strong>{" "}
                {section.replace("When to call support:", "").trim()}
              </p>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <h2>AI Troubleshooting Assistant</h2>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong>{msg.sender === "you" ? "You" : "Assistant"}:</strong>
            {msg.sender === "assistant" ? renderAssistantMessage(msg.text) : <p>{msg.text}</p>}
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
