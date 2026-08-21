import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function isAdminUser(user) {
  return user?.app_metadata?.role === "admin";
}

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!isAdminUser(data.user)) {
      await supabase.auth.signOut();
      setError("This account does not have administrator access.");
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login">

        <div className="admin-login-header">
          <span>MINIMAL</span>

          <p>ADMINISTRATION</p>
        </div>

        <form onSubmit={handleLogin}>

          <div className="admin-field">
            <label>EMAIL</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              required
            />
          </div>

          <div className="admin-field">
            <label>PASSWORD</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          {error && (
            <p className="admin-login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
            <span>→</span>
          </button>

        </form>

      </div>
    </div>
  );
}
