/**
 * Visual Admin Panel Controller
 * Features: Password Auth, Dashboard, Visual Forms, Relationship Selectors, Timeline/Reference Editors, Live Preview, Import/Export JSON
 */

let currentPeopleList = [];
let editingPersonId = null;
let currentTimeline = [];
let currentReferences = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  if (sessionStorage.getItem('admin_authenticated') === 'true') {
    showAdminDashboard();
  } else {
    showAuthModal();
  }

  // Load family data
  const data = await window.Utils.loadFamilyData();
  currentPeopleList = data.people || [];

  // Handle URL edit param ?edit=person-id
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId && sessionStorage.getItem('admin_authenticated') === 'true') {
    openPersonForm(editId);
  }
});

/**
 * Show Auth Modal / Login
 */
function showAuthModal() {
  const authContainer = document.getElementById('auth-container');
  const adminContent = document.getElementById('admin-content');
  if (authContainer) authContainer.classList.remove('hidden');
  if (adminContent) adminContent.classList.add('hidden');

  const authForm = document.getElementById('auth-form');
  const passwordInput = document.getElementById('auth-password');
  const authError = document.getElementById('auth-error');

  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = passwordInput.value;
      const expectedPwd = window.CONFIG ? window.CONFIG.ADMIN_PASSWORD : 'admin';

      if (pwd === expectedPwd) {
        sessionStorage.setItem('admin_authenticated', 'true');
        showAdminDashboard();
      } else {
        if (authError) {
          authError.textContent = 'Incorrect admin password. Default password is "admin".';
          authError.classList.remove('hidden');
        }
      }
    });
  }
}

/**
 * Show Main Admin Dashboard
 */
function showAdminDashboard() {
  const authContainer = document.getElementById('auth-container');
  const adminContent = document.getElementById('admin-content');
  if (authContainer) authContainer.classList.add('hidden');
  if (adminContent) adminContent.classList.remove('hidden');

  renderStats();
  renderPeopleList();
  bindAdminEvents();
}

/**
 * Render Summary Stats
 */
function renderStats() {
  const totalCount = currentPeopleList.length;
  let totalSpouses = 0;
  let totalChildren = 0;

  currentPeopleList.forEach(p => {
    if (Array.isArray(p.spouses)) totalSpouses += p.spouses.length;
    if (Array.isArray(p.children)) totalChildren += p.children.length;
  });

  const statTotal = document.getElementById('stat-total-people');
  const statSpouses = document.getElementById('stat-total-spouses');
  const statChildren = document.getElementById('stat-total-children');

  if (statTotal) statTotal.textContent = totalCount;
  if (statSpouses) statSpouses.textContent = totalSpouses;
  if (statChildren) statChildren.textContent = totalChildren;
}

/**
 * Render Filterable People Table/List
 */
function renderPeopleList(filterQuery = '') {
  const tableBody = document.getElementById('people-table-body');
  if (!tableBody) return;

  const filtered = window.Utils.searchPeople(filterQuery, currentPeopleList);
  const displayList = filterQuery ? filtered : currentPeopleList;

  if (displayList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="p-6 text-center text-sm text-slate-500">
          No family records match your search.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = displayList.map(person => {
    const father = window.Utils.getPersonById(person.father);
    const mother = window.Utils.getPersonById(person.mother);
    const avatar = window.Utils.getAvatarSvg(person);

    return `
      <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-none">
        <td class="p-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
              ${avatar}
            </div>
            <div>
              <p class="text-xs md:text-sm font-bold text-slate-900">${window.Utils.escapeHtml(person.name)}</p>
              <p class="text-[11px] text-emerald-800 font-semibold">${window.Utils.escapeHtml(person.title || '')}</p>
            </div>
          </div>
        </td>
        <td class="p-3 text-xs text-slate-600 capitalize">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${person.gender === 'female' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-900'}">
            ${person.gender || 'male'}
          </span>
        </td>
        <td class="p-3 text-xs text-slate-600">
          ${father ? window.Utils.escapeHtml(father.name) : '-'}
        </td>
        <td class="p-3 text-xs text-slate-600">
          ${mother ? window.Utils.escapeHtml(mother.name) : '-'}
        </td>
        <td class="p-3 text-xs text-slate-600">
          <span class="bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded-md text-[11px]">
            ${(person.spouses || []).length} spouses • ${(person.children || []).length} kids
          </span>
        </td>
        <td class="p-3 text-right space-x-1">
          <button onclick="openPersonForm('${person.id}')" class="text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors">
            Edit
          </button>
          <button onclick="confirmDeletePerson('${person.id}')" class="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Bind Action Listeners
 */
function bindAdminEvents() {
  // Search filter
  const searchInput = document.getElementById('admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderPeopleList(e.target.value);
    });
  }

  // Add person button
  const addBtn = document.getElementById('btn-add-person');
  if (addBtn) {
    addBtn.addEventListener('click', () => openPersonForm(null));
  }

  // Export JSON
  const exportBtn = document.getElementById('btn-export-json');
  if (exportBtn) {
    exportBtn.addEventListener('click', downloadJSON);
  }

  // Reset JSON
  const resetBtn = document.getElementById('btn-reset-json');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all data back to original default family.json? All unsaved local edits will be lost.')) {
        const resetData = await window.Utils.resetFamilyData();
        currentPeopleList = resetData.people || [];
        renderStats();
        renderPeopleList();
        alert('Family tree reset to default dataset successfully!');
      }
    });
  }

  // Import JSON File
  const importFileInput = document.getElementById('import-file-input');
  if (importFileInput) {
    importFileInput.addEventListener('change', handleImportFile);
  }

  // Form Submit
  const personForm = document.getElementById('person-edit-form');
  if (personForm) {
    personForm.addEventListener('submit', handleFormSubmit);
  }

  // Auto slug generator on Name input
  const nameInput = document.getElementById('form-name');
  const idInput = document.getElementById('form-id');
  if (nameInput && idInput) {
    nameInput.addEventListener('input', () => {
      if (!editingPersonId) { // only auto-generate for new persons
        idInput.value = window.Utils.generateSlug(nameInput.value);
        updateLivePreview();
      }
    });
  }

  // Bind live updates for form fields to card preview
  ['form-name', 'form-title', 'form-gender', 'form-birth', 'form-death', 'form-image'].forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) el.addEventListener('input', updateLivePreview);
  });
}

/**
 * Open Visual Add / Edit Form Modal
 */
function openPersonForm(personId = null) {
  editingPersonId = personId;
  const modal = document.getElementById('person-modal');
  const modalTitle = document.getElementById('modal-title');
  if (!modal) return;

  const person = personId ? window.Utils.getPersonById(personId) : null;
  if (modalTitle) modalTitle.textContent = person ? `Edit Person: ${person.name}` : 'Add New Family Member';

  // Populate Dropdowns
  populateRelationshipSelects(person);

  // Set form field values
  document.getElementById('form-id').value = person ? person.id : '';
  document.getElementById('form-id').readOnly = !!person; // ID is readonly on edit to preserve references
  document.getElementById('form-name').value = person ? person.name : '';
  document.getElementById('form-title').value = person ? person.title || '' : '';
  document.getElementById('form-gender').value = person ? person.gender || 'male' : 'male';
  document.getElementById('form-birth').value = person ? person.birth || '' : '';
  document.getElementById('form-death').value = person ? person.death || '' : '';
  document.getElementById('form-burial').value = person ? person.burial || '' : '';
  document.getElementById('form-father').value = person ? person.father || '' : '';
  document.getElementById('form-mother').value = person ? person.mother || '' : '';
  document.getElementById('form-biography').value = person ? person.biography || '' : '';
  document.getElementById('form-aliases').value = person && person.aliases ? person.aliases.join(', ') : '';
  document.getElementById('form-notes').value = person ? person.notes || '' : '';
  document.getElementById('form-image').value = person ? person.image || '' : '';

  // Set multi-select checkboxes for Spouses, Children, Siblings
  setMultiSelectValues('form-spouses-container', person ? person.spouses || [] : []);
  setMultiSelectValues('form-children-container', person ? person.children || [] : []);
  setMultiSelectValues('form-siblings-container', person ? person.siblings || [] : []);

  // Set Timeline & References
  currentTimeline = person && person.timeline ? [...person.timeline] : [];
  currentReferences = person && person.references ? [...person.references] : [];

  renderTimelineEditor();
  renderReferenceEditor();
  updateLivePreview();

  modal.classList.remove('hidden');
}

/**
 * Populate Relationship Dropdowns & Checklists dynamically
 */
function populateRelationshipSelects(currentPerson = null) {
  const currentId = currentPerson ? currentPerson.id : null;
  const candidates = currentPeopleList.filter(p => p.id !== currentId);

  // Father & Mother selects
  const fatherSelect = document.getElementById('form-father');
  const motherSelect = document.getElementById('form-mother');

  if (fatherSelect) {
    fatherSelect.innerHTML = `<option value="">-- No Father Selected --</option>` +
      candidates.filter(p => p.gender === 'male').map(p => `
        <option value="${p.id}">${window.Utils.escapeHtml(p.name)}</option>
      `).join('');
  }

  if (motherSelect) {
    motherSelect.innerHTML = `<option value="">-- No Mother Selected --</option>` +
      candidates.filter(p => p.gender === 'female').map(p => `
        <option value="${p.id}">${window.Utils.escapeHtml(p.name)}</option>
      `).join('');
  }

  // Spouses, Children, Siblings Checkboxes
  renderChecklist('form-spouses-container', candidates);
  renderChecklist('form-children-container', candidates);
  renderChecklist('form-siblings-container', candidates);
}

function renderChecklist(containerId, peopleList) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = peopleList.map(p => `
    <label class="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 cursor-pointer">
      <input type="checkbox" value="${p.id}" class="rounded border-slate-300 text-emerald-800 focus:ring-emerald-800" />
      <span class="truncate font-semibold">${window.Utils.escapeHtml(p.name)}</span>
    </label>
  `).join('');
}

function setMultiSelectValues(containerId, selectedIds) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = selectedIds.includes(cb.value);
  });
}

function getMultiSelectValues(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const checked = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checked).map(cb => cb.value);
}

/**
 * Timeline Editor Component
 */
function renderTimelineEditor() {
  const container = document.getElementById('timeline-editor-list');
  if (!container) return;

  container.innerHTML = currentTimeline.map((item, idx) => `
    <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
      <input type="text" value="${window.Utils.escapeHtml(item.year)}" placeholder="Year / Event Date" onchange="updateTimelineItem(${idx}, 'year', this.value)" class="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-32 focus:ring-1 focus:ring-emerald-800" />
      <input type="text" value="${window.Utils.escapeHtml(item.event)}" placeholder="Event Description" onchange="updateTimelineItem(${idx}, 'event', this.value)" class="text-xs bg-white border border-slate-200 rounded-lg p-1.5 flex-1 focus:ring-1 focus:ring-emerald-800" />
      <button type="button" onclick="removeTimelineItem(${idx})" class="text-xs text-red-600 hover:text-red-800 p-1 font-bold">✕</button>
    </div>
  `).join('');
}

window.addTimelineItem = () => {
  currentTimeline.push({ year: '', event: '' });
  renderTimelineEditor();
};

window.updateTimelineItem = (index, field, val) => {
  if (currentTimeline[index]) {
    currentTimeline[index][field] = val;
  }
};

window.removeTimelineItem = (index) => {
  currentTimeline.splice(index, 1);
  renderTimelineEditor();
};

/**
 * Reference Editor Component
 */
function renderReferenceEditor() {
  const container = document.getElementById('reference-editor-list');
  if (!container) return;

  container.innerHTML = currentReferences.map((ref, idx) => `
    <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
      <input type="text" value="${window.Utils.escapeHtml(ref.title)}" placeholder="Book / Reference Title" onchange="updateReferenceItem(${idx}, 'title', this.value)" class="text-xs bg-white border border-slate-200 rounded-lg p-1.5 flex-1 focus:ring-1 focus:ring-emerald-800" />
      <input type="text" value="${window.Utils.escapeHtml(ref.source)}" placeholder="Source / Author" onchange="updateReferenceItem(${idx}, 'source', this.value)" class="text-xs bg-white border border-slate-200 rounded-lg p-1.5 flex-1 focus:ring-1 focus:ring-emerald-800" />
      <button type="button" onclick="removeReferenceItem(${idx})" class="text-xs text-red-600 hover:text-red-800 p-1 font-bold">✕</button>
    </div>
  `).join('');
}

window.addReferenceItem = () => {
  currentReferences.push({ title: '', source: '' });
  renderReferenceEditor();
};

window.updateReferenceItem = (index, field, val) => {
  if (currentReferences[index]) {
    currentReferences[index][field] = val;
  }
};

window.removeReferenceItem = (index) => {
  currentReferences.splice(index, 1);
  renderReferenceEditor();
};

/**
 * Update Live Person Card Preview
 */
function updateLivePreview() {
  const previewContainer = document.getElementById('live-preview-card');
  if (!previewContainer) return;

  const name = document.getElementById('form-name').value || 'Person Name';
  const title = document.getElementById('form-title').value || 'Title';
  const gender = document.getElementById('form-gender').value || 'male';
  const birth = document.getElementById('form-birth').value || '';
  const death = document.getElementById('form-death').value || '';
  const image = document.getElementById('form-image').value || '';

  const mockPerson = { name, title, gender, birth, death, image };
  const avatar = window.Utils.getAvatarSvg(mockPerson);

  previewContainer.innerHTML = `
    <div class="bg-white rounded-[18px] p-4 border border-emerald-500 shadow-md flex flex-col items-center text-center max-w-[220px] mx-auto">
      <div class="w-14 h-14 rounded-full border-2 border-emerald-600 mb-2 overflow-hidden shrink-0 shadow-xs">
        ${avatar}
      </div>
      <h4 class="text-sm font-bold text-slate-900 leading-snug">${window.Utils.escapeHtml(name)}</h4>
      <p class="text-xs font-semibold text-emerald-800 mt-0.5">${window.Utils.escapeHtml(title)}</p>
      <div class="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 w-full flex items-center justify-between">
        <span>${window.Utils.escapeHtml(birth.split(',')[0])}</span>
        <span>${window.Utils.escapeHtml(death.split(',')[0])}</span>
      </div>
    </div>
  `;
}

/**
 * Handle Person Form Submit
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('form-id').value.trim();
  const name = document.getElementById('form-name').value.trim();

  if (!id || !name) {
    alert('Name and ID are required fields.');
    return;
  }

  const aliasesRaw = document.getElementById('form-aliases').value;
  const aliases = aliasesRaw ? aliasesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  const personObj = {
    id: id,
    name: name,
    title: document.getElementById('form-title').value.trim(),
    gender: document.getElementById('form-gender').value,
    birth: document.getElementById('form-birth').value.trim(),
    death: document.getElementById('form-death').value.trim(),
    burial: document.getElementById('form-burial').value.trim(),
    father: document.getElementById('form-father').value,
    mother: document.getElementById('form-mother').value,
    spouses: getMultiSelectValues('form-spouses-container'),
    children: getMultiSelectValues('form-children-container'),
    siblings: getMultiSelectValues('form-siblings-container'),
    biography: document.getElementById('form-biography').value.trim(),
    timeline: currentTimeline.filter(t => t.year || t.event),
    references: currentReferences.filter(r => r.title || r.source),
    image: document.getElementById('form-image').value.trim(),
    aliases: aliases,
    notes: document.getElementById('form-notes').value.trim()
  };

  // Upsert into people list
  const existingIdx = currentPeopleList.findIndex(p => p.id === id);
  if (existingIdx >= 0) {
    currentPeopleList[existingIdx] = personObj;
  } else {
    currentPeopleList.push(personObj);
  }

  // Also bi-directionally sync spouse/parent relationships if needed
  syncRelationships(personObj);

  // Save to state & localStorage
  window.Utils.saveFamilyData({ version: "1.0.0", people: currentPeopleList });

  renderStats();
  renderPeopleList();

  closePersonModal();
  alert(`Successfully saved ${name}!`);
}

/**
 * Synchronize complementary relationships
 */
function syncRelationships(person) {
  // Sync Spouses: ensure each spouse has person listed in their spouses array
  person.spouses.forEach(spouseId => {
    const spouse = window.Utils.getPersonById(spouseId);
    if (spouse && Array.isArray(spouse.spouses) && !spouse.spouses.includes(person.id)) {
      spouse.spouses.push(person.id);
    }
  });

  // Sync Children: ensure each child has person as father or mother
  person.children.forEach(childId => {
    const child = window.Utils.getPersonById(childId);
    if (child) {
      if (person.gender === 'female') {
        child.mother = person.id;
      } else {
        child.father = person.id;
      }
    }
  });
}

/**
 * Confirm and Delete Person safely
 */
window.confirmDeletePerson = (personId) => {
  const person = window.Utils.getPersonById(personId);
  if (!person) return;

  if (confirm(`Are you sure you want to delete "${person.name}"? This action will remove them from the family database and automatically detach their relationships from other members.`)) {
    // Remove person
    currentPeopleList = currentPeopleList.filter(p => p.id !== personId);

    // Clean orphan links
    window.Utils.cleanOrphanRelationships(personId, currentPeopleList);

    // Save updated dataset
    window.Utils.saveFamilyData({ version: "1.0.0", people: currentPeopleList });

    renderStats();
    renderPeopleList();
    alert(`Deleted ${person.name} safely.`);
  }
};

window.closePersonModal = () => {
  const modal = document.getElementById('person-modal');
  if (modal) modal.classList.add('hidden');
};

/**
 * Export family.json
 */
function downloadJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.FamilyState.data || { version: "1.0.0", people: currentPeopleList }, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "family.json");
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

/**
 * Import custom family.json with validation
 */
function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result);
      const validation = window.Utils.validateFamilyJSON(parsed);

      if (!validation.valid) {
        alert("Import Error: " + validation.error);
        return;
      }

      currentPeopleList = parsed.people;
      window.Utils.saveFamilyData(parsed);

      renderStats();
      renderPeopleList();
      alert("Custom family.json imported and validated successfully!");
    } catch (err) {
      alert("Invalid JSON file syntax: " + err.message);
    }
  };
  reader.readAsText(file);
}
