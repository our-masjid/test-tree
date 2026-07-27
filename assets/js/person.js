/**
 * Person Detail Page View Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load family data
  const data = await window.Utils.loadFamilyData();
  
  // Parse person ID from URL query param ?id=...
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id') || 'muhammad';

  const person = window.Utils.getPersonById(personId);
  const container = document.getElementById('person-detail-container');
  const breadcrumbNav = document.getElementById('breadcrumb-nav');

  if (!person) {
    if (container) {
      container.innerHTML = `
        <div class="bg-white rounded-[18px] p-8 text-center max-w-lg mx-auto shadow-sm border border-slate-200 my-12">
          <div class="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">?</div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">Person Not Found</h2>
          <p class="text-slate-600 text-sm mb-6">The person record you requested could not be found in the family data.</p>
          <a href="index.html" class="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-medium px-5 py-2.5 rounded-full transition-colors text-sm">
            <span>← Back to Family Tree</span>
          </a>
        </div>
      `;
    }
    return;
  }

  // Set Page Document Title
  document.title = `${person.name} - ${window.CONFIG.SITE_NAME}`;

  // Render Breadcrumb Path
  renderBreadcrumb(personId, breadcrumbNav);

  // Render Person Profile Details
  renderPersonDetails(person, container);

  // Setup Search Bar
  setupSearch();
});

/**
 * Render Breadcrumb Lineage Path
 */
function renderBreadcrumb(targetId, navElement) {
  if (!navElement) return;

  const path = window.Utils.computeLineagePath(targetId);
  
  const crumbsHtml = path.map((id, index) => {
    const p = window.Utils.getPersonById(id);
    const isLast = index === path.length - 1;
    const name = p ? p.name : id;

    if (isLast) {
      return `<span class="font-bold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">${window.Utils.escapeHtml(name)}</span>`;
    }

    return `
      <a href="person.html?id=${encodeURIComponent(id)}" class="hover:text-emerald-800 hover:underline transition-colors">
        ${window.Utils.escapeHtml(name)}
      </a>
      <span class="text-slate-400 font-light select-none">></span>
    `;
  }).join(' ');

  navElement.innerHTML = `
    <div class="flex items-center gap-2 flex-wrap text-xs md:text-sm text-slate-600 py-2">
      <span class="text-slate-400 font-medium">Lineage Path:</span>
      ${crumbsHtml}
    </div>
  `;
}

/**
 * Render Full Person View
 */
function renderPersonDetails(person, container) {
  if (!container) return;

  const avatarSvg = window.Utils.getAvatarSvg(person);

  // Relationships Helpers
  const fatherObj = window.Utils.getPersonById(person.father);
  const motherObj = window.Utils.getPersonById(person.mother);

  const spousesList = (person.spouses || [])
    .map(id => window.Utils.getPersonById(id))
    .filter(Boolean);

  const childrenList = (person.children || [])
    .map(id => window.Utils.getPersonById(id))
    .filter(Boolean);

  const siblingsList = (person.siblings || [])
    .map(id => window.Utils.getPersonById(id))
    .filter(Boolean);

  container.innerHTML = `
    <!-- Top Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <a href="index.html" class="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full shadow-xs transition-all">
        <span>← View in Interactive Tree</span>
      </a>

      <div class="flex items-center gap-2">
        <a href="admin.html?edit=${encodeURIComponent(person.id)}" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors shadow-xs">
          <span>⚙️ Edit in Admin</span>
        </a>
        <button onclick="window.print()" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors shadow-xs">
          <span>🖨️ Print / Save PDF</span>
        </button>
      </div>
    </div>

    <!-- Main Profile Banner Card -->
    <div class="bg-white rounded-[18px] border border-slate-200 p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden">
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
        
        <!-- Avatar -->
        <div class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-emerald-600/30 overflow-hidden shrink-0 shadow-md">
          ${avatarSvg}
        </div>

        <!-- Identity & Key Details -->
        <div class="flex-1 text-center md:text-left">
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${person.gender === 'female' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-900'}">
              ${person.gender || 'Person'}
            </span>
            ${person.id === 'muhammad' ? `<span class="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full">Final Prophet</span>` : ''}
          </div>

          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">
            ${window.Utils.escapeHtml(person.name)}
          </h1>

          ${person.title ? `
            <p class="text-sm md:text-base font-semibold text-emerald-800 mb-4">
              ${window.Utils.escapeHtml(person.title)}
            </p>
          ` : ''}

          <!-- Aliases -->
          ${person.aliases && person.aliases.length > 0 ? `
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-4">
              <span class="text-xs font-medium text-slate-600 mr-1">Also known as:</span>
              ${person.aliases.map(alias => `
                <span class="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  ${window.Utils.escapeHtml(alias)}
                </span>
              `).join('')}
            </div>
          ` : ''}

          <!-- Dates Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-left">
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Birth</p>
              <p class="text-xs font-semibold text-slate-800 mt-0.5">${person.birth ? window.Utils.escapeHtml(person.birth) : 'Not documented'}</p>
            </div>
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Passing / Death</p>
              <p class="text-xs font-semibold text-slate-800 mt-0.5">${person.death ? window.Utils.escapeHtml(person.death) : 'Not documented'}</p>
            </div>
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Resting Place / Burial</p>
              <p class="text-xs font-semibold text-slate-800 mt-0.5">${person.burial ? window.Utils.escapeHtml(person.burial) : 'Not documented'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2 Column Layout: Bio & Relationships -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      
      <!-- Biography & Timeline Column (2 cols) -->
      <div class="lg:col-span-2 space-y-8">
        
        <!-- Biography Card -->
        <div class="bg-white rounded-[18px] border border-slate-200 p-6 md:p-8 shadow-sm">
          <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <span>📖 Biography & Historical Context</span>
          </h2>
          <div class="prose prose-slate max-w-none text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
            ${person.biography ? window.Utils.escapeHtml(person.biography) : '<p class="text-slate-400 italic">No biography text available for this entry.</p>'}
          </div>

          ${person.notes ? `
            <div class="mt-6 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs md:text-sm text-emerald-900">
              <span class="font-bold">Note:</span> ${window.Utils.escapeHtml(person.notes)}
            </div>
          ` : ''}
        </div>

        <!-- Timeline Card -->
        ${person.timeline && person.timeline.length > 0 ? `
          <div class="bg-white rounded-[18px] border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
              <span>⏳ Chronological Life Events & Timeline</span>
            </h2>

            <div class="relative pl-6 border-l-2 border-emerald-200 space-y-6">
              ${person.timeline.map(item => `
                <div class="relative group">
                  <div class="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-800 border-2 border-white ring-4 ring-emerald-100"></div>
                  <span class="inline-block text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full mb-1">
                    ${window.Utils.escapeHtml(item.year)}
                  </span>
                  <p class="text-sm font-medium text-slate-800 leading-snug">
                    ${window.Utils.escapeHtml(item.event)}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- References & Sources -->
        ${person.references && person.references.length > 0 ? `
          <div class="bg-white rounded-[18px] border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <span>📚 Historical References & Citations</span>
            </h2>

            <ul class="divide-y divide-slate-100">
              ${person.references.map(ref => `
                <li class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span class="text-sm font-semibold text-slate-800">${window.Utils.escapeHtml(ref.title)}</span>
                  <span class="text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">${window.Utils.escapeHtml(ref.source)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

      </div>

      <!-- Relationships Column (1 col) -->
      <div class="space-y-6">
        
        <!-- Parents Card -->
        <div class="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
            <span>Parents</span>
          </h3>

          <div class="space-y-2">
            ${fatherObj ? renderRelationChip(fatherObj, 'Father') : '<p class="text-xs text-slate-400 italic">Father not recorded</p>'}
            ${motherObj ? renderRelationChip(motherObj, 'Mother') : '<p class="text-xs text-slate-400 italic">Mother not recorded</p>'}
          </div>
        </div>

        <!-- Spouses Card -->
        <div class="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
            <span>Spouses (${spousesList.length})</span>
          </h3>

          ${spousesList.length > 0 ? `
            <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
              ${spousesList.map(sp => renderRelationChip(sp, 'Spouse')).join('')}
            </div>
          ` : '<p class="text-xs text-slate-400 italic">No recorded spouses in dataset</p>'}
        </div>

        <!-- Children Card -->
        <div class="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
            <span>Children (${childrenList.length})</span>
          </h3>

          ${childrenList.length > 0 ? `
            <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
              ${childrenList.map(child => renderRelationChip(child, child.gender === 'female' ? 'Daughter' : 'Son')).join('')}
            </div>
          ` : '<p class="text-xs text-slate-400 italic">No recorded children in dataset</p>'}
        </div>

        <!-- Siblings Card -->
        ${siblingsList.length > 0 ? `
          <div class="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
              <span>Siblings (${siblingsList.length})</span>
            </h3>

            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
              ${siblingsList.map(sib => renderRelationChip(sib, sib.gender === 'female' ? 'Sister' : 'Brother')).join('')}
            </div>
          </div>
        ` : ''}

      </div>

    </div>
  `;
}

/**
 * Render Clickable Relation Chip
 */
function renderRelationChip(person, roleLabel) {
  const avatar = window.Utils.getAvatarSvg(person);

  return `
    <a href="person.html?id=${encodeURIComponent(person.id)}" class="group flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
      <div class="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 group-hover:border-emerald-500">
        ${avatar}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-1">
          <p class="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-900">${window.Utils.escapeHtml(person.name)}</p>
          <span class="text-[10px] font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-full shrink-0">${roleLabel}</span>
        </div>
        ${person.title ? `<p class="text-[11px] text-slate-500 truncate">${window.Utils.escapeHtml(person.title)}</p>` : ''}
      </div>
    </a>
  `;
}

/**
 * Live Search Setup
 */
function setupSearch() {
  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  if (!input || !resultsContainer) return;

  input.addEventListener('input', (e) => {
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
      <a href="person.html?id=${encodeURIComponent(p.id)}" class="flex items-center gap-3 p-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-none">
        <div class="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
          ${window.Utils.getAvatarSvg(p)}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-slate-800 truncate">${window.Utils.escapeHtml(p.name)}</p>
          <p class="text-[11px] text-slate-500 truncate">${window.Utils.escapeHtml(p.title || '')}</p>
        </div>
      </a>
    `).join('');

    resultsContainer.classList.remove('hidden');
  });

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-container')) {
      resultsContainer.classList.add('hidden');
    }
  });
}
