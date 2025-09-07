import React from 'react';
import useSwipeNavigation from '../hooks/useSwipeNavigation';
import { useAuth } from '../store/useAuth';

const SwipeableContent = ({ children, className = '', style = {} }) => {
  const { user } = useAuth();
  const isAdminUser = user?.userType === 'Admin' || user?.subscription === 'Admin';
  
  // Initialize swipe navigation
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    isSwipeActive
  } = useSwipeNavigation(['Amazon', 'Electricity', 'Bill Optimizer', 'Analytics'], isAdminUser);

  return (
    <div
      className={className}
      style={{
        ...style,
        position: 'relative',
        touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal swipes
        userSelect: 'none', // Prevent text selection during swipe
        minHeight: '100%'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Swipe indicator overlay */}
      {isSwipeActive && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--primary-bg)',
            color: 'var(--primary-text)',
            padding: '12px 24px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'none',
            animation: 'pulse 0.5s ease-in-out'
          }}
        >
          ← Swipe to navigate →
        </div>
      )}
      
      {children}
    </div>
  );
};

export default SwipeableContent;