import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function Plant() {
  const { plantId } = useParams();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPlantDetails() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`http://127.0.0.1:5000/api/get_plant_data?device_id=${plantId}`);
        const data = await res.json();
        
        // Handle 404 (no data found) as a special case
        if (res.status === 404) {
          throw new Error("No plant data found for this device");
        }
        
        // Handle other HTTP errors
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        // Check if the response has the expected structure
        if (data && data.message === 'Success' && data.output) {
          // Transform API data to match component expectations
          const plantData = data.output;
          const transformedPlant = {
            id: plantData.device_id || plantId,
            name: plantData.plant_name || 'Unknown Plant',
            species: plantData.species || 'Unknown Species',
            soilMoisture: plantData.moisture || 0,
            lightLevel: plantData.light_levels || 0,
            temperature: plantData.temperature || 0,
            soilPh: plantData.soil_ph || 0,
            timestamp: plantData.timestamp || new Date().toISOString(),
            isConnected: plantData.is_connected || false
          };
          
          setPlant(transformedPlant);
        } else {
          throw new Error(data?.message || "Unexpected response format");
        }
      } catch (err) {
        console.error("Error fetching plant details:", err);
        setError(err.message);
        // Set mock data for development/testing
        setPlant({
          id: plantId,
          name: "Mock Plant",
          species: "Mock Species",
          soilMoisture: 65,
          lightLevel: 300,
          temperature: 72,
          soilPh: 6.5,
          timestamp: new Date().toISOString(),
          isConnected: false
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (plantId) {
      fetchPlantDetails();
    }
  }, [plantId]);

  if (loading) return <p>Loading plant details...</p>;
  
  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <Link to="/plants">← Back to list</Link>
        <h1>Plant Data Unavailable</h1>
        {error.includes("No plant data found") ? (
          <div>
            <p>No sensor data has been recorded for this plant yet.</p>
            <p>This could mean:</p>
            <ul>
              <li>The plant device hasn't been connected yet</li>
              <li>No data has been sent from the device</li>
              <li>The device ID is incorrect</li>
            </ul>
            <p>Using sample data for demonstration:</p>
          </div>
        ) : (
          <div>
            <p>Error: {error}</p>
            <p>Using mock data for development.</p>
          </div>
        )}
      </div>
    );
  }

  if (!plant) return <p>No plant data available</p>;

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/plants">← Back to list</Link>
      <h1>{plant.name || 'Unknown Plant'}</h1>
      <p>Species: {plant.species || 'Unknown Species'}</p>
      <p>Soil Moisture: {plant.soilMoisture || 0}%</p>
      <p>Light Level: {plant.lightLevel || 0} lux</p>
      <p>Temperature: {plant.temperature || 0}°F</p>
      <p>Soil pH: {plant.soilPh || 0}</p>
      <p>Status: {plant.isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Last Updated: {plant.timestamp ? new Date(plant.timestamp).toLocaleString() : 'Unknown'}</p>
      {/* Add charts, gauges, etc. later */}
    </div>
  );
}
