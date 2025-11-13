## Project Structure

```
/
├── index.html          # Main HTML entry point
├── script.js           # JavaScript logic (XMLProcessor, UIController)
├── styles.css          # CSS styling with CSS variables
├── favicon.ico         # Site favicon
├── README.md           # Project documentation (Chinese)
├── LICENSE             # MIT License
└── .kiro/
    └── steering/       # AI assistant steering rules
```

### File Organization

**index.html**
- Single-page application structure
- Google Analytics integration
- Accessibility attributes (role, aria-live, aria-label)
- Chinese language (lang="zh")

**script.js**
- `XMLProcessor` class: Static methods for XML parsing, formatting, and compression
- `UIController` class: Manages DOM interactions, error handling, and UI state
- Global event handlers: `formatXML()`, `compressXML()`, `copyText()`
- Debouncing applied to button clicks (300-400ms)

**styles.css**
- CSS custom properties (variables) for theming
- Mobile-first responsive design with media queries
- Auto-resizing textarea (no manual resize)
- Toast notification system
- Modern design with shadows and transitions

### Code Conventions

- **Indentation**: 4 spaces (both in code and XML output)
- **Language**: Chinese for UI text and comments
- **Naming**: camelCase for JavaScript, kebab-case for CSS classes
- **Error messages**: User-friendly Chinese messages via toast notifications
- **Performance**: Warnings for files >100k characters
