import { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useSwipeNavigation = (tabs, isAdmin = false) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const minSwipeDistance = 50; // Minimum distance for a swipe
  const maxVerticalDistance = 100; // Maximum vertical movement to consider it a horizontal swipe

  // Define the order of tabs based on user type
  const getTabOrder = useCallback(() => {
    if (isAdmin) {
      return ['/amazon', '/electricity', '/bill-optimizer', '/admin'];
    }
    return ['/amazon', '/electricity'];
  }, [isAdmin]);

  // Get current tab index
  const getCurrentTabIndex = useCallback(() => {
    const tabOrder = getTabOrder();
    return tabOrder.findIndex(tab => location.pathname === tab);
  }, [location.pathname, getTabOrder]);

  // Navigate to next/previous tab
  const navigateToTab = useCallback((direction) => {
    const tabOrder = getTabOrder();
    const currentIndex = getCurrentTabIndex();
    
    if (currentIndex === -1) return; // Current path not in tab order
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % tabOrder.length;
    } else {
      newIndex = currentIndex === 0 ? tabOrder.length - 1 : currentIndex - 1;
    }
    
    const newPath = tabOrder[newIndex];
    navigate(newPath);
  }, [navigate, getTabOrder, getCurrentTabIndex]);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwipeActive(true);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!isSwipeActive) return;
    
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, [isSwipeActive]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isSwipeActive) return;
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);
    
    // Only process horizontal swipes
    if (Math.abs(deltaX) > minSwipeDistance && deltaY < maxVerticalDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous tab
        navigateToTab('prev');
      } else {
        // Swipe left - go to next tab
        navigateToTab('next');
      }
    }
    
    setIsSwipeActive(false);
  }, [isSwipeActive, navigateToTab]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    setIsSwipeActive(false);
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    isSwipeActive
  };
};

export default useSwipeNavigation;