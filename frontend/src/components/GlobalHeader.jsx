import React from 'react';
import { Link } from 'react-router-dom';
import HeaderAvatar from './HeaderAvatar';

export default function GlobalHeader({ title = "Personal Dashboard", showBackButton = false, onBackClick, children }) {
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      try {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.hash = '#/';
        }
      } catch {
        window.location.hash = '#/';
      }
    }
  };

  return (
    <header className="topbar">
      {showBackButton && (
        <button className="muted" onClick={handleBackClick}>
          ←
        </button>
      )}
      <h2 style={{ margin: 0 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          {title}
        </Link>
      </h2>
      <div className="spacer" />
      {children || <HeaderAvatar />}
    </header>
  );
}