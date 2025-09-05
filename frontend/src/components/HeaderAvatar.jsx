import React from "react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../store/useAuth";
import { Link } from "react-router-dom";
import { useTheme } from "../store/useTheme";
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'

export default function HeaderAvatar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
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
      <button className="muted avatar" onClick={() => setOpen((v) => !v)}>
        {user?.avatarUrl && !imgError ? (
          <img 
            src={user.avatarUrl} 
            alt="Avatar" 
            onError={()=> setImgError(true)} 
            style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '2px solid var(--panel-bg)'
            }} 
          />
        ) : (
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--avatar-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: '700',
            color: 'var(--text)',
            border: '2px solid var(--panel-bg)'
          }}>
            {letter}
          </div>
        )}
      </button>
      {open && (
        <div className="profile-menu panel" style={{ position:'absolute', right:0, top:'calc(100% + 8px)', minWidth:200, zIndex:1000 }}>
          <Link to="/account" onClick={() => setOpen(false)} style={itemStyle}>
            View Profile
          </Link>
          <button
            className="muted"
            onClick={()=> setTheme(theme==='light' ? 'dark' : theme==='dark' ? 'system' : 'light')}
            style={{display:'flex',alignItems:'center',gap:8,margin:'8px 12px'}}
            aria-label={`Theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}. Click to change.`}
          >
            {theme==='light' ? <FiSun/> : theme==='dark' ? <FiMoon/> : <FiMonitor/>}
            Theme: {theme}
          </button>
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
