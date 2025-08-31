import React from "react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../store/useAuth";
import { Link } from "react-router-dom";
import { useTheme } from "../store/useTheme";

export default function HeaderAvatar() {
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
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
        >
          <Link to="/account" onClick={() => setOpen(false)} style={itemStyle}>
            View Profile
          </Link>
          <div style={{padding:'8px 12px'}}>
            <div style={{fontSize:12,opacity:.8,marginBottom:6}}>Theme</div>
            <div style={{display:'flex',gap:6}}>
              <button className="muted" onClick={()=> setTheme('light')}>Light</button>
              <button className="muted" onClick={()=> setTheme('dark')}>Dark</button>
              <button className="muted" onClick={()=> setTheme('system')}>System</button>
            </div>
          </div>
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
