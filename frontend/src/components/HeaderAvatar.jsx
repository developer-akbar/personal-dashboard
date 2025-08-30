import { useState, useRef, useEffect } from "react";
import { useAuth } from "../store/useAuth";
import { Link } from "react-router-dom";

export default function HeaderAvatar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);
  const letter = (user?.name || user?.email || "?").slice(0, 1).toUpperCase();
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="muted avatar"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <span style={{ fontSize: "1rem" }}>{letter}</span>
        
        {/* <span>{user?.name || user?.email}</span> */}
      </button>
      {open && (
        <div className="profile-menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            background: "#0b0b0b",
            border: "1px solid #1f1f1f",
            borderRadius: 12,
            minWidth: 200,
            boxShadow: "0 8px 18px rgba(0,0,0,.25)",
            zIndex: 1000,
          }}
        >
          <Link to="/account" onClick={() => setOpen(false)} style={itemStyle}>
            View Profile
          </Link>
          <Link
            onClick={logout}
            style={{ ...itemStyle, width: "100%", textAlign: "left" }}
          >
            Logout
          </Link>
        </div>
      )}
    </div>
  );
}

const itemStyle = {
  display: "block",
  padding: "10px 12px",
  color: "#eaeaea",
  textDecoration: "none",
  background: "transparent",
  border: 0,
  cursor: "pointer",
};
