// src/Main.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import AdminPanel from "./AdminPanel";

function Main() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default Main;
