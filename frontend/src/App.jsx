
import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingSystems, setPendingSystems] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage = { sender: "you", text: input };
    setMessages((prev) => [...prev, newMessage]);

    try {
      const res = await fetch("http://35.179.32.94:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data.needsClarification && data.systems?.length) {
        setPendingSystems(data.systems);
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", text: data.message },
        ]);
      } else {
        const responseText = data.text || data.message || "No response.";
        setMessages((prev) => [...prev, { sender: "assistant", text: responseText }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "Error: " + error.message },
      ]);
    }

    setInput("");
  };

  const handleSystemSelection = async (system) => {
    setMessages((prev) => [
      ...prev,
      { sender: "you", text: system },
    ]);
    setPendingSystems([]);
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: system }),
    });
    const data = await res.json();
    const responseText = data.text || data.message || "No response.";
    setMessages((prev) => [...prev, { sender: "assistant", text: responseText }]);
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

        {pendingSystems.length > 0 && (
          <div className="message assistant">
            <strong className="sender-label">ASSISTANT:</strong>
            <div className="bubble">
              <p>Please select the system:</p>
              {pendingSystems.map((sys, i) => (
                <button key={i} onClick={() => handleSystemSelection(sys)} style={{ margin: "5px" }}>
                  {sys}
                </button>
              ))}
            </div>
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
