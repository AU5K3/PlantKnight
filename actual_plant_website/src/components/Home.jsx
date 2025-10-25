import React from "react";
import { useNavigate } from "react-router-dom"; // if using React Router
import "../App.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <button className="check-plants-button" onClick={() => navigate("/login")}>
        Check Plants
      </button>
      <button className="set-up-button" onClick={() => navigate("/setup")}>
        Set Up
      </button>
    </div>
  );
}

export default HomePage;

