import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Setup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(`You entered: ${username} / ${password} / ${deviceId}`);

    // Navigate to AddPlant and pass deviceId
    navigate("/addplant", { state: { deviceId } });
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

          <button type="submit">Finish Setup</button>
        </form>
        <p>{message}</p>
      </main>
    </div>
  );
}
