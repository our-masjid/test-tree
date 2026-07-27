/**
 * Interactive Family Tree Renderer
 * Pure Vanilla JS with SVG connecting lines, Zoom, Pan, Expand/Collapse & Lineage Highlighting
 */

class FamilyTree {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = options;
    this.peopleMap = new Map();
    this.expandedNodes = new Set(); // Track expanded node IDs
    this.highlightedPath = new Set();
    this.selectedPersonId = null;

    // Viewport transform state for Zoom & Pan
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.container.classList.add('relative', 'overflow-hidden', 'w-full', 'h-full', 'bg-[#fafafa]', 'select-none', 'cursor-grab');
    
    // Viewport wrapper for pan/zoom
    this.viewport = document.createElement('div');
    this.viewport.className = 'absolute top-0 left-0 transition-transform duration-75 ease-out';
    this.viewport.style.transformOrigin = '0 0';
    this.viewport.style.width = '3000px';
    this.viewport.style.height = '2400px';

    // SVG canvas for connecting line links
    this.svgCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgCanvas.setAttribute('class', 'absolute inset-0 w-full h-full pointer-events-none');
    this.svgCanvas.style.zIndex = '1';

    // SVG Defs for glowing line markers / gradients
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#14532d" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#16a34a" stop-opacity="0.6" />
      </linearGradient>
      <linearGradient id="lineGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#15803d" />
        <stop offset="100%" stop-color="#22c55e" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;
    this.svgCanvas.appendChild(defs);

    // HTML Container for node cards
    this.nodesContainer = document.createElement('div');
    this.nodesContainer.className = 'absolute inset-0 pointer-events-none';
    this.nodesContainer.style.zIndex = '2';

    this.viewport.appendChild(this.svgCanvas);
    this.viewport.appendChild(this.nodesContainer);
    this.container.appendChild(this.viewport);
  }

  bindEvents() {
    // Pan via Mouse dragging
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.person-card') || e.target.closest('.tree-btn')) return;
      this.isDragging = true;
      this.container.classList.replace('cursor-grab', 'cursor-grabbing');
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.applyTransform();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.container.classList.replace('cursor-grabbing', 'cursor-grab');
      }
    });

    // Touch support for Pan
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && !e.target.closest('.person-card')) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        this.panX = e.touches[0].clientX - this.startX;
        this.panY = e.touches[0].clientY - this.startY;
        this.applyTransform();
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Scroll wheel Zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      this.setZoom(this.zoom * delta, e.clientX, e.clientY);
    }, { passive: false });
  }

  setZoom(newZoom, originX = null, originY = null) {
    const minZoom = 0.4;
    const maxZoom = 1.8;
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

    if (originX !== null && originY !== null) {
      const rect = this.container.getBoundingClientRect();
      const mouseX = originX - rect.left;
      const mouseY = originY - rect.top;

      // Adjust pan to zoom towards mouse cursor
      this.panX = mouseX - (mouseX - this.panX) * (clampedZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (clampedZoom / this.zoom);
    }

    this.zoom = clampedZoom;
    this.applyTransform();
  }

  applyTransform() {
    this.viewport.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  resetView(targetId = null) {
    const focusId = targetId || this.selectedPersonId || 'muhammad';
    const rect = this.container ? this.container.getBoundingClientRect() : null;
    const width = (rect && rect.width > 0) ? rect.width : window.innerWidth || 1200;
    const height = (rect && rect.height > 0) ? rect.height : window.innerHeight || 700;

    // Responsive zoom scale based on container size
    if (width < 640) {
      this.zoom = 0.65;
    } else if (width < 1024) {
      this.zoom = 0.75;
    } else {
      this.zoom = 0.85;
    }

    // Default target coordinate (Prophet Muhammad)
    let targetX = 1200;
    let targetY = 620;

    if (this.nodePositions && this.nodePositions.has(focusId)) {
      const pos = this.nodePositions.get(focusId);
      targetX = pos.x;
      targetY = pos.y;
    }

    // Exact mathematical pan to center target coordinate in the viewport
    this.panX = (width / 2) - (targetX * this.zoom);
    this.panY = (height * 0.42) - (targetY * this.zoom);

    this.applyTransform();
  }

  render(data, selectedId = 'muhammad') {
    if (!data || !data.people) return;

    this.peopleMap = new Map(data.people.map(p => [p.id, p]));
    this.selectedPersonId = selectedId || 'muhammad';

    // By default, expand key generations
    if (this.expandedNodes.size === 0) {
      this.expandedNodes.add('muhammad');
      this.expandedNodes.add('abdullah');
      this.expandedNodes.add('aminah');
      this.expandedNodes.add('khadijah');
      this.expandedNodes.add('fatimah');
      this.expandedNodes.add('ali');
    }

    // Calculate highlighted lineage path
    if (this.selectedPersonId) {
      const pathArray = window.Utils.computeLineagePath(this.selectedPersonId);
      this.highlightedPath = new Set(pathArray);
    } else {
      this.highlightedPath.clear();
    }

    // Build generational tree structure
    this.nodesContainer.innerHTML = '';
    // Clear SVG connections
    const paths = this.svgCanvas.querySelectorAll('path');
    paths.forEach(p => p.remove());

    this.layoutAndRenderTree();
    this.applyTransform();
  }

  layoutAndRenderTree() {
    const rootId = 'muhammad';
    const root = this.peopleMap.get(rootId);
    if (!root) return;

    // Define Generational Row Coordinates
    // Row 0: Grandparents (Y: 100)
    // Row 1: Parents & Uncles (Y: 340)
    // Row 2: Prophet Muhammad & Spouses (Y: 620)
    // Row 3: Children (Y: 960)
    // Row 4: Grandchildren (Y: 1300)

    const positions = new Map();

    // 1. Center Prophet Muhammad at (X: 1200, Y: 620)
    const centerX = 1200;
    positions.set('muhammad', { x: centerX, y: 620, tier: 2 });

    // 2. Position Spouses in a clean row around Prophet
    const spouses = (root.spouses || []).filter(id => this.peopleMap.has(id));
    const spouseCardWidth = 190;
    const spouseGap = 20;

    // Place Khadijah close to Prophet on the left, Aisha on right
    let leftX = centerX - 240;
    let rightX = centerX + 240;

    spouses.forEach((spId, idx) => {
      if (spId === 'khadijah') {
        positions.set(spId, { x: centerX - 230, y: 620, tier: 2 });
      } else if (spId === 'aisha') {
        positions.set(spId, { x: centerX + 230, y: 620, tier: 2 });
      } else {
        if (idx % 2 === 0) {
          leftX -= (spouseCardWidth + spouseGap);
          positions.set(spId, { x: leftX, y: 620, tier: 2 });
        } else {
          rightX += (spouseCardWidth + spouseGap);
          positions.set(spId, { x: rightX, y: 620, tier: 2 });
        }
      }
    });

    // 3. Parents & Uncles (Y: 340)
    const fatherId = root.father; // abdullah
    const motherId = root.mother; // aminah
    if (fatherId) positions.set(fatherId, { x: centerX - 140, y: 340, tier: 1 });
    if (motherId) positions.set(motherId, { x: centerX + 140, y: 340, tier: 1 });

    // Uncles & Aunts around parents
    const uncles = ['abu-talib', 'hamza', 'abbas', 'abu-lahab', 'safiyyah-bint-abdul-muttalib'];
    let uncleLeft = centerX - 420;
    let uncleRight = centerX + 420;
    uncles.forEach((uId, idx) => {
      if (this.peopleMap.has(uId)) {
        if (idx % 2 === 0) {
          positions.set(uId, { x: uncleLeft, y: 340, tier: 1 });
          uncleLeft -= 220;
        } else {
          positions.set(uId, { x: uncleRight, y: 340, tier: 1 });
          uncleRight += 220;
        }
      }
    });

    // 4. Grandparents (Y: 100)
    if (fatherId && this.peopleMap.has(fatherId)) {
      const father = this.peopleMap.get(fatherId);
      if (father.father) positions.set(father.father, { x: centerX - 260, y: 100, tier: 0 }); // abdul-muttalib
      if (father.mother) positions.set(father.mother, { x: centerX - 40, y: 100, tier: 0 });  // fatimah-bint-amr
    }
    if (motherId && this.peopleMap.has(motherId)) {
      const mother = this.peopleMap.get(motherId);
      if (mother.father) positions.set(mother.father, { x: centerX + 180, y: 100, tier: 0 }); // wahb
    }

    // 5. Children & Spouses of Children (Y: 960)
    const children = (root.children || []).filter(id => this.peopleMap.has(id));
    const totalChildren = children.length;
    const childWidth = 240;
    const totalWidth = totalChildren * childWidth;
    let startChildX = centerX - (totalWidth / 2) + (childWidth / 2);

    children.forEach((childId, idx) => {
      const x = startChildX + idx * childWidth;
      positions.set(childId, { x: x, y: 960, tier: 3 });

      // Spouses of children (e.g., Ali for Fatimah, Uthman for Ruqayyah/Umm Kulthum)
      const childObj = this.peopleMap.get(childId);
      if (childObj && Array.isArray(childObj.spouses)) {
        childObj.spouses.forEach((spId) => {
          if (!positions.has(spId) && this.peopleMap.has(spId)) {
            positions.set(spId, { x: x + 180, y: 960, tier: 3 });
          }
        });
      }
    });

    // 6. Grandchildren (Y: 1300)
    // Children of Fatimah & Ali, Ruqayyah, Zainab
    let grandChildX = centerX - 360;
    const grandchildren = ['hasan', 'husayn', 'muhsin', 'zainab-bint-ali', 'umm-kulthum-bint-ali', 'ali-ibn-abu-al-as', 'umamah', 'abdullah-ibn-uthman'];
    grandchildren.forEach(gcId => {
      if (this.peopleMap.has(gcId)) {
        positions.set(gcId, { x: grandChildX, y: 1300, tier: 4 });
        grandChildX += 210;
      }
    });

    // Any remaining people not yet assigned positions
    let overflowX = 200;
    this.peopleMap.forEach((person, id) => {
      if (!positions.has(id)) {
        positions.set(id, { x: overflowX, y: 1600, tier: 5 });
        overflowX += 220;
      }
    });

    // Save positions map on instance
    this.nodePositions = positions;

    // Render Cards & Connectors
    positions.forEach((pos, personId) => {
      const person = this.peopleMap.get(personId);
      if (!person) return;

      this.renderPersonCard(person, pos.x, pos.y);
    });

    // Draw lines after cards are positioned
    positions.forEach((pos, personId) => {
      const person = this.peopleMap.get(personId);
      if (!person) return;

      // Draw Father link
      if (person.father && positions.has(person.father)) {
        const fatherPos = positions.get(person.father);
        this.drawConnection(fatherPos, pos, personId, person.father, 'parent-child');
      }

      // Draw Mother link
      if (person.mother && positions.has(person.mother)) {
        const motherPos = positions.get(person.mother);
        this.drawConnection(motherPos, pos, personId, person.mother, 'parent-child');
      }

      // Draw Spouse links (only draw once per couple to avoid double lines)
      if (Array.isArray(person.spouses)) {
        person.spouses.forEach(spId => {
          if (positions.has(spId) && personId < spId) { // simple string compare ensures single draw
            const spousePos = positions.get(spId);
            this.drawConnection(pos, spousePos, personId, spId, 'spouse');
          }
        });
      }
    });
  }

  renderPersonCard(person, x, y) {
    const isSelected = this.selectedPersonId === person.id;
    const isHighlighted = this.highlightedPath.has(person.id);
    const isRoot = person.id === 'muhammad';

    const card = document.createElement('div');
    card.id = `node-${person.id}`;
    card.className = `person-card pointer-events-auto absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group`;
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.width = isRoot ? '220px' : '190px';

    const activeBorder = isSelected 
      ? 'ring-4 ring-emerald-600 border-emerald-600 shadow-xl scale-105 z-30'
      : isHighlighted 
        ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/50 z-20' 
        : 'border-slate-200 hover:border-emerald-500 hover:shadow-lg z-10';

    const avatarSvg = window.Utils.getAvatarSvg(person);

    card.innerHTML = `
      <div class="bg-white rounded-[18px] p-3 border ${activeBorder} transition-all duration-200 relative flex flex-col items-center text-center">
        ${isRoot ? `
          <div class="absolute -top-3 bg-emerald-800 text-white text-[10px] uppercase font-bold px-3 py-0.5 rounded-full shadow-sm tracking-wider flex items-center gap-1">
            <span>✨ Center of Family Tree</span>
          </div>
        ` : ''}

        <!-- Avatar -->
        <div class="w-12 h-12 md:w-14 md:h-14 rounded-full p-0.5 border-2 ${isHighlighted ? 'border-emerald-600' : 'border-emerald-100'} mb-2 overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
          ${avatarSvg}
        </div>

        <!-- Name & Title -->
        <h3 class="text-xs md:text-sm font-bold text-slate-900 line-clamp-1 leading-snug group-hover:text-emerald-800 transition-colors">
          ${window.Utils.escapeHtml(person.name)}
        </h3>

        ${person.title ? `
          <p class="text-[11px] text-emerald-700 font-medium line-clamp-1 mt-0.5">
            ${window.Utils.escapeHtml(person.title)}
          </p>
        ` : ''}

        <!-- Key Dates -->
        <div class="text-[10px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100 w-full flex items-center justify-between px-1">
          <span class="truncate">${person.birth ? window.Utils.escapeHtml(person.birth.split(',')[0]) : ''}</span>
          ${person.death ? `<span class="opacity-40">•</span><span class="truncate">${window.Utils.escapeHtml(person.death.split(',')[0])}</span>` : ''}
        </div>

        <!-- Hover detail hint -->
        <div class="mt-2 text-[10px] text-emerald-800 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <span>View Biography & Details</span>
          <span>→</span>
        </div>
      </div>
    `;

    // Click handler -> Navigate to person page or highlight lineage
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      // If clicked again or holding shift, navigate to person.html
      window.location.href = `person.html?id=${encodeURIComponent(person.id)}`;
    });

    // Hover -> highlight lineage in real-time
    card.addEventListener('mouseenter', () => {
      this.highlightNodeLineage(person.id);
    });

    card.addEventListener('mouseleave', () => {
      this.clearLineageHighlight();
    });

    this.nodesContainer.appendChild(card);
  }

  drawConnection(posA, posB, idA, idB, type = 'parent-child') {
    if (!posA || !posB || typeof posA.x !== 'number' || typeof posB.x !== 'number') return;
    const isHighlighted = this.highlightedPath.has(idA) && this.highlightedPath.has(idB);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    let d = '';
    if (type === 'spouse') {
      // Horizontal connecting line between spouses
      const y = posA.y;
      const x1 = Math.min(posA.x, posB.x) + 95;
      const x2 = Math.max(posA.x, posB.x) - 95;
      d = `M ${x1} ${y} L ${x2} ${y}`;
    } else {
      // Curved vertical line from parent (posA) down to child (posB)
      const startX = posA.x;
      const startY = posA.y + 45;
      const endX = posB.x;
      const endY = posB.y - 45;
      const midY = (startY + endY) / 2;

      d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    }

    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');

    if (isHighlighted) {
      path.setAttribute('stroke', '#16a34a');
      path.setAttribute('stroke-width', '3.5');
      path.setAttribute('filter', 'url(#glow)');
      path.setAttribute('class', 'transition-all duration-300 stroke-dash-active');
    } else {
      path.setAttribute('stroke', type === 'spouse' ? '#cbd5e1' : '#94a3b8');
      path.setAttribute('stroke-width', type === 'spouse' ? '1.5' : '2');
      path.setAttribute('stroke-dasharray', type === 'spouse' ? '4 3' : 'none');
      path.setAttribute('opacity', '0.6');
      path.setAttribute('class', 'transition-all duration-300 hover:opacity-100');
    }

    this.svgCanvas.appendChild(path);
  }

  highlightNodeLineage(nodeId) {
    const pathArray = window.Utils.computeLineagePath(nodeId);
    this.highlightedPath = new Set(pathArray);
    this.refreshLineStyles();
  }

  clearLineageHighlight() {
    if (this.selectedPersonId) {
      const pathArray = window.Utils.computeLineagePath(this.selectedPersonId);
      this.highlightedPath = new Set(pathArray);
    } else {
      this.highlightedPath.clear();
    }
    this.refreshLineStyles();
  }

  refreshLineStyles() {
    this.layoutAndRenderTree();
  }
}

window.FamilyTree = FamilyTree;
