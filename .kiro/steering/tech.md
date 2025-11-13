## Technology Stack

### Frontend
- **HTML5** - Semantic markup with accessibility attributes (ARIA)
- **Vanilla JavaScript (ES6+)** - No frameworks or build tools
- **CSS3** - Modern CSS with CSS variables for theming

### Key Libraries
- **DOMParser API** - Native XML parsing
- **Clipboard API** - Copy functionality

### Browser APIs Used
- `DOMParser` for XML validation and parsing
- `navigator.clipboard` for copy operations
- Google Analytics (gtag.js) for tracking

### Code Architecture
- **Class-based design**: `XMLProcessor` for XML operations, `UIController` for UI logic
- **Separation of concerns**: Processing logic separate from UI control
- **Error handling**: Try-catch with user-friendly toast messages

### Development

No build process required. This is a static site that can be opened directly in a browser or served via any web server.

**Testing locally:**
```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js (if http-server is installed)
npx http-server

# Option 3: Open index.html directly in browser
```

### Deployment
Static hosting compatible (GitHub Pages, Netlify, Vercel, etc.)
