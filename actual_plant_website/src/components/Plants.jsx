import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import gardenBg from "../sprites/garden_background.png";
import "../App.css"; // Ensure this file is used for the CSS below

// NOTE: I'm assuming your plant objects have 'id', 'name', 'species', and 'status' properties.

export default function Plants() {
  const [plants, setPlants] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Example: Fetch plants from cloud database (replace with your API)
  useEffect(() => {
    async function fetchPlants() {
      try {
        // First try to get plants from localStorage (from login)
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          console.log("User data from localStorage:", userData);
          
          if (userData.devices && Array.isArray(userData.devices)) {
            // Transform user's devices to plant format
            const transformedPlants = userData.devices.map((device, index) => ({
              id: device.device_id || `plant_${index}`,
              name: device.plant_name || 'Unknown Plant',
              species: device.species || 'Unknown Species',
              status: device.is_connected ? 'Connected' : 'Disconnected'
            }));
            setPlants(transformedPlants);
            return;
          }
        }
        
        // Fallback: Get username from localStorage and fetch from API
        const username = localStorage.getItem('username') || "testuser";
        console.log("Fetching plants for user from API:", username);
        
        const res = await fetch(`http://127.0.0.1:5000/api/get_user_plants?username=${username}`);
        
        // Handle 404 (user not found) as a special case
        if (res.status === 404) {
          console.warn("User not found, using mock data");
          setPlants(getMockData());
          return;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Fetched plants data from API:", data);
        
        // Check if the response has the expected structure
        if (data && data.plants && Array.isArray(data.plants)) {
          // Transform API data to match component expectations
          const transformedPlants = data.plants.map((plant, index) => ({
            id: plant.device_id || `plant_${index}`,
            name: plant.plant_name || 'Unknown Plant',
            species: plant.species || 'Unknown Species',
            status: plant.is_connected ? 'Connected' : 'Disconnected'
          }));
          setPlants(transformedPlants);
        } else {
          console.warn("Unexpected API response structure:", data);
          // Fallback to mock data if API structure is unexpected
          setPlants(getMockData());
        }
      } catch (err) {
        console.error("Error fetching plants, using mock data:", err);
        // Fallback to mock data if the API call fails
        setPlants(getMockData());
      }
    }
    
    // Helper function for mock data
    function getMockData() {
      return [
        { id: 1, name: "Basil", species: "Ocimum basilicum", status: "Happy" },
        { id: 2, name: "Succulent", species: "Echeveria pulidonis", status: "Dry" },
        { id: 3, name: "Fern", species: "Nephrolepis exaltata", status: "Needs Water" },
        { id: 4, name: "Rose", species: "Rosa 'Peace'", status: "Healthy" },
        { id: 5, name: "Mint", species: "Mentha spicata", status: "Thriving" },
        { id: 6, name: "Orchid", species: "Phalaenopsis", status: "Blooming" },
      ];
    }
    
    fetchPlants();
  }, [refreshKey]);

  // Refresh plants when returning from remove plant page
  useEffect(() => {
    if (location.pathname === '/plants') {
      refreshPlants();
    }
  }, [location.pathname]);

  const handleAddPlant = () => {
    navigate("/addplant");
  };

  const handleRemovePlant = () => {
    navigate("/removeplant");
  };

  const refreshPlants = () => {
    setRefreshKey(prev => prev + 1);
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
            {plants.map((plant) => {
              // Ensure plant object has required properties with fallbacks
              const plantId = plant?.id || 'unknown';
              const plantName = plant?.name || 'Unknown Plant';
              const plantSpecies = plant?.species || 'Unknown Species';
              const plantStatus = plant?.status || 'Unknown';
              
              return (
                <li
                  key={plantId}
                  className="plant-item"
                  onClick={() => openPlantDashboard(plantId)}
                >
                  <div className="plant-info">
                    <h3 className="plant-name">{plantName}</h3>
                    <p className="plant-species">
                      Species: <span>{plantSpecies}</span>
                    </p>
                    <p className="plant-status">
                      Status:{" "}
                      <span
                        className={`status-${plantStatus
                          .toLowerCase()
                          .replace(/\s/g, "-")}`}
                      >
                        {plantStatus}
                      </span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );}
 