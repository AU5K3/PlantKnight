import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Setup from "./components/Setup";
import Plants from "./components/Plants";
import Plant from "./components/Plant";
import ChangeConnection from "./components/ChangeConnection";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/plants" element={<Plants />} />
        <Route path="/plants/:plantId" element={<Plant />} />
        <Route path="/changeconnection" element={<ChangeConnection />} />
      </Routes>
    </Router>
  );
}

export default App;
