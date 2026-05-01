import { getMyDeclarations, getMyDevices, getMyNotifications, markAllNotificationsAsRead } from '../services/api.js';
import { getSession } from '../services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Basic UI
    setupBasicUI();

    // 2. Load Dashboard Data
    await loadDashboardContent();
    await loadNotifications();

    // 3. Setup global handlers
    window.customMarkAllReadHandler = async () => {
        await markAllNotificationsAsRead();
    };
});

/**
 * Basic UI initializations (Name, Date, etc.)
 */
function setupBasicUI() {
    const user = getSession();
    if (user) {
        // Hello Name
        const helloName = document.getElementById('helloName');
        if (helloName) helloName.textContent = user.prenom || user.nom || 'Utilisateur';

        // Top Profile
        const topName = document.getElementById('topName');
        if (topName) topName.textContent = user.prenom || user.nom;

        const topInitial = document.getElementById('topInitial');
        if (topInitial) {
            topInitial.textContent = (user.prenom?.[0] || '') + (user.nom?.[0] || 'U');
        }

        const topPhoto = document.getElementById('topPhoto');
        if (user.photo_url && topPhoto) {
            topPhoto.src = user.photo_url;
            topPhoto.classList.remove('hidden');
            document.getElementById('topInitial').classList.add('hidden');
        }
    }

    // Current Day
    const currentDay = document.getElementById('currentDay');
    if (currentDay) {
        const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        currentDay.textContent = new Intl.DateTimeFormat('fr-FR', dateOptions).format(new Date());
    }
}

/**
 * Fetches and renders all dynamic dashboard content
 */
async function loadDashboardContent() {
    try {
        const [declRes, deviceRes] = await Promise.all([
            getMyDeclarations(),
            getMyDevices()
        ]);

        if (declRes.success) {
            renderDeclarationsFlow(declRes.data);
            renderRecentActivities(declRes.data);
            updateStats(declRes.data, deviceRes.success ? deviceRes.data.length : 0);
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

/**
 * Renders the progression blocks (LOST/FOUND/MATCH)
 */
function renderDeclarationsFlow(declarations) {
    const trackingContainer = document.getElementById('trackingContainer'); 
    if (!trackingContainer) return;

    trackingContainer.innerHTML = ''; // Clear hardcoded

    if (declarations.length === 0) {
        trackingContainer.innerHTML = `
            <div class="bg-white border border-dashed border-borderMain rounded-[18px] p-8 text-center">
                <div class="w-16 h-16 bg-surface2 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-folder-open text-textMuted text-2xl"></i>
                </div>
                <h3 class="font-bricolage text-lg font-bold text-textMain">Aucune activité en cours</h3>
                <p class="text-textMuted text-sm mt-1">Vos déclarations de perte ou de trouvaille s'afficheront ici.</p>
                <div class="mt-6 flex justify-center gap-3">
                    <a href="declarer.html" class="px-4 py-2 bg-primary text-white rounded-[10px] text-xs font-bold shadow-lg shadow-primary/20">Déclarer une perte</a>
                    <a href="trouverdocument.html" class="px-4 py-2 border border-borderMain rounded-[10px] text-xs font-bold text-textMain hover:bg-surface2">Signaler une trouvaille</a>
                </div>
            </div>
        `;
        return;
    }

    // Limit to top 3 active declarations to avoid cluttering
    const activeDecls = declarations.slice(0, 3);

    activeDecls.forEach(decl => {
        if (decl.declaration_type === 'LOST') {
            trackingContainer.appendChild(createLostBlock(decl));
        } else {
            trackingContainer.appendChild(createFoundBlock(decl));
        }
    });
}

/**
 * Helper to create a Lost block (Red)
 */
function createLostBlock(decl) {
    const isMatched = decl.status === 'MATCHED';
    const color = isMatched ? 'green' : 'red';
    const div = document.createElement('div');
    div.className = `bg-white border-2 border-${color}-500 rounded-[18px] overflow-hidden shadow-md shadow-${color}-500/5 transition-colors duration-500`;
    
    // Determine progress
    let step = 1;
    let progressWidth = '33%';
    if (decl.status === 'SEARCHING') { step = 2; progressWidth = '50%'; }
    if (isMatched) { step = 3; progressWidth = '75%'; }
    if (decl.status === 'RETURNED') { step = 4; progressWidth = '100%'; }

    div.innerHTML = `
      <div class="px-4 sm:px-5 py-3 border-b border-${color}-100 flex items-center justify-between bg-${color}-50/50">
        <div class="font-bricolage text-[13px] font-bold text-${color}-600 flex items-center gap-2">
          <i class="fa-solid ${isMatched ? 'fa-check-double animate-bounce' : 'fa-triangle-exclamation animate-pulse'}"></i> 
          ${isMatched ? 'Document trouvé !' : 'Ma perte signalée'}
        </div>
        <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-${color}-500 text-white uppercase tracking-wider">
          ${isMatched ? 'Match trouvé' : (decl.status === 'RETURNED' ? 'Récupéré' : 'Perdu')}
        </span>
      </div>
      <div class="p-4 sm:p-5">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-[12px] bg-${color}-50 flex items-center justify-center text-${color}-500">
            <i class="fa-solid ${getIconForType(decl.doc_type)} text-lg"></i>
          </div>
          <div>
            <div class="text-[13.5px] font-bold text-textMain">${decl.doc_type} — ${decl.owner_name}</div>
            <div class="text-[10px] text-textMuted italic">Réf: ${decl.identifiant_doc_dm} · ${getStatusText(decl.status)}</div>
          </div>
        </div>
        <div class="relative flex justify-between items-start px-2 mt-4">
          <div class="absolute top-3 left-[40px] right-[40px] h-[2px] bg-${color}-100"></div>
          <div class="absolute top-3 left-[40px] h-[2px] bg-${color}-500" style="width: ${progressWidth}"></div>

          <!-- Steps -->
          ${renderSteps(['Soumission', 'Recherche', 'Matching', 'Récupéré'], step, color)}
        </div>
        ${isMatched ? `
        <div class="mt-6 flex justify-end">
          <button class="px-4 py-2 bg-green-600 text-white rounded-[10px] text-[11px] font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20">
            <i class="fa-solid fa-file-pdf"></i> Générer le bon de retrait
          </button>
        </div>` : ''}
      </div>
    `;
    return div;
}

/**
 * Helper to create a Found block (Blue)
 */
function createFoundBlock(decl) {
    const isMatched = decl.status === 'MATCHED';
    const color = isMatched ? 'green' : 'blue';
    const div = document.createElement('div');
    div.className = `bg-white border-2 border-${color}-500 rounded-[18px] overflow-hidden shadow-md shadow-${color}-500/5 transition-colors duration-500`;
    
    let step = 1;
    let progressWidth = '33%';
    if (decl.status === 'SEARCHING') { step = 2; progressWidth = '50%'; }
    if (isMatched) { step = 3; progressWidth = '75%'; }
    if (decl.status === 'RETURNED') { step = 4; progressWidth = '100%'; }

    div.innerHTML = `
      <div class="px-4 sm:px-5 py-3 border-b border-${color}-100 flex items-center justify-between bg-${color}-50/50">
        <div class="font-bricolage text-[13px] font-bold text-${color}-600 flex items-center gap-2">
          <i class="fa-solid ${isMatched ? 'fa-handshake animate-bounce' : 'fa-hand-holding-heart'}"></i> 
          ${isMatched ? 'Propriétaire identifié !' : 'Document que j\'ai trouvé'}
        </div>
        <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-${color}-500 text-white uppercase tracking-wider">
          ${isMatched ? 'Match trouvé' : (decl.status === 'RETURNED' ? 'Remis' : 'Trouvé')}
        </span>
      </div>
      <div class="p-4 sm:p-5">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-[12px] bg-${color}-50 flex items-center justify-center text-${color}-500">
            <i class="fa-solid ${getIconForType(decl.doc_type)} text-lg"></i>
          </div>
          <div>
            <div class="text-[13.5px] font-bold text-textMain">${decl.doc_type} — ${decl.owner_name}</div>
            <div class="text-[10px] text-textMuted italic">Réf: ${decl.identifiant_doc_dm} · ${getStatusText(decl.status)}</div>
          </div>
        </div>
        <div class="relative flex justify-between items-start px-2 mt-4">
          <div class="absolute top-3 left-[40px] right-[40px] h-[2px] bg-${color}-100"></div>
          <div class="absolute top-3 left-[40px] h-[2px] bg-${color}-500" style="width: ${progressWidth}"></div>
          
          ${renderSteps(['Trouvé', 'Signalé', 'Matching', 'Rendre'], step, color)}
        </div>
        ${isMatched ? `
        <div class="mt-6 flex justify-end">
          <button class="px-4 py-2 bg-green-600 text-white rounded-[10px] text-[11px] font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20">
            <i class="fa-solid fa-handshake"></i> Contacter le propriétaire
          </button>
        </div>` : ''}
      </div>
    `;
    return div;
}

/**
 * Renders the steps circles for progress bars
 */
function renderSteps(labels, currentStep, color) {
    const icons = {
        red: ['fa-check', 'fa-search', 'fa-handshake', 'fa-check-double'],
        blue: ['fa-check', 'fa-bullhorn', 'fa-handshake', 'fa-hand-holding-heart']
    };

    return labels.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum <= currentStep;
        const isCompleted = stepNum < currentStep;
        
        let circleClass = '';
        let textClass = '';
        let icon = icons[color][idx];

        if (isActive) {
            circleClass = `bg-${color}-500 text-white shadow-sm shadow-${color}-200`;
            textClass = `text-${color}-600`;
            if (!isCompleted && stepNum === currentStep && stepNum < 4) {
                 // Current step but not last
                 circleClass = `bg-white border-2 border-${color}-500 text-${color}-500 shadow-sm`;
            }
        } else {
            circleClass = `bg-white border-2 border-${color}-200 text-${color}-300`;
            textClass = `text-${color}-300`;
        }

        return `
          <div class="relative z-10 flex flex-col items-center gap-1.5 min-w-[60px]">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[8px] ${circleClass}">
              <i class="fa-solid ${isCompleted ? 'fa-check' : icon}"></i>
            </div>
            <span class="text-[9px] font-bold uppercase tracking-tighter ${textClass}">${label}</span>
          </div>
        `;
    }).join('');
}

/**
 * Renders the recent activities list
 */
function renderRecentActivities(declarations) {
    const listContainer = document.getElementById('recentActivitiesList');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // Clear hardcoded

    if (declarations.length === 0) {
        listContainer.innerHTML = '<div class="p-5 text-center text-textMuted text-xs italic">Aucune activité récente.</div>';
        return;
    }

    declarations.slice(0, 5).forEach(decl => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-surface2 transition-colors cursor-pointer';
        
        const dateStr = new Date(decl.created_at).toLocaleDateString('fr-FR');
        const iconColor = decl.declaration_type === 'LOST' ? 'primary' : 'blue';
        const iconBg = decl.declaration_type === 'LOST' ? 'primary-light' : 'blue-50';
        
        div.innerHTML = `
            <div class="w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-[10px] sm:rounded-[11px] bg-${iconBg} flex items-center justify-center text-sm sm:text-[15px] flex-shrink-0">
              <i class="fa-solid ${getIconForType(decl.doc_type)} text-${iconColor}-dark"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] sm:text-[13.5px] font-semibold text-textMain truncate">
                ${decl.doc_type} ${decl.declaration_type === 'LOST' ? 'perdu' : 'trouvé'}
              </div>
              <div class="text-[10.5px] sm:text-[11.5px] text-textMuted flex items-center gap-1 italic">
                <i class="fa-solid fa-location-dot text-[9px]"></i> ${decl.ville || 'Non spécifié'} · 
                <i class="fa-regular fa-clock text-[9px]"></i> ${dateStr}
              </div>
            </div>
            <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(decl.status, decl.declaration_type)} whitespace-nowrap">
                ${getStatusText(decl.status)}
            </span>
        `;
        listContainer.appendChild(div);
    });
}

/**
 * Updates stats and donut chart
 */
function updateStats(declarations, deviceCount) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const total = declarations.length;
    const verified = declarations.filter(d => d.status === 'RETURNED').length;
    const pending = declarations.filter(d => d.status === 'AVAILABLE' || d.status === 'SEARCHING').length;
    const matched = declarations.filter(d => d.status === 'MATCHED').length;
    
    // Nouveaux: Documents déclarés il y a moins d'une semaine
    const isNew = (dateStr) => new Date(dateStr) >= oneWeekAgo;
    const newDocs = declarations.filter(d => isNew(d.created_at)).length;

    // Numbers
    setText('dashboardTotalDocs', total);
    setText('dashboardVerifiedDocs', verified);
    setText('dashboardPendingDocs', pending);
    setText('dashboardNewDocs', newDocs);
    setText('statDevicesCount', deviceCount);

    // Donut calculation (125.7 is half circle circumference roughly, 2*pi*50 = 314)
    // The dasharray is "filled-part empty-part"
    // Total circumference = 314.15
    const circ = 314.15;
    const svg = document.querySelector('.donut-wrap svg');
    if (svg) {
        const circles = svg.querySelectorAll('circle');
        if (circles.length >= 4) {
            const pVerified = total ? (verified / total) * circ : 0;
            const pPending = total ? (pending / total) * circ : 0;
            const pMatched = total ? (matched / total) * circ : 0;

            circles[1].setAttribute('stroke-dasharray', `${pVerified} ${circ - pVerified}`);
            circles[2].setAttribute('stroke-dasharray', `${pPending} ${circ - pPending}`);
            circles[2].setAttribute('stroke-dashoffset', -pVerified);
            circles[3].setAttribute('stroke-dasharray', `${pMatched} ${circ - pMatched}`);
            circles[3].setAttribute('stroke-dashoffset', -(pVerified + pPending));
        }
    }
}

// Utilities
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function getIconForType(type) {
    const t = type.toLowerCase();
    if (t.includes('cni')) return 'fa-id-card';
    if (t.includes('pass')) return 'fa-passport';
    if (t.includes('permis')) return 'fa-car';
    if (t.includes('diplome')) return 'fa-graduation-cap';
    if (t.includes('acte')) return 'fa-file-invoice';
    if (t.includes('carte')) return 'fa-credit-card';
    return 'fa-file-lines';
}

function getStatusText(status) {
    switch (status) {
        case 'AVAILABLE': return 'Publié';
        case 'SEARCHING': return 'Recherche active';
        case 'MATCHED': return 'Match trouvé !';
        case 'RETURNED': return 'Clôturé';
        default: return status;
    }
}

function getStatusBadgeClass(status, type) {
    if (status === 'MATCHED') return 'bg-green-100 text-green-700';
    if (status === 'RETURNED') return 'bg-gray-100 text-gray-700';
    if (type === 'LOST') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
}

/**
 * Notifications Logic
 */
async function loadNotifications() {
    if (typeof window.clearNotifications !== 'function') return;
    
    window.clearNotifications();
    const result = await getMyNotifications();
    
    if (result.success && result.data.data) {
        const notifications = result.data.data;
        
        notifications.forEach(notif => {
            let icon = 'fa-solid fa-bell';
            
            // Map types to icons
            switch(notif.type) {
                case 'LOST_SUBMITTED': icon = 'fa-solid fa-file-circle-exclamation'; break;
                case 'FOUND_SUBMITTED': icon = 'fa-solid fa-hand-holding-heart'; break;
                case 'DOC_ADDED': icon = 'fa-solid fa-shield-halved'; break;
                case 'MATCH_FOUND': icon = 'fa-solid fa-bullseye'; break;
                case 'DOC_UPDATED': icon = 'fa-solid fa-pen-to-square'; break;
                case 'DOC_DELETED': icon = 'fa-solid fa-trash-can'; break;
            }
            
            window.addNotification(
                notif.title, 
                notif.message, 
                formatTimeAgo(notif.created_at), 
                icon,
                notif.is_read
            );
        });
    }
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "À l'instant";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
}


