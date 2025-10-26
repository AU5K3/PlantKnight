import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RemovePlant() {
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  // Fetch user's plants on component mount
  useEffect(() => {
    fetchUserPlants();
  }, []);

  const fetchUserPlants = async () => {
    try {
        /*
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
            status: device.is_connected ? 'Connected' : 'Disconnected',
            device_id: device.device_id
          }));
          setPlants(transformedPlants);
          return;
        }
      }*/
      
      // Fallback: Get username from localStorage and fetch from API
      const username = localStorage.getItem('username') || "testuser";
      console.log("Fetching plants for user from API:", username);
      
      const res = await fetch(`http://127.0.0.1:5000/api/get_user_plants?username=${username}`);
      
      if (res.status === 404) {
        console.warn("User not found, no plants to remove");
        setPlants([]);
        return;
      }
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Fetched plants data from API:", data);
      
      if (data && data.plants && Array.isArray(data.plants)) {
        const transformedPlants = data.plants.map((plant, index) => ({
          id: plant.device_id || `plant_${index}`,
          name: plant.plant_name || 'Unknown Plant',
          species: plant.species || 'Unknown Species',
          status: plant.is_connected ? 'Connected' : 'Disconnected',
          device_id: plant.device_id
        }));
        setPlants(transformedPlants);
      } else {
        setPlants([]);
      }
    } catch (err) {
      console.error("Error fetching plants:", err);
      setMessage("Error loading plants. Please try again.");
      setPlants([]);
    }
  };

  const handleRemovePlant = async () => {
    if (!selectedPlant) {
      setMessage("Please select a plant to remove.");
      return;
    }

    setIsLoading(true);
    setMessage("Removing plant...");

    try {
      const username = localStorage.getItem('username') || "testuser";
      const response = await fetch("http://127.0.0.1:5000/api/remove_plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username,
          device_id: selectedPlant
        }),
      });

      const data = await response.json();
      console.log("Remove plant response:", data);

      if (response.ok) {
        setMessage("Plant removed successfully! Updating list...");
        // Refresh the plants list
        await fetchUserPlants();
        setSelectedPlant("");
        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        setMessage(`Error removing plant: ${data.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Error removing plant:", error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setMessage("Error: Cannot connect to API server. Please make sure the server is running on port 5000.");
      } else {
        setMessage("Error removing plant. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleConfirmation = () => {
    if (!selectedPlant) {
      setMessage("Please select a plant to remove.");
      return;
    }
    console.log("Selected plant:", selectedPlant);
    setShowConfirmation(true);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setMessage("");
  };

  const getSelectedPlantName = () => {
    const plant = plants.find(p => p.device_id === selectedPlant);
    return plant ? plant.name : "Unknown Plant";
  };

  return (
    <div className="container">
      <header>
        <h1>Remove Plant</h1>
        <nav>
          <Link to="/plants">← Back to Plants</Link>
        </nav>
      </header>
      
      <main>
        {plants.length === 0 ? (
          <div>
            <p>No plants found to remove.</p>
            <p>You can add plants by going to the <Link to="/addplant">Add Plant</Link> page.</p>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="plant-select">Select a plant to remove:</label>
              <select
                id="plant-select"
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  marginTop: "5px",
                  fontSize: "16px"
                }}
              >
                <option value="">-- Select a plant --</option>
                {plants.map((plant) => (
                  <option key={plant.device_id} value={plant.device_id}>
                    {plant.name} ({plant.species}) - {plant.status}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlant && (
              <div style={{ 
                marginBottom: "20px", 
                padding: "15px", 
                backgroundColor: "#f8f9fa", 
                border: "1px solid #dee2e6",
                borderRadius: "5px"
              }}>
                <h3>Selected Plant Details:</h3>
                <p><strong>Name:</strong> {getSelectedPlantName()}</p>
                <p><strong>Species:</strong> {plants.find(p => p.device_id === selectedPlant)?.species}</p>
                <p><strong>Status:</strong> {plants.find(p => p.device_id === selectedPlant)?.status}</p>
                <p><strong>Device ID:</strong> {selectedPlant}</p>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={handleConfirmation}
                disabled={!selectedPlant || isLoading}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "16px",
                  cursor: selectedPlant && !isLoading ? "pointer" : "not-allowed",
                  opacity: selectedPlant && !isLoading ? 1 : 0.6
                }}
              >
                {isLoading ? "Removing..." : "Remove Selected Plant"}
              </button>
            </div>

            {showConfirmation && (
              <div style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "white",
                padding: "30px",
                border: "2px solid #dc3545",
                borderRadius: "10px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
                minWidth: "300px"
              }}>
                <h3 style={{ color: "#dc3545", marginTop: 0 }}>Confirm Plant Removal</h3>
                <p>Are you sure you want to remove <strong>{getSelectedPlantName()}</strong>?</p>
                <p style={{ color: "#666", fontSize: "14px" }}>
                  This action cannot be undone. All data associated with this plant will be permanently deleted.
                </p>
                <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleRemovePlant}
                    disabled={isLoading}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    {isLoading ? "Removing..." : "Yes, Remove Plant"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    style={{
                      backgroundColor: "#6c757d",
                      color: "white",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showConfirmation && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 999
              }}></div>
            )}
          </div>
        )}

        {message && (
          <div style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: message.includes("Error") ? "#f8d7da" : "#d4edda",
            color: message.includes("Error") ? "#721c24" : "#155724",
            border: `1px solid ${message.includes("Error") ? "#f5c6cb" : "#c3e6cb"}`,
            borderRadius: "5px"
          }}>
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
