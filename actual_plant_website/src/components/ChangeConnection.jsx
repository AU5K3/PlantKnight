import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ChangeConnection() {
  const [connectionId, setConnection] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(`You entered: ${connectionId}`);
    // Later, send POST to backend API here
  };

  return (
    <div className="container">
      <header>
        <h1>Change Connection</h1>
        <nav>
          <Link to="/plants">Home</Link>
        </nav>
      </header>
      <main>
        <form onSubmit={handleSubmit}>

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
