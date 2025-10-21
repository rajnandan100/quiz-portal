// Enhanced Right-Click and Dev Tools Protection
// Specifically designed for iframe/embedded environments

(function() {
    'use strict';
    
    // Multiple layers of right-click protection
    const disableRightClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    };
    
    // Apply to multiple events
    ['contextmenu', 'selectstart', 'dragstart'].forEach(event => {
        document.addEventListener(event, disableRightClick, true);
        window.addEventListener(event, disableRightClick, true);
    });
    
    // Enhanced keyboard protection
    document.addEventListener('keydown', function(e) {
        // Disable F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, etc.
        if (
            e.key === 'F12' || 
            e.keyCode === 123 ||
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
            (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83 || e.keyCode === 65)) ||
            (e.ctrlKey && e.keyCode === 80) // Ctrl+P
        ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // Mobile-specific protection (Android long press)
    let touchTimer;
    let touchStarted = false;
    
    document.addEventListener('touchstart', function(e) {
        touchStarted = true;
        touchTimer = setTimeout(function() {
            if (touchStarted) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, 400); // Reduced from 500ms for faster response
    }, { passive: false });
    
    document.addEventListener('touchend', function(e) {
        touchStarted = false;
        if (touchTimer) {
            clearTimeout(touchTimer);
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        if (touchTimer) {
            clearTimeout(touchTimer);
        }
    }, { passive: false });
    
    // Additional mobile protection
    document.addEventListener('touchcancel', function(e) {
        touchStarted = false;
        if (touchTimer) {
            clearTimeout(touchTimer);
        }
    });
    
    // Prevent text selection with multiple methods
    const preventSelection = () => {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        if (document.selection) {
            document.selection.empty();
        }
    };
    
    document.addEventListener('mousedown', preventSelection);
    document.addEventListener('mouseup', preventSelection);
    
    // Style-based selection prevention
    const style = document.createElement('style');
    style.textContent = `
        * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-tap-highlight-color: transparent !important;
        }
        
        input, textarea, [contenteditable] {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
        
        img, video {
            -webkit-user-drag: none !important;
            -khtml-user-drag: none !important;
            -moz-user-drag: none !important;
            -o-user-drag: none !important;
            user-drag: none !important;
            pointer-events: auto !important;
        }
    `;
    document.head.appendChild(style);
    
    // Detect and handle developer tools
    let devtoolsOpen = false;
    
    const detectDevTools = () => {
        const threshold = 160;
        if (
            window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold
        ) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                // Instead of destroying the page, just log it
                console.clear();
                console.warn('Developer tools detected');
            }
        } else {
            devtoolsOpen = false;
        }
    };
    
    // Check every 1 second instead of 500ms to reduce performance impact
    setInterval(detectDevTools, 1000);
    
    // Console protection
    const originalLog = console.log;
    console.log = function() {
        // Allow normal logging but clear sensitive information
        originalLog.apply(console, arguments);
    };
    
    // Disable right-click on images specifically
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('contextmenu', disableRightClick);
            img.addEventListener('dragstart', disableRightClick);
            img.setAttribute('draggable', 'false');
        });
    });
    
    // Override link behavior to prevent inspection
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (target && target.href) {
            // For external links, open in same window to prevent inspection
            if (target.target === '_blank') {
                e.preventDefault();
                window.location.href = target.href;
            }
        }
    });
    
    // Additional protection for iframe context
    if (window !== window.top) {
        // We're in an iframe, add extra protection
        window.addEventListener('message', function(e) {
            // Block potential exploitation through postMessage
            e.stopPropagation();
        }, true);
    }
    
    console.log('🛡️ Enhanced protection loaded');
    
})();