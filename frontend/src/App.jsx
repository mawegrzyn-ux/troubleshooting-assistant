import { useState } from "react";


function App() {

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");


  const sendMessage = async () => {

    if (!input.trim()) return;


    // Add user's message to the chat

    setMessages([...messages, { sender: "You", text: input }]);


    try {

      const res = await fetch("http://35.179.32.94:3000/chat", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ message: input }),

      });

      const data = await res.json();


      setMessages((prev) => [...prev, { sender: "Assistant", text: data.reply }]);

    } catch (error) {

      setMessages((prev) => [...prev, { sender: "Assistant", text: "Error: " + error }]);

    }


    setInput("");

  };


  return (

    <div style={{ maxWidth: "600px", margin: "20px auto", fontFamily: "Arial" }}>

      <h2>AI Troubleshooting Assistant</h2>

      <div

        style={{

          border: "1px solid #ccc",

          padding: "10px",

          height: "400px",

          overflowY: "auto",

          marginBottom: "10px",

          background: "#f9f9f9",

        }}

      >

        {messages.map((msg, index) => (

          <div key={index}>

            <strong>{msg.sender}:</strong> {msg.text}

          </div>

        ))}

      </div>

      <input

        style={{ width: "80%", padding: "10px" }}

        value={input}

        onChange={(e) => setInput(e.target.value)}

        placeholder="Type your message..."

        onKeyDown={(e) => e.key === "Enter" && sendMessage()}

      />

      <button style={{ width: "18%", padding: "10px" }} onClick={sendMessage}>

        Send

      </button>

    </div>

  );

}


export default App;

