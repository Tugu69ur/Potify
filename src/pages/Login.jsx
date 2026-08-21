import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          navigate("/");
        } else {
          setMessage(
            "Account created. Check your email to confirm your account."
          );
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="minimal-auth">
      <div className="minimal-auth-inner">

        <div className="minimal-auth-header">
          <span className="auth-eyebrow">
            {isLogin ? "WELCOME BACK" : "JOIN MINIMAL"}
          </span>

          <h1>
            {isLogin ? (
              <>
                SIGN
                <br />
                IN.
              </>
            ) : (
              <>
                CREATE
                <br />
                ACCOUNT.
              </>
            )}
          </h1>

          <p>
            {isLogin
              ? "Sign in to access your MINIMAL account and orders."
              : "Create an account to keep track of your MINIMAL orders."}
          </p>
        </div>

        <form
          className="minimal-auth-form"
          onSubmit={handleSubmit}
        >
          {!isLogin && (
            <div className="minimal-field">
              <label htmlFor="name">
                NAME
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div className="minimal-field">
            <label htmlFor="email">
              EMAIL
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="minimal-field">
            <label htmlFor="password">
              PASSWORD
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="minimal-auth-submit"
            disabled={loading}
          >
            {loading
              ? "PLEASE WAIT..."
              : isLogin
                ? "SIGN IN"
                : "CREATE ACCOUNT"}

            <span>→</span>
          </button>

          {error && (
            <p className="minimal-auth-message error">
              {error}
            </p>
          )}

          {message && (
            <p className="minimal-auth-message success">
              {message}
            </p>
          )}
        </form>

        <div className="minimal-auth-switch">
          <span>
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? "signup" : "login");
              setError("");
              setMessage("");
            }}
          >
            {isLogin
              ? "CREATE ACCOUNT"
              : "SIGN IN"}
          </button>
        </div>

        <Link
          to="/"
          className="minimal-auth-back"
        >
          ← BACK TO SHOP
        </Link>

      </div>
    </div>
  );
}