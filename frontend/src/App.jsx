import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

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

  const renderAssistantResults = (results) => {
    return results.map((item, idx) => (
      <div key={idx} className="assistant-section">
        {item.problem && <p><strong>Problem:</strong> {item.problem}</p>}
        {item.steps && (
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
    ));
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
