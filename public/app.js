// AuraJob Frontend Application Controller

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  let allJobs = [];
  let bookmarkedIds = JSON.parse(localStorage.getItem('aurajob_bookmarks') || '[]');
  let trackingStates = JSON.parse(localStorage.getItem('aurajob_tracker') || '{}');
  
  let currentTab = 'all-jobs'; // 'all-jobs', 'bookmarked', 'tracker'
  let activeFilters = {
    search: '',
    role: 'all',
    geo: 'all',
    type: 'all',
    sort: 'match'
  };
  let selectedJob = null;

  // --- UI DOM ELEMENTS ---
  const jobsGrid = document.getElementById('jobs-grid');
  const trackerViewContainer = document.getElementById('tracker-view-container');
  const loadingSpinner = document.getElementById('loading-spinner');
  const emptyState = document.getElementById('empty-state');
  
  // Header / Actions
  const btnSync = document.getElementById('btn-sync');
  const syncIcon = btnSync.querySelector('.sync-icon');
  
  // Search & Filters
  const inputSearch = document.getElementById('input-search');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const selectGeo = document.getElementById('select-geo');
  const selectType = document.getElementById('select-type');
  const selectSort = document.getElementById('select-sort');
  const categoryPills = document.getElementById('category-pills');
  
  // Stats
  const statTotal = document.getElementById('stat-total');
  const statAiml = document.getElementById('stat-aiml');
  const statData = document.getElementById('stat-data');
  const statPref = document.getElementById('stat-pref');
  const badgeBookmarks = document.getElementById('badge-bookmarks');
  
  // Navigation Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  // Detail Overlay
  const detailOverlay = document.getElementById('detail-overlay');
  const btnCloseDetail = document.getElementById('btn-close-detail');
  const detailLogo = document.getElementById('detail-logo-placeholder');
  const detailTitle = document.getElementById('detail-title');
  const detailCompany = document.getElementById('detail-company');
  const detailLocation = document.getElementById('detail-location');
  const detailType = document.getElementById('detail-type');
  const detailSalary = document.getElementById('detail-salary');
  const detailDate = document.getElementById('detail-date');
  const detailDescription = document.getElementById('detail-description');
  const detailApplyLink = document.getElementById('detail-apply-link');
  const detailBtnBookmark = document.getElementById('detail-btn-bookmark');
  const detailStatusSelect = document.getElementById('detail-status-select');

  // Filter summary
  const filterSummary = document.getElementById('filter-summary');
  const summaryTags = document.getElementById('summary-tags-container');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const btnEmptyReset = document.getElementById('btn-empty-reset');

  // Kanban Columns
  const kanbanApplied = document.getElementById('kanban-applied');
  const kanbanInterviewing = document.getElementById('kanban-interviewing');
  const kanbanOffered = document.getElementById('kanban-offered');
  const kanbanRejected = document.getElementById('kanban-rejected');
  
  const countApplied = document.getElementById('count-applied');
  const countInterviewing = document.getElementById('count-interviewing');
  const countOffered = document.getElementById('count-offered');
  const countRejected = document.getElementById('count-rejected');

  // Toast
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // --- DYNAMIC PORTFOLIO CONFIGURATION ---
  // Modify this profile object to customize the Match Engine weights and candidate console!
  const CANDIDATE_PROFILE = {
    name: "Software Engineer",
    tagline: "AI/ML & Data Engineering Specialist",
    education: "B.S. / M.S. in Computer Science or technical equivalent | Top-Tier Tech University",
    tags: [
      { text: "Full-Stack AI", icon: "fa-brain", color: "cyan" },
      { text: "Cloud Architect", icon: "fa-cloud", color: "amber" },
      { text: "Open Source Contributor", icon: "fa-code", color: "secondary" }
    ],
    matchWeights: {
      baseline: 40,
      coreSkills: ['python', 'pytorch', 'tensorflow', 'scikit-learn', 'sql', 'spark', 'aws', 'docker', 'machine learning'],
      secondarySkills: ['git', 'linux', 'data pipelines', 'ci/cd', 'apis', 'tableau', 'numpy', 'pandas'],
      coreSkillBonus: 6,
      secondarySkillBonus: 4,
      roleBonuses: {
        aiml: { keywords: ['ai', 'ml', 'machine learning', 'deep learning', 'nlp', 'vision', 'intelligence'], bonus: 20 },
        dataSciEng: { keywords: ['data scientist', 'scientist', 'data engineer', 'engineer'], bonus: 10 },
        analyst: { keywords: ['data analyst', 'analyst', 'analytics'], bonus: 5 }
      },
      geoBonuses: {
        'India': 15,
        'Europe': 10,
        'Canada': 8,
        'US': 6,
        'Middle East': 4,
        'other': 2
      },
      companyBooster: {
        companies: ['nvidia', 'google', 'microsoft', 'meta', 'apple', 'amazon'],
        bonus: 10
      },
      jobTypeBooster: {
        'Hybrid': 10,
        'In-office': 10,
        'Remote': 5
      }
    }
  };

  // --- INITIALIZE CANDIDATE PROFILE UI ---
  function initCandidateProfileUI() {
    const profileCandidateName = document.getElementById('profile-candidate-name');
    const profileCandidateTagline = document.getElementById('profile-candidate-tagline');
    const profileCandidateEducation = document.getElementById('profile-candidate-education');
    const profileCandidateTags = document.getElementById('profile-candidate-tags');
    const profileCandidateSkills = document.getElementById('profile-candidate-skills');

    if (profileCandidateName) {
      profileCandidateName.textContent = `${CANDIDATE_PROFILE.name}'s Profile Console`;
    }
    if (profileCandidateTagline) {
      profileCandidateTagline.textContent = CANDIDATE_PROFILE.tagline;
    }
    if (profileCandidateEducation) {
      profileCandidateEducation.textContent = CANDIDATE_PROFILE.education;
    }
    if (profileCandidateTags) {
      profileCandidateTags.innerHTML = '';
      CANDIDATE_PROFILE.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        let style = '';
        if (tag.color === 'cyan') {
          style = 'background: rgba(6, 182, 212, 0.08); color: var(--accent-cyan); border-color: rgba(6, 182, 212, 0.15); font-size: 11px;';
        } else if (tag.color === 'amber') {
          style = 'background: rgba(245, 158, 11, 0.08); color: var(--accent-amber); border-color: rgba(245, 158, 11, 0.15); font-size: 11px;';
        } else {
          style = 'background: rgba(255, 255, 255, 0.04); color: var(--text-secondary); font-size: 11px;';
        }
        tagSpan.setAttribute('style', style);
        tagSpan.innerHTML = `<i class="fa-solid ${tag.icon}"></i> ${tag.text}`;
        profileCandidateTags.appendChild(tagSpan);
      });
    }
    if (profileCandidateSkills) {
      profileCandidateSkills.innerHTML = '';
      // Core skills display
      CANDIDATE_PROFILE.matchWeights.coreSkills.slice(0, 6).forEach(skill => {
        const skillSpan = document.createElement('span');
        skillSpan.className = 'tag';
        skillSpan.setAttribute('style', 'background: rgba(99, 102, 241, 0.12); color: #818cf8; border-color: rgba(99, 102, 241, 0.25); font-size: 11px;');
        skillSpan.textContent = capitalizeFirstLetters(skill);
        profileCandidateSkills.appendChild(skillSpan);
      });
      // Secondary skills display
      CANDIDATE_PROFILE.matchWeights.secondarySkills.slice(0, 4).forEach(skill => {
        const skillSpan = document.createElement('span');
        skillSpan.className = 'tag';
        skillSpan.setAttribute('style', 'background: rgba(6, 182, 212, 0.08); color: var(--accent-cyan); border-color: rgba(6, 182, 212, 0.15); font-size: 11px;');
        skillSpan.textContent = capitalizeFirstLetters(skill);
        profileCandidateSkills.appendChild(skillSpan);
      });
    }
  }

  function capitalizeFirstLetters(str) {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // Define skills aliases for backwards compatibility
  const coreSkills = CANDIDATE_PROFILE.matchWeights.coreSkills;
  const secondarySkills = CANDIDATE_PROFILE.matchWeights.secondarySkills;

  // Collapsible Candidate Profile Console Action
  const btnToggleProfile = document.getElementById('btn-toggle-profile');
  const profileDetailsBody = document.getElementById('profile-details-body');
  const profileToggleIcon = document.getElementById('profile-toggle-icon');
  
  if (btnToggleProfile && profileDetailsBody && profileToggleIcon) {
    btnToggleProfile.addEventListener('click', () => {
      const isHidden = profileDetailsBody.classList.contains('hidden');
      if (isHidden) {
        profileDetailsBody.classList.remove('hidden');
        profileToggleIcon.style.transform = 'rotate(180deg)';
      } else {
        profileDetailsBody.classList.add('hidden');
        profileToggleIcon.style.transform = 'rotate(0deg)';
      }
    });
  }

  function calculateMatchScore(job) {
    if (!job) return 0;
    
    const w = CANDIDATE_PROFILE.matchWeights;
    

    
    let score = w.baseline; // Starting baseline
    
    const titleLower = (job.title || '').toLowerCase();
    const descLower = (job.description || '').toLowerCase();
    const combinedText = titleLower + ' ' + descLower;
    
    // 1. Core Skill keyword matches
    w.coreSkills.forEach(skill => {
      const regex = new RegExp('\\b' + skill + '\\b', 'i');
      if (regex.test(combinedText)) {
        score += w.coreSkillBonus;
      }
    });
    
    // 2. Secondary Skill keyword matches
    w.secondarySkills.forEach(skill => {
      const regex = new RegExp('\\b' + skill + '\\b', 'i');
      if (regex.test(combinedText)) {
        score += w.secondarySkillBonus;
      }
    });
    
    // 3. Role Category Alignment
    let roleMatched = false;
    // AI/ML roles
    if (w.roleBonuses.aiml.keywords.some(kw => titleLower.includes(kw))) {
      score += w.roleBonuses.aiml.bonus;
      roleMatched = true;
    } 
    // Data Scientist / Engineer roles
    if (!roleMatched && w.roleBonuses.dataSciEng.keywords.some(kw => titleLower.includes(kw))) {
      score += w.roleBonuses.dataSciEng.bonus;
      roleMatched = true;
    } 
    // Analyst roles
    if (!roleMatched && w.roleBonuses.analyst.keywords.some(kw => titleLower.includes(kw))) {
      score += w.roleBonuses.analyst.bonus;
    }
    
    // 4. Location Mapping Preferences
    const geo = job.geo_category || '';
    if (w.geoBonuses[geo] !== undefined) {
      score += w.geoBonuses[geo];
    } else {
      score += w.geoBonuses['other'] || 2;
    }
    
    // 5. Preferred Target Companies Bonus
    const compLower = (job.company || '').toLowerCase();
    const isTargetCompany = w.companyBooster.companies.some(tc => compLower.includes(tc.toLowerCase()));
    if (isTargetCompany) {
      score += w.companyBooster.bonus;
    }
    
    // 6. Job Type Preferences
    const type = job.job_type || '';
    if (w.jobTypeBooster[type] !== undefined) {
      score += w.jobTypeBooster[type];
    }
    
    // Clamp score strictly between 0 and 100
    return Math.min(100, Math.max(0, score));
  }

  // --- CORE FUNCTIONS ---

  // Initialize and load jobs
  async function loadJobs(showLoader = true) {
    if (showLoader) {
      jobsGrid.classList.add('hidden');
      trackerViewContainer.classList.add('hidden');
      emptyState.classList.add('hidden');
      loadingSpinner.classList.remove('hidden');
    }
    
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Network error fetching jobs');
      
      allJobs = await response.json();
      console.log(`Loaded ${allJobs.length} jobs.`);
      
      updateStatistics();
      applyFiltersAndRender();
      
    } catch (error) {
      console.error(error);
      showToast('Error connecting to job database.', true);
      loadingSpinner.classList.add('hidden');
      emptyState.classList.remove('hidden');
    } finally {
      if (showLoader) {
        loadingSpinner.classList.add('hidden');
      }
    }
  }

  // Update Global Statistics Console
  function updateStatistics() {
    statTotal.textContent = allJobs.length;
    
    // Count AI/ML jobs
    const aimlCount = allJobs.filter(job => {
      const text = (job.title + " " + job.description).lower();
      return text.includes('ai') || text.includes('intelligence') || text.includes('ml') || text.includes('machine learning') || text.includes('deep learning');
    }).length;
    statAiml.textContent = aimlCount;
    
    // Count Data Scientist/Engineers
    const dataCount = allJobs.filter(job => {
      const text = (job.title + " " + job.description).lower();
      return text.includes('data engineer') || text.includes('data scientist') || text.includes('scientist') || text.includes('pipeline');
    }).length;
    statData.textContent = dataCount;

    // Count preferred locations (India, Europe, Canada, US, Middle East)
    const preferredGeoCount = allJobs.filter(job => 
      ['India', 'Europe', 'Canada', 'US', 'Middle East'].includes(job.geo_category)
    ).length;
    statPref.textContent = preferredGeoCount;

    // Bookmark badge
    badgeBookmarks.textContent = bookmarkedIds.length;
  }

  // Apply filters, sorts, and tabs then render correct layout
  function applyFiltersAndRender() {
    let filtered = [...allJobs];

    // 1. Filter by navigation tabs
    if (currentTab === 'bookmarked') {
      filtered = filtered.filter(job => bookmarkedIds.includes(job.id));
    } else if (currentTab === 'tracker') {
      // In tracker tab, we render the kanban board instead of the cards grid
      jobsGrid.classList.add('hidden');
      trackerViewContainer.classList.remove('hidden');
      emptyState.classList.add('hidden');
      renderKanban();
      updateFilterSummaryDisplay();
      return;
    }
    
    // Switch container displays for general listing view
    jobsGrid.classList.remove('hidden');
    trackerViewContainer.classList.add('hidden');

    // 2. Filter by search input (Title, Company, Description, Location, Tags)
    if (activeFilters.search.trim()) {
      const query = activeFilters.search.toLowerCase().trim();
      filtered = filtered.filter(job => {
        return (
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.tags.some(tag => tag.toLowerCase().includes(query))
        );
      });
    }

    // 3. Filter by role category pill
    if (activeFilters.role !== 'all') {
      filtered = filtered.filter(job => {
        const text = (job.title + " " + job.description).toLowerCase();
        if (activeFilters.role === 'ai-ml') {
          return text.includes('ai') || text.includes('intelligence') || text.includes('ml') || text.includes('machine learning') || text.includes('deep learning') || text.includes('nlp') || text.includes('vision');
        } else if (activeFilters.role === 'data-eng') {
          return text.includes('data engineer') || text.includes('data pipeline') || text.includes('analytics engineer');
        } else if (activeFilters.role === 'data-sci') {
          return text.includes('data scientist') || text.includes('scientist');
        } else if (activeFilters.role === 'data-ana') {
          return text.includes('data analyst') || text.includes('analytics');
        }
        return true;
      });
    }

    // 4. Filter by geographic category dropdown
    if (activeFilters.geo !== 'all') {
      filtered = filtered.filter(job => job.geo_category === activeFilters.geo);
    }

    // 5. Filter by job type dropdown (In-office, Remote, Hybrid)
    if (activeFilters.type !== 'all') {
      filtered = filtered.filter(job => job.job_type === activeFilters.type);
    }

    // 6. Apply Sorting
    if (activeFilters.sort === 'match') {
      filtered.sort((a, b) => {
        const scoreA = calculateMatchScore(a);
        const scoreB = calculateMatchScore(b);
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // Descending
        }
        const dateA = new Date(a.date_posted).getTime() || 0;
        const dateB = new Date(b.date_posted).getTime() || 0;
        return dateB - dateA;
      });
    } else if (activeFilters.sort === 'company') {
      filtered.sort((a, b) => a.company.localeCompare(b.company));
    } else if (activeFilters.sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: newest first (handled by pipeline, but sort securely in JS too)
      filtered.sort((a, b) => {
        const dateA = new Date(a.date_posted).getTime() || 0;
        const dateB = new Date(b.date_posted).getTime() || 0;
        return dateB - dateA;
      });
    }

    // Render output
    renderJobCards(filtered);
    updateFilterSummaryDisplay();
  }

  // Helper helper to generate random color classes for avatars
  function getAvatarClass(company) {
    if (!company) return 'avatar-a';
    const firstLetter = company.trim().charAt(0).toUpperCase();
    const code = firstLetter.charCodeAt(0);
    const classes = ['avatar-a', 'avatar-b', 'avatar-c', 'avatar-d', 'avatar-e', 'avatar-f'];
    return classes[code % classes.length];
  }

  // Render job listing card components
  function renderJobCards(jobs) {
    jobsGrid.innerHTML = '';
    
    if (jobs.length === 0) {
      emptyState.classList.remove('hidden');
      jobsGrid.classList.add('hidden');
      return;
    }
    
    emptyState.classList.add('hidden');
    jobsGrid.classList.remove('hidden');

    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'job-card glass-card';
      card.dataset.id = job.id;
      
      const isBookmarked = bookmarkedIds.includes(job.id);
      const trackingStatus = trackingStates[job.id];
      
      const companyInitials = job.company.substring(0, 2).toUpperCase();
      const avatarClass = getAvatarClass(job.company);
      
      const humanReadableDate = formatRelativeTime(job.date_posted);
      
      let trackerBadgeHtml = '';
      if (trackingStatus && trackingStatus !== 'none') {
        trackerBadgeHtml = `<span class="tracker-tag ${trackingStatus}">${capitalizeWord(trackingStatus)}</span>`;
      }
      
      const matchScore = calculateMatchScore(job);
      let matchClass = 'match-low';
      if (matchScore >= 80) {
        matchClass = 'match-high';
      } else if (matchScore >= 60) {
        matchClass = 'match-med';
      }

      card.innerHTML = `
        <div>
          <div class="card-top">
            <div class="company-logo-avatar ${avatarClass}">${companyInitials}</div>
            <div class="card-actions">
              <span class="match-badge ${matchClass}"><i class="fa-solid fa-fire"></i> ${matchScore}% Match</span>
              <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Job'}">
                <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-star"></i>
              </button>
            </div>
          </div>
          
          <div class="card-title-box">
            <h3 class="job-title" title="${job.title}">${job.title}</h3>
            <span class="company-name">${job.company}</span>
          </div>
          
          <div class="card-meta-info">
            <div class="meta-row"><i class="fa-solid fa-map-pin"></i> <span>${job.location}</span></div>
            <div class="meta-row"><i class="fa-solid fa-house-laptop"></i> <span>${job.job_type}</span></div>
            <div class="meta-row"><i class="fa-solid fa-wallet"></i> <span>${job.salary}</span></div>
          </div>
          
          <div class="card-tags">
            ${job.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
            <span class="tag">${job.geo_category}</span>
          </div>
        </div>
        
        <div class="card-footer">
          <span class="posted-time">${humanReadableDate}</span>
          ${trackerBadgeHtml}
        </div>
      `;
      
      // Card click event triggers detail drawer (excluding clicks on bookmark button)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-bookmark')) {
          e.stopPropagation();
          toggleBookmark(job.id);
          return;
        }
        openDetailDrawer(job);
      });
      
      jobsGrid.appendChild(card);
    });
  }

  // Render Kanban Columns for Application Tracker tab
  function renderKanban() {
    // Clear lists
    kanbanApplied.innerHTML = '';
    kanbanInterviewing.innerHTML = '';
    kanbanOffered.innerHTML = '';
    kanbanRejected.innerHTML = '';
    
    let appliedCount = 0;
    let interviewingCount = 0;
    let offeredCount = 0;
    let rejectedCount = 0;

    // Filter jobs that are currently tracked
    const trackedJobs = allJobs.filter(job => trackingStates[job.id] && trackingStates[job.id] !== 'none');

    trackedJobs.forEach(job => {
      const status = trackingStates[job.id];
      
      const card = document.createElement('div');
      card.className = 'kanban-card glass-card';
      card.innerHTML = `
        <h4>${job.title}</h4>
        <div class="company">${job.company}</div>
        <div class="footer">
          <span><i class="fa-solid fa-map-pin"></i> ${job.geo_category}</span>
          <span>${job.job_type}</span>
        </div>
      `;
      
      card.addEventListener('click', () => openDetailDrawer(job));
      
      if (status === 'applied') {
        kanbanApplied.appendChild(card);
        appliedCount++;
      } else if (status === 'interviewing') {
        kanbanInterviewing.appendChild(card);
        interviewingCount++;
      } else if (status === 'offered') {
        kanbanOffered.appendChild(card);
        offeredCount++;
      } else if (status === 'rejected') {
        kanbanRejected.appendChild(card);
        rejectedCount++;
      }
    });

    countApplied.textContent = appliedCount;
    countInterviewing.textContent = interviewingCount;
    countOffered.textContent = offeredCount;
    countRejected.textContent = rejectedCount;
  }

  // Open the detail modal overlay
  function openDetailDrawer(job) {
    selectedJob = job;
    
    const companyInitials = job.company.substring(0, 2).toUpperCase();
    const avatarClass = getAvatarClass(job.company);
    
    // Set avatars and text
    detailLogo.className = `company-logo-avatar large ${avatarClass}`;
    detailLogo.textContent = companyInitials;
    detailTitle.textContent = job.title;
    
    const matchScore = calculateMatchScore(job);
    let matchClass = 'match-low';
    if (matchScore >= 80) {
      matchClass = 'match-high';
    } else if (matchScore >= 60) {
      matchClass = 'match-med';
    }
    detailCompany.innerHTML = `${job.company} <span class="match-badge ${matchClass}" style="margin-left: 8px; vertical-align: middle;"><i class="fa-solid fa-fire"></i> ${matchScore}% Match</span>`;
    detailLocation.textContent = job.location;
    detailType.textContent = job.job_type;
    detailSalary.textContent = job.salary;
    
    const dateStr = new Date(job.date_posted).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    detailDate.textContent = `Posted on ${dateStr}`;
    
    detailDescription.innerHTML = job.description; // Description could have embedded HTML format from WWR/Remotive
    
    detailApplyLink.href = job.url;
    
    // Set bookmark button state
    const isBookmarked = bookmarkedIds.includes(job.id);
    updateDetailBookmarkButton(isBookmarked);
    
    // Set track selector state
    const status = trackingStates[job.id] || 'none';
    detailStatusSelect.value = status;
    
    // Open drawer with animation
    detailOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  function closeDetailDrawer() {
    detailOverlay.classList.add('hidden');
    document.body.style.overflow = ''; // Unlock background scroll
    selectedJob = null;
  }

  // Bookmark Toggle Management
  function toggleBookmark(jobId) {
    const index = bookmarkedIds.indexOf(jobId);
    let bookmarked = false;
    
    if (index === -1) {
      bookmarkedIds.push(jobId);
      bookmarked = true;
      showToast('Listing added to bookmarks!');
    } else {
      bookmarkedIds.splice(index, 1);
      showToast('Listing removed from bookmarks.');
    }
    
    localStorage.setItem('aurajob_bookmarks', JSON.stringify(bookmarkedIds));
    updateStatistics();
    
    // Sync active cards visual state
    const cardEl = document.querySelector(`.job-card[data-id="${jobId}"]`);
    if (cardEl) {
      const btn = cardEl.querySelector('.btn-bookmark');
      if (bookmarked) {
        btn.classList.add('bookmarked');
        btn.querySelector('i').className = 'fa-solid fa-star';
      } else {
        btn.classList.remove('bookmarked');
        btn.querySelector('i').className = 'fa-regular fa-star';
      }
    }
    
    if (selectedJob && selectedJob.id === jobId) {
      updateDetailBookmarkButton(bookmarked);
    }
    
    // Re-render if on bookmarks tab
    if (currentTab === 'bookmarked') {
      applyFiltersAndRender();
    }
  }

  function updateDetailBookmarkButton(isBookmarked) {
    if (isBookmarked) {
      detailBtnBookmark.innerHTML = `<i class="fa-solid fa-star"></i> Bookmarked`;
      detailBtnBookmark.classList.add('btn-primary');
      detailBtnBookmark.classList.remove('btn-secondary');
    } else {
      detailBtnBookmark.innerHTML = `<i class="fa-regular fa-star"></i> Bookmark`;
      detailBtnBookmark.classList.remove('btn-primary');
      detailBtnBookmark.classList.add('btn-secondary');
    }
  }

  // Tracker Management
  function updateTrackingStatus(jobId, status) {
    if (status === 'none') {
      delete trackingStates[jobId];
    } else {
      trackingStates[jobId] = status;
    }
    
    localStorage.setItem('aurajob_tracker', JSON.stringify(trackingStates));
    showToast(`Application status updated to ${capitalizeWord(status)}.`);
    
    applyFiltersAndRender();
    updateStatistics();
  }

  // --- EVENT LISTENERS CONSOLE ---

  // Close details modal
  btnCloseDetail.addEventListener('click', closeDetailDrawer);
  detailOverlay.querySelector('.overlay-backdrop').addEventListener('click', closeDetailDrawer);

  // Sync / Scraping database request
  btnSync.addEventListener('click', async () => {
    btnSync.disabled = true;
    syncIcon.classList.add('fa-spin');
    showToast('Syncing databases in background. Fetching latest openings...', false);
    
    try {
      const response = await fetch('/api/refresh', { method: 'POST' });
      if (!response.ok) throw new Error('Refresher returned non-ok status');
      
      const resData = await response.json();
      if (resData.success) {
        allJobs = resData.jobs;
        updateStatistics();
        applyFiltersAndRender();
        showToast('Database synchronization completed successfully!');
      } else {
        throw new Error(resData.error || 'Server reports sync failed');
      }
    } catch (err) {
      console.error(err);
      showToast('Database update failed. Check local system connection.', true);
    } finally {
      btnSync.disabled = false;
      syncIcon.classList.remove('fa-spin');
    }
  });

  // Search input typing handler (with simple debounce)
  let searchTimeout;
  inputSearch.addEventListener('input', (e) => {
    const val = e.target.value;
    activeFilters.search = val;
    
    if (val.trim()) {
      btnClearSearch.classList.remove('hidden');
    } else {
      btnClearSearch.classList.add('hidden');
    }
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      applyFiltersAndRender();
    }, 200);
  });

  btnClearSearch.addEventListener('click', () => {
    inputSearch.value = '';
    activeFilters.search = '';
    btnClearSearch.classList.add('hidden');
    applyFiltersAndRender();
  });

  // Select option changes
  selectGeo.addEventListener('change', (e) => {
    activeFilters.geo = e.target.value;
    applyFiltersAndRender();
  });
  
  selectType.addEventListener('change', (e) => {
    activeFilters.type = e.target.value;
    applyFiltersAndRender();
  });

  selectSort.addEventListener('change', (e) => {
    activeFilters.sort = e.target.value;
    applyFiltersAndRender();
  });

  // Role category pills click handler
  categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    
    categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    
    activeFilters.role = pill.dataset.role;
    applyFiltersAndRender();
  });

  // Tab switcher clicks
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabButtons.forEach(b => b.classList.remove('active'));
      const activeBtn = e.target.closest('.tab-btn');
      activeBtn.classList.add('active');
      
      currentTab = activeBtn.dataset.tab;
      
      // Hide search filtering interface elements if in tracker kanban mode
      if (currentTab === 'tracker') {
        document.getElementById('statistics-console').classList.add('hidden');
        document.getElementById('search-filters-console').querySelector('.dropdowns-container').classList.add('hidden');
        document.getElementById('category-pills').classList.add('hidden');
      } else {
        document.getElementById('statistics-console').classList.remove('hidden');
        document.getElementById('search-filters-console').querySelector('.dropdowns-container').classList.remove('hidden');
        document.getElementById('category-pills').classList.remove('hidden');
      }
      
      applyFiltersAndRender();
    });
  });

  // Detail panel action triggers
  detailBtnBookmark.addEventListener('click', () => {
    if (selectedJob) {
      toggleBookmark(selectedJob.id);
    }
  });

  detailStatusSelect.addEventListener('change', (e) => {
    if (selectedJob) {
      updateTrackingStatus(selectedJob.id, e.target.value);
    }
  });

  // Reset Filters logic
  function resetAllFilters() {
    activeFilters = {
      search: '',
      role: 'all',
      geo: 'all',
      type: 'all',
      sort: 'match'
    };
    
    inputSearch.value = '';
    btnClearSearch.classList.add('hidden');
    selectGeo.value = 'all';
    selectType.value = 'all';
    selectSort.value = 'match';
    
    categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    categoryPills.querySelector('[data-role="all"]').classList.add('active');
    
    applyFiltersAndRender();
  }

  btnResetFilters.addEventListener('click', resetAllFilters);
  btnEmptyReset.addEventListener('click', resetAllFilters);

  // --- HTML RENDER HELPERS ---

  // Capitalize word helper
  function capitalizeWord(word) {
    if (!word || word === 'none') return 'Not Tracked';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  // Relative posted date formatter
  function formatRelativeTime(dateString) {
    if (!dateString) return 'Posted recently';
    
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now - date;
      
      if (isNaN(diffMs)) return 'Posted recently';
      
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHrs < 24) {
        if (diffHrs <= 0) return 'Just posted';
        return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
      }
      
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Posted recently';
    }
  }

  // Update visual status showing applied filter summary tags
  function updateFilterSummaryDisplay() {
    summaryTags.innerHTML = '';
    
    let activeCount = 0;
    
    if (activeFilters.search.trim()) {
      addSummaryTag(`Search: "${activeFilters.search}"`, () => {
        inputSearch.value = '';
        activeFilters.search = '';
        btnClearSearch.classList.add('hidden');
        applyFiltersAndRender();
      });
      activeCount++;
    }
    
    if (activeFilters.role !== 'all') {
      const roleNames = {
        'ai-ml': 'AI & ML',
        'data-eng': 'Data Engineer',
        'data-sci': 'Data Scientist',
        'data-ana': 'Data Analyst'
      };
      addSummaryTag(`Role: ${roleNames[activeFilters.role]}`, () => {
        categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        categoryPills.querySelector('[data-role="all"]').classList.add('active');
        activeFilters.role = 'all';
        applyFiltersAndRender();
      });
      activeCount++;
    }
    
    if (activeFilters.geo !== 'all') {
      const geoLabels = {
        'India': 'India',
        'Europe': 'Europe',
        'Canada': 'Canada',
        'US': 'US / Canada',
        'Middle East': 'Middle-East',
        'Remote': 'Remote Feed'
      };
      addSummaryTag(`Geo: ${geoLabels[activeFilters.geo]}`, () => {
        selectGeo.value = 'all';
        activeFilters.geo = 'all';
        applyFiltersAndRender();
      });
      activeCount++;
    }
    
    if (activeFilters.type !== 'all') {
      const typeLabels = {
        'In-office': 'In-Office',
        'Hybrid': 'Hybrid',
        'Remote': 'Remote'
      };
      addSummaryTag(`Type: ${typeLabels[activeFilters.type]}`, () => {
        selectType.value = 'all';
        activeFilters.type = 'all';
        applyFiltersAndRender();
      });
      activeCount++;
    }
    
    if (activeCount > 0 && currentTab !== 'tracker') {
      filterSummary.classList.remove('hidden');
    } else {
      filterSummary.classList.add('hidden');
    }
  }

  function addSummaryTag(text, onRemove) {
    const tag = document.createElement('div');
    tag.className = 'summary-tag';
    tag.innerHTML = `
      <span>${text}</span>
      <button class="btn-tag-close"><i class="fa-solid fa-xmark"></i></button>
    `;
    tag.querySelector('.btn-tag-close').addEventListener('click', onRemove);
    summaryTags.appendChild(tag);
  }

  // Floating Toast Notification trigger
  let toastTimeout;
  function showToast(message, isError = false) {
    toastMessage.textContent = message;
    
    if (isError) {
      toast.classList.add('toast-error');
      toast.querySelector('.toast-icon').className = 'fa-solid fa-triangle-exclamation toast-icon';
    } else {
      toast.classList.remove('toast-error');
      toast.querySelector('.toast-icon').className = 'fa-solid fa-circle-check toast-icon';
    }
    
    toast.classList.remove('hidden');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3500);
  }

  // --- INITIAL DATA LOAD ---
  initCandidateProfileUI();
  loadJobs();
});

// Polyfill for lowerCase in string object instances if undefined
if (!String.prototype.lower) {
  String.prototype.lower = function() {
    return this.toLowerCase();
  };
}
