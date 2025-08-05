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

      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: data.reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "Error: " + error },
      ]);
    }

    setInput("");
  };

const renderAssistantMessage = (text) => {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  let problem = "";
  let steps = [];
  let support = "";

  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("problem")) {
      problem = line.replace(/Problem:/i, "").trim();
    } else if (line.startsWith("•") || line.toLowerCase().startsWith("step")) {
      steps.push(line.replace("•", "").trim());
    } else if (line.toLowerCase().startsWith("when to call support")) {
      support = line.replace(/When to call support:/i, "").trim();
    }
  });

  return (
    <div className="assistant-section">
      {problem && <p><strong>Problem:</strong> {problem}</p>}
      {steps.length > 0 && (
        <div>
          <strong>Steps:</strong>
          <ul>
            {steps.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {support && <p><strong>When to call support:</strong> {support}</p>}
      {!problem && !steps.length && !support && <p>{text}</p>}
    </div>
  );
};
  return (
    <div className="chat-container">
     <img src="/wingsgtop_logo.png" alt="Wingstop Logo" className="app-logo" />
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong>{msg.sender === "you" ? "YOU" : "ASSISTANT"}:</strong>
            <div className="bubble">
              {msg.sender === "assistant"
                ? renderAssistantMessage(msg.text)
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
