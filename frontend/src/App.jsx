import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [clarifiedSystem, setClarifiedSystem] = useState(null);
  const [systemOptions, setSystemOptions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newUserMessage = { sender: "you", text: input };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await fetch("http://stiab.online:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, clarifiedSystem }),
      });

      const data = await response.json();

      if (data.reset) {
        setMessages([{ sender: "assistant", text: "Great! I'm glad it's resolved. Let me know if anything else comes up." }]);
        setClarifiedSystem(null);
        setSystemOptions([]);
        setInput("");
        return;
      }

      if (data.needsClarification) {
        setSystemOptions(data.systems || []);
      }

      if (data.message || data.text) {
        const assistantMessage = { sender: "assistant", text: data.message || data.text };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Failed to fetch", error);
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "Error: Failed to fetch" },
      ]);
    }

    setInput("");
  };

  const handleSystemSelection = (system) => {
    setClarifiedSystem(system);
    setMessages((prev) => [
      ...prev,
      { sender: "you", text: system },
    ]);
    setSystemOptions([]);
  };

  return (
    <div className="chat-container">
      <img src="/wingsgtop_logo.png" alt="Wingstop Logo" className="app-logo" />

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            <strong className="sender-label">
              {msg.sender === "you" ? "YOU" : "ASSISTANT"}:
            </strong>
            <div className="bubble">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {systemOptions.length > 0 && (
          <div className="message assistant">
            <strong className="sender-label">ASSISTANT:</strong>
            <div className="bubble">
              <p>Can you confirm which system this relates to?</p>
              <div className="system-options">
                {systemOptions.map((system, index) => (
                  <button key={index} onClick={() => handleSystemSelection(system)}>
                    {system}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
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
