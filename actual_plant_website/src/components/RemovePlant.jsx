import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function RemovePlant() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get deviceId from navigation state, fallback to empty string
  const [deviceId, setDeviceId] = useState(location.state?.deviceId || "");
  const [plantName, setPlantName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`https://your-api-url.com/plants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, plantName }),
      });

      if (response.ok) {
        setMessage("Plant removed successfully!");
        setTimeout(() => navigate("/plants"), 1500);
      } else {
        setMessage("Error removing plant. Please try again.");
      }
    } catch (error) {
      console.error("Error removing plant:", error);
      setMessage("Error removing plant. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Remove Plant</h1>
        <nav>
          <Link to="/plants">Back</Link>
        </nav>
      </header>
      <main>
        <form onSubmit={handleRemove}>
          <label>Plant Name:</label>
          <input
            type="text"
            value={plantName}
            onChange={(e) => setPlantName(e.target.value)}
            required
            placeholder="Enter plant name to remove"
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
            {isLoading ? "Removing Plant..." : "Remove Plant"}
          </button>
        </form>
        <p>{message}</p>
      </main>
    </div>
  );
}
