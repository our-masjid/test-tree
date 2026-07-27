/**
 * Family Tree Configuration
 * Accessible globally via window.CONFIG
 */
window.CONFIG = {
  // Admin password (configurable for security)
  ADMIN_PASSWORD: "admin",
  
  // Storage key for local memory edits
  STORAGE_KEY: "family_tree_data_v1",
  
  // Default data JSON location
  DATA_PATH: "data/family.json",
  
  // Site metadata
  SITE_NAME: "Family Tree of Prophet Muhammad ﷺ",
  SITE_SUBTITLE: "Interactive Genealogy & Historical Lineage Portal",
  FOOTER_TEXT: "© 2026 Family Tree of Prophet Muhammad ﷺ",
  FOOTER_NOTE: "Educational Purpose Only",
  
  // Root node ID for tree generation
  ROOT_PERSON_ID: "muhammad",
  
  // Design constants
  THEME: {
    ACCENT_COLOR: "#14532d",
    BACKGROUND_COLOR: "#fafafa",
    CARD_BG: "#ffffff",
    BORDER_RADIUS: "18px",
    FONT_FAMILY: "'Inter', system-ui, -apple-system, sans-serif"
  }
};
