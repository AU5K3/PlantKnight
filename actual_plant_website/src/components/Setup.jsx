import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Setup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [connectionId, setConnection] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(`You entered: ${username} / ${password} / ${connectionId}`);
    // Later, send POST to backend API here
  };

  return (
    <div className="container">
      <header>
        <h1>Create Account</h1>
        <nav>
          <Link to="/">Home</Link>
        </nav>
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

          <label>Connection Id:</label>
          <input
            type="connectionID"
            value={connectionId}
            onChange={(e) => setConnection(e.target.value)}
            required
          />

          <button type="submit">Confirm</button>
        </form>
        <p>{message}</p>
      </main>
    </div>
  );
}
