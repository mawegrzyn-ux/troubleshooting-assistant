import { useEffect, useRef, useState } from "react";
import "./App.css";
import LanguageSelector from "./LanguageSelector.jsx";
import { useTranslation } from "./TranslationContext.jsx";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [clarifiedSystem, setClarifiedSystem] = useState(null);
  const [systemOptions, setSystemOptions] = useState([]);
  const messagesEndRef = useRef(null);
  const { language, translate } = useTranslation();
  const [labels, setLabels] = useState({
    you: "YOU",
    assistant: "ASSISTANT",
    placeholder: "Type your message...",
    send: "Send",
    confirm: "Can you confirm which system this relates to?",
    reset: "Great! I'm glad it's resolved. Let me know if anything else comes up.",
    error: "Error: Failed to fetch",
  });

  const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadTranslations = async () => {
      setLabels({
        you: await translate("YOU"),
        assistant: await translate("ASSISTANT"),
        placeholder: await translate("Type your message..."),
        send: await translate("Send"),
        confirm: await translate("Can you confirm which system this relates to?"),
        reset: await translate("Great! I'm glad it's resolved. Let me know if anything else comes up."),
        error: await translate("Error: Failed to fetch"),
      });
    };
    loadTranslations();
  }, [language, translate]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newUserMessage = { sender: "you", text: input };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const englishInput = language === "en" ? input : await translate(input, "en");
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: englishInput, clarifiedSystem }),
      });

      const data = await response.json();

      if (data.reset) {
        const text = labels.reset;
        setMessages([{ sender: "assistant", text }]);
        setClarifiedSystem(null);
        setSystemOptions([]);
        setInput("");
        return;
      }

      if (data.needsClarification) {
        setSystemOptions(data.systems || []);
      }

      if (data.message || data.text) {
        let assistantText = data.message || data.text;
        if (language !== "en") {
          assistantText = await translate(assistantText);
        }
        const assistantMessage = { sender: "assistant", text: assistantText };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Failed to fetch", error);
      const errText = labels.error;
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: errText },
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
      <LanguageSelector />
      <img src="/wingsgtop_logo.png" alt="Wingstop Logo" className="app-logo" />

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            <strong className="sender-label">
              {msg.sender === "you" ? labels.you : labels.assistant}:
            </strong>
            <div className="bubble">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {systemOptions.length > 0 && (
          <div className="message assistant">
            <strong className="sender-label">{labels.assistant}:</strong>
            <div className="bubble">
              <p>{labels.confirm}</p>
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
          placeholder={labels.placeholder}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>{labels.send}</button>
      </div>
    </div>
  );
}

export default App;
