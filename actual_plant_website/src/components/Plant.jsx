import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function Plant() {
  const { plantId } = useParams();
  const [plant, setPlant] = useState(null);

  useEffect(() => {
    async function fetchPlantDetails() {
      try {
        const res = await fetch(`https://your-api-url.com/plants/${plantId}`);
        const data = await res.json();
        setPlant(data);
      } catch (err) {
        console.error("Error fetching plant details:", err);
      }
    }
    fetchPlantDetails();
  }, [plantId]);

  if (!plant) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/plants">← Back to list</Link>
      <h1>{plant.name}</h1>
      <p>Species: {plant.species}</p>
      <p>Soil Moisture: {plant.soilMoisture}%</p>
      <p>Light Level: {plant.lightLevel} lux</p>
      <p>Temperature: {plant.temperature}°C</p>
      {/* Add charts, gauges, etc. later */}
    </div>
  );
}
