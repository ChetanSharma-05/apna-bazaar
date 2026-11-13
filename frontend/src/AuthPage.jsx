import { useState } from "react";
import "./AuthPage.css";

function getErrorText(error) {
  if (Array.isArray(error)) return error.join(" ");
  if (error && typeof error === "object") {
    return Object.values(error).flat().join(" ");
  }
  return error || "The request could not be completed.";
}

function AuthPage({
  mode = "login",
  onModeChange,
  onSuccess,
  onBack,
  resetUid,
  resetToken,
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";

  function switchMode(nextMode) {
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    onModeChange(nextMode);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if ((isRegister || isReset) && password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    if (isReset && (!resetUid || !resetToken)) {
      setMessage("This password reset link is invalid or incomplete.");
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/csrf/", {
        credentials: "same-origin",
      });

      let endpoint;
      let payload;

      if (isForgot) {
        endpoint = "/api/auth/password-reset/";
        payload = { email: email.trim() };
      } else if (isReset) {
        endpoint = `/api/auth/password-reset/${resetUid}/${resetToken}/`;
        payload = { password };
      } else if (isRegister) {
        endpoint = "/api/auth/register/";
        payload = {
          username: username.trim(),
          email: email.trim(),
          password,
        };
      } else {
        endpoint = "/api/auth/login/";
        payload = {
          username: username.trim(),
          password,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorText(result.error));
      }

      if (isForgot) {
        setMessage(
          result.message ||
            "If an account exists for that email, a password reset link will be sent.",
        );
        return;
      }

      if (isReset) {
        setPassword("");
        setConfirmPassword("");
        setMessage("Your password has been reset. You can now sign in.");
        return;
      }

      onSuccess?.(result.user);
    } catch (error) {
      setMessage(error.message || "The request could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  const heading = isRegister
    ? "Join your community"
    : isForgot
      ? "Reset your password"
      : isReset
        ? "Choose a new password"
        : "Welcome back";

  const subtitle = isRegister
    ? "Create an account to share local prices and shop locations."
    : isForgot
      ? "Enter the email address linked to your account. We will send a reset link if an account is found."
      : isReset
        ? "Choose a new password for your account."
        : "Sign in to share prices or view shop locations.";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <button className="auth-back" type="button" onClick={onBack}>
          ← Back to market
        </button>

        <div className="auth-brand">
          <span className="auth-brand-mark">a</span>
          apna bazaar<span>.</span>
        </div>

        <p className="auth-kicker">YOUR NEIGHBOURHOOD MARKET</p>
        <h1>{heading}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {(mode === "login" || isRegister) && (
            <label>
              <span>Username</span>
              <input
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
          )}

          {(isRegister || isForgot) && (
            <label>
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
          )}

          {(mode === "login" || isRegister || isReset) && (
            <label>
              <span>{isReset ? "New password" : "Password"}</span>
              <input
                type="password"
                autoComplete={
                  isReset || isRegister ? "new-password" : "current-password"
                }
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          )}

          {(isRegister || isReset) && (
            <label>
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
          )}

          {mode === "login" && (
            <button
              className="auth-forgot"
              type="button"
              onClick={() => switchMode("forgot")}
            >
              Forgot password?
            </button>
          )}

          {message && (
            <p className="auth-message" role="status" aria-live="polite">
              {message}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : isRegister
                ? "Create account"
                : isForgot
                  ? "Send reset link"
                  : isReset
                    ? "Save new password"
                    : "Sign in"}
          </button>
        </form>

        {!isForgot && !isReset && (
          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to Apna Bazaar?"}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </p>
        )}

        {(isForgot || isReset) && (
          <p className="auth-switch">
            Remembered your password?
            <button type="button" onClick={() => switchMode("login")}>
              Sign in
            </button>
          </p>
        )}
      </section>
    </main>
  );
}

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

export default AuthPage;