import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function AddPlant() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get deviceId from navigation state, fallback to empty string
  const [deviceId, setDeviceId] = useState(location.state?.deviceId || "");
  const [plantName, setPlantName] = useState("");
  const [plantSpecies, setPlantSpecies] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("https://your-api-url.com/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, plantName, plantSpecies }),
      });

      if (response.ok) {
        setMessage("Plant added successfully!");
        setTimeout(() => navigate("/plants"), 1500);
      } else {
        setMessage("Error adding plant. Please try again.");
      }
    } catch (error) {
      console.error("Error adding plant:", error);
      setMessage("Error adding plant. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Add Plant</h1>
        <nav>
          <Link to="/plants">Home</Link>
        </nav>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input
            type="text"
            value={plantName}
            onChange={(e) => setPlantName(e.target.value)}
            required
            placeholder="Enter plant name"
          />

          <label>Species:</label>
          <input
            type="text"
            value={plantSpecies}
            onChange={(e) => setPlantSpecies(e.target.value)}
            required
            placeholder="Enter plant species"
          />

          <label>Device Id:</label>
          <input
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
            placeholder="Enter device ID"
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Adding Plant..." : "Add Plant"}
          </button>
        </form>
        <p>{message}</p>
      </main>
    </div>
  );
}
