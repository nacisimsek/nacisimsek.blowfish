window.addEventListener('load', function() {
    const frame = document.querySelector('#cusdis_thread iframe');
    
    if (frame) {
        frame.onload = function() {
            const resizeObserver = new ResizeObserver(entries => {
                const height = entries[0].target.contentWindow.document.body.scrollHeight;
                frame.style.height = `${height + 50}px`;
            });
            
            resizeObserver.observe(frame);
        };
        
        // Handle dynamic content changes
        window.addEventListener('message', function(e) {
            if (e.data && typeof e.data === 'object' && e.data.type === 'cusdis.resize') {
                frame.style.height = `${e.data.height + 50}px`;
            }
        });
    }
});