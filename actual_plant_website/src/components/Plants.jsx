import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import gardenBg from "../sprites/garden_background.png";
import "../App.css"; // Ensure this file is used for the CSS below

// NOTE: I'm assuming your plant objects have 'id', 'name', 'species', and 'status' properties.

export default function Plants() {
  const [plants, setPlants] = useState([]);
  const navigate = useNavigate();

  // Example: Fetch plants from cloud database (replace with your API)
  useEffect(() => {
    async function fetchPlants() {
      try {
        const res = await fetch("https://your-api-url.com/plants");
        const data = await res.json();
        
        // --- TEMPORARY MOCK DATA ---
        // Use this mock data if your API isn't ready or you need to test the scrolling
        const mockData = [
            { id: 1, name: "Basil", species: "Ocimum basilicum", status: "Happy" },
            { id: 2, name: "Succulent", species: "Echeveria pulidonis", status: "Dry" },
            { id: 3, name: "Fern", species: "Nephrolepis exaltata", status: "Needs Water" },
            { id: 4, name: "Rose", species: "Rosa 'Peace'", status: "Healthy" },
            { id: 5, name: "Mint", species: "Mentha spicata", status: "Thriving" },
            { id: 6, name: "Orchid", species: "Phalaenopsis", status: "Blooming" },
            { id: 7, name: "Bonsai", species: "Ficus retusa", status: "Good" },
            { id: 8, name: "Cactus", species: "Gymnocalycium", status: "Dry" },
            { id: 9, name: "Tomato", species: "Solanum lycopersicum", status: "Fruiting" },
            { id: 10, name: "Lemon Tree", species: "Citrus limon", status: "Great" },
            // Add more entries here to force the list to scroll
        ];
        // --------------------------
        
        setPlants(data.length ? data : mockData); // Use fetched data, otherwise use mock data for visualization
      } catch (err) {
        console.error("Error fetching plants, using mock data:", err);
        // Fallback to mock data if the API call fails
        setPlants([
            { id: 1, name: "Basil", species: "Ocimum basilicum", status: "Happy" },
            { id: 2, name: "Succulent", species: "Echeveria pulidonis", status: "Dry" },
            { id: 3, name: "Fern", species: "Nephrolepis exaltata", status: "Needs Water" },
            { id: 4, name: "Rose", species: "Rosa 'Peace'", status: "Healthy" },
            { id: 5, name: "Mint", species: "Mentha spicata", status: "Thriving" },
            { id: 6, name: "Orchid", species: "Phalaenopsis", status: "Blooming" },
        ]);
      }
    }
    fetchPlants();
  }, []);

  const handleAddPlant = () => {
    navigate("/addplant");
  };

  const handleRemovePlant = () => {
    navigate("/removeplant");
  };

  const openPlantDashboard = (plantId) => {
    navigate(`/plants/${plantId}`);
  };

  return (
    <div
      className="plants-page"
      style={{
        backgroundImage: `url(${gardenBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
    >
      <div className="plants-header">
        <h1>Garden Guardian</h1>
      </div>
  
      <div className="button-group">
        <button onClick={handleAddPlant} className="add-plant-button">
          Add Plant
        </button>
        <button onClick={handleRemovePlant} className="remove-plant-button">
          Remove Plant
        </button>
      </div>
  
      <nav>
        <Link to="/">Logout</Link>
      </nav>
  
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
                <div className="plant-info">
                  <h3 className="plant-name">{plant.name}</h3>
                  <p className="plant-species">
                    Species: <span>{plant.species}</span>
                  </p>
                  <p className="plant-status">
                    Status:{" "}
                    <span
                      className={`status-${plant.status
                        .toLowerCase()
                        .replace(/\s/g, "-")}`}
                    >
                      {plant.status}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );}
 