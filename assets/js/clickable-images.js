// Disable image zoom and make blog post images clickable to navigate to post
document.addEventListener('DOMContentLoaded', function() {
    
    // Disable all image zoom functionality
    function disableImageZoom() {
        // Remove zoom-related classes and attributes from all images
        const allImages = document.querySelectorAll('img');
        allImages.forEach(img => {
            img.removeAttribute('data-zoomable');
            img.classList.remove('zoomable');
            img.style.cursor = 'default';
        });
        
        // Disable any existing zoom event listeners
        const zoomableImages = document.querySelectorAll('[data-zoomable], .zoomable');
        zoomableImages.forEach(img => {
            img.replaceWith(img.cloneNode(true));
        });
    }
    
    // Run immediately and after a delay to catch dynamically loaded content
    disableImageZoom();
    setTimeout(disableImageZoom, 100);
    setTimeout(disableImageZoom, 500);
    
    // Make blog post card images clickable for navigation
    function makeImagesClickable() {
        // Find all blog post cards/articles
        const articleCards = document.querySelectorAll('.article-card, .card, [class*="article"]');
        
        articleCards.forEach(card => {
            const image = card.querySelector('img');
            const link = card.querySelector('a[href]');
            
            if (image && link && !image.hasAttribute('data-post-clickable')) {
                // Mark as processed
                image.setAttribute('data-post-clickable', 'true');
                
                // Get the post URL from the link
                const postUrl = link.getAttribute('href');
                
                // Only make clickable if it's a post/article URL
                if (postUrl && (postUrl.includes('/posts/') || postUrl.includes('/articles/') || postUrl.startsWith('/'))) {
                    // Remove any zoom functionality
                    image.removeAttribute('data-zoomable');
                    image.classList.remove('zoomable');
                    image.style.cursor = 'pointer';
                    
                    // Add click event with highest priority
                    image.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        window.location.href = postUrl;
                    }, true); // Use capture phase for highest priority
                    
                    // Also handle the image container
                    const imageContainer = image.closest('.thumbnail, .customthumb, .featured-image');
                    if (imageContainer) {
                        imageContainer.style.cursor = 'pointer';
                        imageContainer.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            window.location.href = postUrl;
                        }, true);
                    }
                }
            }
        });
    }
    
    // Run image clickable setup
    makeImagesClickable();
    
    // Re-run after any dynamic content loads
    setTimeout(makeImagesClickable, 200);
    
    // Observe for dynamically added content
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                disableImageZoom();
                makeImagesClickable();
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('Image zoom disabled and blog post images made clickable');
});