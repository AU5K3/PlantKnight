import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Plants() {
  const [plants, setPlants] = useState([]);
  const navigate = useNavigate();

  // Example: Fetch plants from cloud database (replace with your API)
  useEffect(() => {
    async function fetchPlants() {
      try {
        const res = await fetch("https://your-api-url.com/plants");
        const data = await res.json();
        setPlants(data);
      } catch (err) {
        console.error("Error fetching plants:", err);
      }
    }
    fetchPlants();
  }, []);

  const handleAddPlant = () => {
    navigate("/addplant"); // or open modal
  };

  const handleRemovePlant = () => {
    // implement removal logic (could open modal or toggle "remove" mode)
    alert("Remove Plant clicked");
  };

  const handleChangeConnection = () => {
    navigate("/changeconnection");
  };

  const openPlantDashboard = (plantId) => {
    navigate(`/plants/${plantId}`);
  };

  return (
    <div className="plants-page">
      <div className="plants-header">
        <button onClick={handleAddPlant}>Add Plant</button>
        <button onClick={handleRemovePlant}>Remove Plant</button>
      </div>

      <div className="plant-list-container">
        {plants.length === 0 ? (
          <p>No plants yet</p>
        ) : (
          <ul className="plant-list">
            {plants.map((plant) => (
              <li
                key={plant.id}
                className="plant-item"
                onClick={() => openPlantDashboard(plant.id)}
              >
                {plant.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="plants-footer">
        <button onClick={handleChangeConnection}>Change Connection</button>
      </div>
    </div>
  );
}
