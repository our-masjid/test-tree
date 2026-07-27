/**
 * Shared Utilities & Data Layer
 */

// Global state cache
window.FamilyState = {
  data: null,
  peopleMap: new Map()
};

/**
 * Load family data from localStorage or fetch from JSON
 */
async function loadFamilyData() {
  const config = window.CONFIG;
  const storageKey = config ? config.STORAGE_KEY : 'family_tree_data_v1';
  const dataPath = config ? config.DATA_PATH : 'data/family.json';

  // Check localStorage first for admin-saved data
  const localSaved = localStorage.getItem(storageKey);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed && Array.isArray(parsed.people) && parsed.people.length > 0) {
        window.FamilyState.data = parsed;
        buildPeopleMap(parsed.people);
        return parsed;
      }
    } catch (e) {
      console.warn("Invalid localStorage data, falling back to JSON file", e);
    }
  }

  // Fetch from JSON file
  try {
    const res = await fetch(dataPath);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    window.FamilyState.data = data;
    buildPeopleMap(data.people || []);
    // Save initial copy to localStorage for seamless live edits
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error("Failed to load family data:", err);
    return { version: "1.0.0", people: [] };
  }
}

/**
 * Build fast lookup map for people
 */
function buildPeopleMap(people) {
  window.FamilyState.peopleMap.clear();
  people.forEach(p => {
    if (p && p.id) {
      window.FamilyState.peopleMap.set(p.id, p);
    }
  });
}

/**
 * Save updated family data to localStorage
 */
function saveFamilyData(data) {
  const config = window.CONFIG;
  const storageKey = config ? config.STORAGE_KEY : 'family_tree_data_v1';
  data.lastUpdated = new Date().toISOString().split('T')[0];
  window.FamilyState.data = data;
  buildPeopleMap(data.people || []);
  localStorage.setItem(storageKey, JSON.stringify(data));
}

/**
 * Reset data back to default family.json
 */
async function resetFamilyData() {
  const config = window.CONFIG;
  const storageKey = config ? config.STORAGE_KEY : 'family_tree_data_v1';
  const dataPath = config ? config.DATA_PATH : 'data/family.json';
  
  localStorage.removeItem(storageKey);
  const res = await fetch(dataPath + '?t=' + Date.now());
  const data = await res.json();
  window.FamilyState.data = data;
  buildPeopleMap(data.people || []);
  localStorage.setItem(storageKey, JSON.stringify(data));
  return data;
}

/**
 * Get person by ID
 */
function getPersonById(id) {
  if (!id) return null;
  return window.FamilyState.peopleMap.get(id) || null;
}

/**
 * Search people by query string across name, title, and aliases
 */
function searchPeople(query, peopleList) {
  const people = peopleList || (window.FamilyState.data ? window.FamilyState.data.people : []);
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  return people.filter(p => {
    const nameMatch = p.name && p.name.toLowerCase().includes(q);
    const titleMatch = p.title && p.title.toLowerCase().includes(q);
    const aliasMatch = p.aliases && p.aliases.some(a => a.toLowerCase().includes(q));
    const notesMatch = p.notes && p.notes.toLowerCase().includes(q);
    return nameMatch || titleMatch || aliasMatch || notesMatch;
  });
}

/**
 * Compute lineage path from Prophet Muhammad ﷺ down or up to target person
 */
function computeLineagePath(targetId) {
  const rootId = "muhammad";
  const map = window.FamilyState.peopleMap;
  if (!map.has(targetId)) return [rootId];
  if (targetId === rootId) return [rootId];

  // BFS to find shortest relationship path from root to target
  const queue = [[rootId]];
  const visited = new Set([rootId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];

    if (currentId === targetId) {
      return path;
    }

    const current = map.get(currentId);
    if (!current) continue;

    // Collect related IDs: children, spouses, parents
    const relatives = [];
    if (Array.isArray(current.children)) relatives.push(...current.children);
    if (Array.isArray(current.spouses)) relatives.push(...current.spouses);
    if (current.father) relatives.push(current.father);
    if (current.mother) relatives.push(current.mother);

    for (const relId of relatives) {
      if (!visited.has(relId) && map.has(relId)) {
        visited.add(relId);
        queue.push([...path, relId]);
      }
    }
  }

  return [rootId, targetId];
}

/**
 * Validate imported JSON schema
 */
function validateFamilyJSON(jsonObj) {
  if (typeof jsonObj !== 'object' || jsonObj === null) {
    return { valid: false, error: "JSON must be an object." };
  }
  if (!Array.isArray(jsonObj.people)) {
    return { valid: false, error: "JSON object must contain a 'people' array." };
  }
  
  for (let i = 0; i < jsonObj.people.length; i++) {
    const p = jsonObj.people[i];
    if (!p.id || typeof p.id !== 'string') {
      return { valid: false, error: `Item at index ${i} is missing a valid 'id' string.` };
    }
    if (!p.name || typeof p.name !== 'string') {
      return { valid: false, error: `Person '${p.id}' is missing a 'name' string.` };
    }
  }

  return { valid: true, error: null };
}

/**
 * Generate slug ID from person name
 */
function generateSlug(name) {
  if (!name) return 'person-' + Date.now();
  return name
    .toLowerCase()
    .replace(/[ﷺ(ra)â€]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Generate clean Avatar SVG string if no image URL is provided
 */
function getAvatarSvg(person) {
  if (person && person.image && person.image.trim() !== "") {
    return `<img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.name)}" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null; this.outerHTML=getAvatarSvgFallback('${escapeHtml(person.name)}', '${person.gender}');" />`;
  }
  return getAvatarSvgFallback(person ? person.name : 'Unknown', person ? person.gender : 'male');
}

function getAvatarSvgFallback(name, gender) {
  const initials = getInitials(name);
  const isFemale = gender === 'female';
  const bgGradient = isFemale 
    ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' 
    : 'linear-gradient(135deg, #14532d 0%, #15803d 100%)';
    
  return `
    <div class="w-full h-full rounded-full flex items-center justify-center text-white font-bold tracking-wider shadow-inner select-none"
         style="background: ${bgGradient};">
      <span class="text-sm md:text-base opacity-95">${escapeHtml(initials)}</span>
    </div>
  `;
}

function getInitials(name) {
  if (!name) return "P";
  const clean = name.replace(/[ﷺ(RA)]/gi, '').trim();
  const words = clean.split(/\s+/).filter(w => w.length > 0 && !['ibn', 'bint', 'al', 'al-', 'al-'].includes(w.toLowerCase()));
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return "P";
}

/**
 * HTML Escaper to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely remove a person ID from all other people's relationships
 */
function cleanOrphanRelationships(deletedId, peopleList) {
  peopleList.forEach(p => {
    if (p.father === deletedId) p.father = "";
    if (p.mother === deletedId) p.mother = "";
    if (Array.isArray(p.spouses)) {
      p.spouses = p.spouses.filter(id => id !== deletedId);
    }
    if (Array.isArray(p.children)) {
      p.children = p.children.filter(id => id !== deletedId);
    }
    if (Array.isArray(p.siblings)) {
      p.siblings = p.siblings.filter(id => id !== deletedId);
    }
  });
}

// Export utilities
window.Utils = {
  loadFamilyData,
  saveFamilyData,
  resetFamilyData,
  getPersonById,
  searchPeople,
  computeLineagePath,
  validateFamilyJSON,
  generateSlug,
  getAvatarSvg,
  getAvatarSvgFallback,
  getInitials,
  escapeHtml,
  cleanOrphanRelationships
};
