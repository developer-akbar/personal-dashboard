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

  // Check if the target element or its parents have horizontal scrolling
  const hasHorizontalScroll = useCallback((element) => {
    if (!element) return false;
    
    // Check for specific horizontally scrollable elements (more restrictive)
    const scrollableTags = ['table', 'tbody', 'thead', 'tr', 'td', 'th'];
    const scrollableClasses = ['table-container', 'scrollable', 'overflow-x-auto', 'overflow-x-scroll'];
    
    // Check if element is a scrollable table element
    if (scrollableTags.includes(element.tagName?.toLowerCase())) {
      return true;
    }
    
    // Check if element has specific scrollable classes (not just 'table')
    if (element.className && scrollableClasses.some(cls => element.className.includes(cls))) {
      return true;
    }
    
    // Check if element has horizontal scroll AND is specifically designed for horizontal scrolling
    if (element.scrollWidth > element.clientWidth) {
      // Only consider it scrollable if it has overflow-x styles or is a table
      const style = window.getComputedStyle(element);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll' || 
          element.tagName?.toLowerCase() === 'table') {
        return true;
      }
    }
    
    // Check parent elements up to 2 levels (reduced from 3)
    let parent = element.parentElement;
    for (let i = 0; i < 2 && parent; i++) {
      if (scrollableTags.includes(parent.tagName?.toLowerCase())) {
        return true;
      }
      if (parent.className && scrollableClasses.some(cls => parent.className.includes(cls))) {
        return true;
      }
      const parentStyle = window.getComputedStyle(parent);
      if (parent.scrollWidth > parent.clientWidth && 
          (parentStyle.overflowX === 'auto' || parentStyle.overflowX === 'scroll')) {
        return true;
      }
      parent = parent.parentElement;
    }
    
    return false;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    // Check if the touch target has horizontal scrolling
    if (hasHorizontalScroll(e.target)) {
      return; // Don't start swipe detection for horizontally scrollable elements
    }
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwipeActive(true);
  }, [hasHorizontalScroll]);

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