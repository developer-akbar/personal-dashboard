import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import HeaderAvatar from './HeaderAvatar';

export default function GlobalHeader({ title = "Personal Dashboard", showBackButton = false, onBackClick, children }) {
  const location = useLocation();
  
  // For Bill Optimizer and Analytics tabs, show just the project title
  const isTabPage = location.pathname === '/bill-optimizer' || location.pathname === '/admin';
  const displayTitle = isTabPage ? "Personal Dashboard" : title;
  const showBack = showBackButton && !isTabPage;

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
      {showBack && (
        <button className="muted" onClick={handleBackClick}>
          ←
        </button>
      )}
      <h2 style={{ margin: 0 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          {displayTitle}
        </Link>
      </h2>
      <div className="spacer" />
      {children || <HeaderAvatar />}
    </header>
  );
}