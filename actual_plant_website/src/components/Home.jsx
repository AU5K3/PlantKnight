import React from "react";
import { useNavigate } from "react-router-dom"; // if using React Router
import "../App.css";
import knight from "../sprites/ufc_knight.png";


function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <header className="homepage-header">
        <h1>Garden Guardian</h1>
      </header>
      <button className="check-plants-button" onClick={() => navigate("/login")}>
        Check Plants
      </button>
      <button className="set-up-button" onClick={() => navigate("/setup")}>
        Set Up
      </button>
      <img src={knight} alt="Garden Guardian Sprite" className="knight-image" draggable="false"/>

    </div>

  );
}

export default HomePage;

