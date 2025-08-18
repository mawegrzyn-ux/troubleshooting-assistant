import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [clarifyOptions, setClarifyOptions] = useState([]);

  const processResponse = (data, original = "") => {
    if (data.needsClarification) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: data.message },
      ]);
      setClarifyOptions(data.systems || []);
      setPendingMessage(original);
    } else if (data.reset) {
      setMessages([
        { sender: "assistant", text: "✅ Problem resolved. Starting a new session." },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: data.text || "No response." },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "you", text: input }]);

    try {
      const res = await fetch("http://35.179.32.94:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      processResponse(data, input);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "Error: " + error.message },
      ]);
    }

    setInput("");
  };

  const handleClarify = async (selected) => {
    if (!pendingMessage) return;
    const original = pendingMessage;
    setClarifyOptions([]);
    setPendingMessage("");
    try {
      const res = await fetch("http://35.179.32.94:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: original,
          clarifiedSystem: selected,
        }),
      });

      const data = await res.json();
      processResponse(data, original);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "Error: " + error.message },
      ]);
    }
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
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {clarifyOptions.length > 0 && (
        <div className="clarify-options">
          {clarifyOptions.map((opt) => (
            <button key={opt} onClick={() => handleClarify(opt)}>
              {opt}
            </button>
          ))}
        </div>
      )}

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
