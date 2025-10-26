import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // ✅ get navigate function

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok) {
        setMessage("Login successful! Redirecting...");
        // Store username and user data for use in other components
        localStorage.setItem('username', username);
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
        setTimeout(() => navigate("/plants"), 1500);
      } else {
        setMessage(`Login failed: ${data.message || 'Invalid credentials'}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setMessage("Error: Cannot connect to API server. Please make sure the server is running on port 5000.");
      } else {
        setMessage("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Login</h1>
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

          <button type="submit">Login</button>
        </form>
        <p>{message}</p>
      </main>
    </div>
  );
}
