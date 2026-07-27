# Family Tree of Prophet Muhammad ﷺ

A production-ready, data-driven, interactive web application showcasing the genealogy, noble family tree, and historical biographies of Prophet Muhammad ﷺ.

Built with **Pure HTML, CSS, and Vanilla JavaScript** — 100% compatible with **GitHub Pages** and static web hosting.

---

## 🌟 Key Features

### 🌳 Interactive Family Tree (`index.html`)
- **Centrally Focused**: Starts from Prophet Muhammad ﷺ with parents, spouses, children, grandchildren, and ancestors mapped in logical generational tiers.
- **Interactive Controls**:
  - **Pan**: Click and drag to navigate the family tree.
  - **Zoom**: Scroll wheel or `+` / `−` / `Reset` controls.
  - **Lineage Path Highlighting**: Click or hover over any node to highlight the connecting path from Prophet Muhammad ﷺ with animated SVG lines.
  - **Clickable Cards**: Clicking any node opens `person.html?id=person-id`.
- **Live Search**: Real-time search by name, title, or alias with instant dropdown filtering.

### 📜 Person Biography & Lineage View (`person.html`)
- **Dynamic URL Routing**: Reads `?id=person-id` query parameters.
- **Interactive Breadcrumb Path**: Shows the direct lineage chain from Prophet Muhammad ﷺ down to the selected person (e.g. `Muhammad ﷺ > Fatimah (RA) > Ali (RA) > Hasan (RA)`).
- **Rich Biographical Details**:
  - Full Name, Honorific Titles, Gender, Key Dates (Birth, Passing, Burial).
  - Detailed Biography and historical context.
  - **Chronological Life Events & Timeline**.
  - **Historical References & Citations**.
  - **Clickable Family Relationships**: Parents, Spouses, Children, and Siblings chips.

### ⚙️ Integrated Visual Admin Panel (`admin.html`)
- **Password Protection**: Configurable password in `assets/js/config.js` (default: `admin`).
- **Visual Management (No Raw JSON Editing)**:
  - **People Registry & Dashboard**: Overview stats, search, and filtering.
  - **Add & Edit Forms**: Name, Title, Gender, Dates, Biography, Aliases, Notes.
  - **Auto-generated Slug IDs**.
  - **Dynamic Relationship Dropdowns & Multi-Select Checklist**: Automatically populated from existing people in the database.
  - **Dynamic Timeline Editor**: Add/remove year and event pairs.
  - **Dynamic Reference Editor**: Add/remove title and source pairs.
  - **Live Tree Card Preview**: Real-time preview of how the node card looks as you edit.
  - **Safe Deletion**: Deleting a record warns the admin and automatically cleans up references across all other family members.
  - **JSON Management**: In-memory editing, 1-click **Export family.json**, and **Import family.json** with schema validation.

---

## 📁 Project Folder Structure

```
/
├── index.html              # Main interactive family tree view
├── person.html             # Detailed biography and lineage page
├── admin.html              # Visual administrative panel
├── server.ts               # Preview host Express server
├── vite.config.ts          # Vite multi-page configuration
├── package.json            # Node & build dependencies
├── metadata.json           # Application metadata
├── data/
│   └── family.json         # Master dataset for all family members
├── assets/
│   ├── css/
│   │   └── style.css       # Global CSS & Tailwind configuration
│   └── js/
│       ├── config.js       # Admin password & site configuration
│       ├── utils.js        # Shared helpers, data loader, & validators
│       ├── tree.js         # Canvas SVG tree renderer (Pan, Zoom, Highlight)
│       ├── app.js          # Home page tree controller
│       ├── person.js       # Person view controller & breadcrumbs
│       └── admin.js        # Admin panel visual form controller
└── README.md               # Project documentation
```

---

## 🎨 Design System

- **Background**: `#fafafa`
- **Cards**: White `#ffffff`, `18px` rounded corners, soft shadow, subtle border.
- **Accent Color**: Deep Emerald `#14532d`
- **Typography**: Inter
- **Aesthetic**: Minimal, clean, high-contrast, no gradients, no glassmorphism.

---

## 🚀 GitHub Pages Deployment

Because the core application uses pure HTML, CSS, and Vanilla JS, it can be hosted directly on GitHub Pages:

1. Push this repository to GitHub.
2. Go to **Settings > Pages** in your GitHub repository.
3. Select **Source: Deploy from a branch** (`main` / `root`).
4. Save — your family tree app will be live instantly!

---

## 📜 License & Usage

© 2026 Family Tree of Prophet Muhammad ﷺ
Educational Purpose Only
