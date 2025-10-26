import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Setup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("Creating account...");
    
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          username, 
          password, 
          device_id: deviceId  // Changed from deviceId to device_id to match API
        }),
      });
      
      const data = await response.json();
      console.log("Registration response:", data);
      
      if (response.ok) {
        setMessage("Account created successfully! Redirecting...");
        // Navigate to AddPlant and pass deviceId and username
        setTimeout(() => navigate("/addplant", { state: { deviceId, username } }), 1500);
      } else {
        setMessage(`Error: ${data.message || 'Failed to create account'}`);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Error creating account. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Create Account</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Device Id:</label>
          <input
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Finish Setup"}
          </button>
        </form>
        <p>{message}</p>
      </main>
    </div>
  );
}
