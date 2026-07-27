/**
 * Home Page App Controller
 */

let treeInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Load family dataset
  const data = await window.Utils.loadFamilyData();

  // Instantiate Interactive Tree
  treeInstance = new window.FamilyTree('family-tree-canvas');
  
  // Check if URL has ?highlight=person-id or ?id=person-id
  const urlParams = new URLSearchParams(window.location.search);
  const initialFocus = urlParams.get('highlight') || urlParams.get('id') || 'muhammad';

  treeInstance.render(data, initialFocus);
  
  // Ensure container dimensions are painted before measuring and centering view
  requestAnimationFrame(() => {
    setTimeout(() => {
      treeInstance.resetView(initialFocus);
    }, 50);
  });

  // Handle window resize dynamically
  window.addEventListener('resize', () => {
    if (treeInstance) {
      treeInstance.resetView(treeInstance.selectedPersonId || 'muhammad');
    }
  });

  // Bind Tree Navigation Buttons
  bindTreeControls();

  // Setup Live Search
  setupHomeSearch();
});

function bindTreeControls() {
  const zoomInBtn = document.getElementById('btn-zoom-in');
  const zoomOutBtn = document.getElementById('btn-zoom-out');
  const resetBtn = document.getElementById('btn-reset-view');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      if (treeInstance) treeInstance.setZoom(treeInstance.zoom * 1.2);
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (treeInstance) treeInstance.setZoom(treeInstance.zoom / 1.2);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (treeInstance) treeInstance.resetView();
    });
  }

  // Quick Focus Buttons
  const focusRootBtn = document.getElementById('focus-root');
  if (focusRootBtn) {
    focusRootBtn.addEventListener('click', () => {
      if (treeInstance && window.FamilyState.data) {
        treeInstance.render(window.FamilyState.data, 'muhammad');
        treeInstance.resetView();
      }
    });
  }
}

function setupHomeSearch() {
  const searchInput = document.getElementById('home-search-input');
  const resultsContainer = document.getElementById('home-search-results');
  if (!searchInput || !resultsContainer) return;

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value;
    if (!q || !q.trim()) {
      resultsContainer.classList.add('hidden');
      resultsContainer.innerHTML = '';
      return;
    }

    const matches = window.Utils.searchPeople(q);
    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div class="p-3 text-xs text-slate-500 text-center">No matching family records found</div>
      `;
      resultsContainer.classList.remove('hidden');
      return;
    }

    resultsContainer.innerHTML = matches.slice(0, 8).map(p => `
      <div onclick="selectPersonFromSearch('${p.id}')" class="flex items-center gap-3 p-2.5 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-slate-100 last:border-none">
        <div class="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
          ${window.Utils.getAvatarSvg(p)}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-slate-800 truncate">${window.Utils.escapeHtml(p.name)}</p>
          <p class="text-[11px] text-emerald-800 font-semibold truncate">${window.Utils.escapeHtml(p.title || '')}</p>
        </div>
      </div>
    `).join('');

    resultsContainer.classList.remove('hidden');
  });

  // Hide search container when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#home-search-wrapper')) {
      resultsContainer.classList.add('hidden');
    }
  });
}

window.selectPersonFromSearch = (personId) => {
  const resultsContainer = document.getElementById('home-search-results');
  if (resultsContainer) resultsContainer.classList.add('hidden');

  if (treeInstance && window.FamilyState.data) {
    treeInstance.render(window.FamilyState.data, personId);
    treeInstance.resetView(personId);
  }
};
