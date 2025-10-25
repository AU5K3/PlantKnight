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

    // Example: Send login request to your backend
    try {
      const res = await fetch("https://your-api-url.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Login successful, redirect to /plants
        navigate("/plants");
      } else {
        // Show error message from backend
        setMessage(data.message || "Login failed");
        navigate("/plants") // remove this later when login functionality works
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error(err);
      navigate("/plants") // remove this later when login functionality works
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
