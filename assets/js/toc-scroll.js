// Enhanced TOC Scrolling for Chrome Compatibility
document.addEventListener('DOMContentLoaded', function() {
    const toc = document.getElementById('TOCView');
    
    if (!toc) return;
    
    // Force enable independent scrolling
    toc.style.position = 'sticky';
    toc.style.top = '160px';
    toc.style.maxHeight = 'calc(100vh - 200px)';
    toc.style.overflowY = 'auto';
    toc.style.overflowX = 'hidden';
    toc.style.overscrollBehavior = 'contain';
    toc.style.webkitOverflowScrolling = 'touch';
    
    // Ensure smooth scrolling within TOC
    toc.addEventListener('scroll', function(e) {
        e.stopPropagation();
    }, { passive: true });
    
    // Prevent TOC scroll from affecting page scroll
    let isScrollingTOC = false;
    
    toc.addEventListener('mouseenter', function() {
        document.body.style.overflow = 'hidden';
        isScrollingTOC = true;
    });
    
    toc.addEventListener('mouseleave', function() {
        document.body.style.overflow = '';
        isScrollingTOC = false;
    });
    
    // Handle wheel events specifically for the TOC
    toc.addEventListener('wheel', function(e) {
        e.stopPropagation();
        
        const isAtTop = toc.scrollTop === 0;
        const isAtBottom = toc.scrollTop >= (toc.scrollHeight - toc.offsetHeight);
        
        // Allow scrolling within TOC bounds
        if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
            e.preventDefault();
            toc.scrollTop += e.deltaY;
        }
    }, { passive: false });
    
    console.log('Enhanced TOC scrolling initialized for Chrome');
});