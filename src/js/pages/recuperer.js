/**
 * ═════════════════════════════════════════════════════════════════
 * RECUPERER.JS - Owner Recovery Process Controller
 * Handles the logic for the document owner to pay and recover their document
 * ═════════════════════════════════════════════════════════════════
 */

import { getDeclarationById, payRecoveryFee, BASE_URL, API_BASE_URL } from '../services/api.js';
import { getImageUrl } from '../utils/index.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial State
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');
    
    if (!docId) {
        console.error('❌ [Recuperer] No document ID provided in URL');
        return;
    }

    // 2. Setup UI listeners
    setupEventListeners();

    // 3. Load Data
    if (window.toggleLoader) window.toggleLoader(true);
    try {
        console.log('🔄 [Recuperer] Loading data for doc:', docId);
        const result = await getDeclarationById(docId);

        if (result.success) {
            updateUI(result.data);
        } else {
            window.showAlert(result.message || 'Erreur lors du chargement des données');
        }
    } catch (error) {
        console.error('❌ [Recuperer] Error:', error);
    } finally {
        if (window.toggleLoader) setTimeout(() => window.toggleLoader(false), 500);
    }
});

/**
 * Setup static event listeners
 */
function setupEventListeners() {
    // 1. Define UI handlers first to avoid ReferenceErrors
    const closeRecoveryModal = () => {
        const box = document.getElementById("recoveryModalBox");
        const wrapper = document.getElementById("recoveryModalWrapper");
        if (box) box.classList.add("translate-y-full");
        setTimeout(() => { 
            if (wrapper) {
                wrapper.classList.add("hidden"); 
                wrapper.classList.remove("flex");
            }
        }, 300);
    };

    const goToRecoveryStep2 = (method = 'MTN_MOMO') => {
        window.selectedRecoveryMethod = method;
        document.getElementById("recoveryStep1").classList.add("hidden");
        document.getElementById("recoveryStep2").classList.remove("hidden");
        document.getElementById("recoverySubmitBtn").innerText = "Confirmer le paiement";
    };

    const ownerConfirm = () => {
        const wrapper = document.getElementById("recoveryModalWrapper");
        const box = document.getElementById("recoveryModalBox");
        const submitBtn = document.getElementById("recoverySubmitBtn");
        
        document.getElementById("recoveryStep1").classList.remove("hidden");
        document.getElementById("recoveryStep2").classList.add("hidden");
        submitBtn.innerText = "Suivant";
        submitBtn.disabled = false;
        
        wrapper.classList.remove("hidden");
        wrapper.classList.add("flex");
        setTimeout(() => box.classList.remove("translate-y-full"), 10);
    };

    // 2. Attach to DOM
    const modalWrapper = document.getElementById('recoveryModalWrapper');
    if (modalWrapper) {
        const backdrop = modalWrapper.querySelector('.absolute.inset-0');
        if (backdrop) backdrop.addEventListener('click', closeRecoveryModal);
    }

    // 3. Expose to window for legacy onclick handlers
    window.closeRecoveryModal = closeRecoveryModal;
    window.goToRecoveryStep2 = goToRecoveryStep2;
    window.ownerConfirm = ownerConfirm;
    window.processRecoveryPayment = processRecoveryPayment;
    
    // Copy Code
    window.copyCode = () => {
        const code = document.getElementById('pickupCode').innerText;
        navigator.clipboard.writeText(code).then(() => { 
            window.showAlert("Code copié dans le presse-papier !"); 
        });
    };
}

/**
 * Update UI with document data
 */
function updateUI(data) {
    console.log('✨ [Recuperer] Updating UI with:', data);

    // Update Title & Header
    const pageTitle = document.querySelector('header span.font-bricolage');
    if (pageTitle) pageTitle.textContent = `Récupérer : ${data.doc_type || 'Document'}`;

    // Update Document Card
    const docTitle = document.querySelector('h3.font-bricolage');
    if (docTitle) {
        docTitle.innerHTML = `<i class="fa-solid fa-id-card text-primary text-xl"></i> ${data.doc_type || 'Document'}`;
    }

    const docMatchDate = document.getElementById('docMatchDate');
    if (docMatchDate) {
        docMatchDate.textContent = `Signalé le ${new Date(data.created_at).toLocaleDateString('fr-FR')}`;
    }

    const docLocation = document.getElementById('docLocation');
    if (docLocation) {
        docLocation.textContent = data.ville || 'Position en agence';
    }

    const docVisibleOwnerName = document.getElementById('docVisibleOwnerName');
    if (docVisibleOwnerName) {
        docVisibleOwnerName.textContent = data.owner_name || 'Non spécifié';
    }


    const docVisibleRef = document.getElementById('docVisibleRef');
    if (docVisibleRef) {
        // Only show identifiant_doc_dm (human-readable), never the UUID
        docVisibleRef.textContent = data.identifiant_doc_dm || '---';
    }
    // Update summary panels (PC)
    const summaryDocType = document.getElementById('summaryDocType');
    if (summaryDocType) summaryDocType.textContent = data.doc_type || 'Document';
    const summaryDocDate = document.getElementById('summaryDocDate');
    if (summaryDocDate) summaryDocDate.textContent = data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR') : '---';
    const summaryDocLocation = document.getElementById('summaryDocLocation');
    if (summaryDocLocation) summaryDocLocation.textContent = data.ville || 'Position en agence';
    const summaryDocOwner = document.getElementById('summaryDocOwner');
    if (summaryDocOwner) summaryDocOwner.textContent = data.owner_name || 'Non spécifié';

    // Update summary panels (Mobile Sticky)
    const stickyDocType = document.getElementById('stickyDocType');
    if (stickyDocType) stickyDocType.textContent = data.doc_type || 'Document';
    const stickyDocDate = document.getElementById('stickyDocDate');
    if (stickyDocDate) stickyDocDate.textContent = data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR') : '---';
    const stickyDocLocation = document.getElementById('stickyDocLocation');
    if (stickyDocLocation) stickyDocLocation.textContent = data.ville || 'Position en agence';

    // Photo Handling: Load both Recto and Verso photos
    const docImageRecto = document.getElementById('docImageRecto');
    const imagePlaceholderRecto = document.getElementById('imagePlaceholderRecto');
    const docImageVerso = document.getElementById('docImageVerso');
    const imagePlaceholderVerso = document.getElementById('imagePlaceholderVerso');

    const fallbackImage = '/assets/images/passport.png';
    const resolveImageUrl = (path) => getImageUrl(path, fallbackImage);

    // Recto
    if (docImageRecto) {
        const rectoPath = data.photo_recto || data.counterPartPhotoRecto || data.counterPartDeclaration?.photo_recto;
        const rectoUrl = resolveImageUrl(rectoPath) || fallbackImage;
        
        docImageRecto.onerror = () => {
            if (docImageRecto.dataset.fallbackApplied === 'true') return;
            docImageRecto.dataset.fallbackApplied = 'true';
            docImageRecto.src = fallbackImage;
            docImageRecto.classList.remove('hidden');
            if (imagePlaceholderRecto) imagePlaceholderRecto.classList.add('hidden');
            console.warn('⚠️ [Recuperer] Document recto photo fallback applied');
        };

        docImageRecto.src = rectoUrl;
        docImageRecto.classList.remove('hidden');
        if (imagePlaceholderRecto) imagePlaceholderRecto.classList.add('hidden');
        console.log('📸 [Recuperer] Document recto photo set to:', rectoUrl);
    }

    // Verso
    if (docImageVerso) {
        const versoPath = data.photo_verso || data.counterPartPhotoVerso || data.counterPartDeclaration?.photo_verso;
        const versoUrl = resolveImageUrl(versoPath) || fallbackImage;

        docImageVerso.onerror = () => {
            if (docImageVerso.dataset.fallbackApplied === 'true') return;
            docImageVerso.dataset.fallbackApplied = 'true';
            docImageVerso.src = fallbackImage;
            docImageVerso.classList.remove('hidden');
            if (imagePlaceholderVerso) imagePlaceholderVerso.classList.add('hidden');
            console.warn('⚠️ [Recuperer] Document verso photo fallback applied');
        };

        docImageVerso.src = versoUrl;
        docImageVerso.classList.remove('hidden');
        if (imagePlaceholderVerso) imagePlaceholderVerso.classList.add('hidden');
        console.log('📸 [Recuperer] Document verso photo set to:', versoUrl);
    }

    // Ensure document information is visible (not blurred)
    try {
        const alwaysVisibleIds = ['docMatchDate','docLocation','docOwnerName','docVisibleOwnerName','docVisibleRef'];
        alwaysVisibleIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.filter = 'none';
                el.style.opacity = '';
                el.style.userSelect = 'auto';
            }
        });

        if (docTitle) {
            docTitle.style.filter = 'none';
            docTitle.style.userSelect = 'auto';
        }

        if (docImageRecto) {
            docImageRecto.style.filter = 'none';
            docImageRecto.style.opacity = '';
        }
        if (docImageVerso) {
            docImageVerso.style.filter = 'none';
            docImageVerso.style.opacity = '';
        }
    } catch (e) {
        console.error('[Recuperer] Error ensuring document visibility', e);
    }

    // Update Reference in Header if possible
    const refTag = document.querySelector('header span.hidden.sm\\:inline');
    if (refTag && data.identifiant_doc_dm) {
        refTag.textContent = `Ref. ${data.identifiant_doc_dm}`;
    }

    // 10. Update Finder specific info
    const docOwnerEl = document.getElementById('docOwnerName');
    if (docOwnerEl) docOwnerEl.textContent = data.owner_name || 'Non spécifié';

    if (data.counterPart) {
        const nameEl = document.getElementById('finderName');
        if (nameEl) nameEl.textContent = `${data.counterPart.prenom} ${data.counterPart.nom}`;
    }

    // Blur finder-sensitive info until payment
    const toBlur = ['finderName', 'finderContactBlur', 'finderDescription', 'finderLocationNote'];
    toBlur.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.filter = 'blur(4.5px)';
            el.style.userSelect = 'none';
        }
    });

    if (data.counterPartDeclaration) {
        const descEl = document.getElementById('finderDescription');
        if (descEl) descEl.textContent = `"${data.counterPartDeclaration.description || 'Pas de description fournie.'}"`;
        
        const locNoteEl = document.getElementById('finderLocationNote');
        if (locNoteEl) locNoteEl.textContent = data.counterPartDeclaration.location_note || 'Aucune précision sur le lieu.';

        // Store finder coords for map
        if (data.counterPartDeclaration.found_location) {
            const loc = data.counterPartDeclaration.found_location;
            window.FINDER_LAT = loc.lat;
            window.FINDER_LNG = loc.long;
            window.FINDER_CITY = loc.city || data.ville || '';
        }
    }

    // Store finder phone if present
    if (data.counterPart && data.counterPart.telephone) {
        window.FINDER_PHONE = data.counterPart.telephone;
        const contactEl = document.getElementById('finderContactBlur');
        if (contactEl) {
            contactEl.textContent = data.counterPart.telephone.replace(/(\d{3})(\d{3})(\d{3})/, '+237 $1 $2 $3');
        }
    }

    // 11. Update Pricing
    let recoveryPrice = 5000;
    if (data.docTypeInfo && data.docTypeInfo.prix_retrouvaille) {
        recoveryPrice = data.docTypeInfo.prix_retrouvaille;
    }
    window.currentRecoveryPrice = recoveryPrice;

    const priceDisplay = document.getElementById('recoveryPriceDisplay');
    const modalPriceDisplay = document.getElementById('recoveryModalPriceDisplay');
    const stickyPriceDisplay = document.getElementById('stickyPriceDisplay');
    
    if (priceDisplay) priceDisplay.textContent = recoveryPrice.toLocaleString();
    if (modalPriceDisplay) modalPriceDisplay.textContent = `${recoveryPrice.toLocaleString()} FCFA`;
    if (stickyPriceDisplay) stickyPriceDisplay.textContent = `${recoveryPrice.toLocaleString()} FCFA`;

    // Show verseau badge on the photo
    try {
        const verseauBadge = document.getElementById('verseauBadge');
        const verseauAmount = document.getElementById('verseauAmount');
        if (verseauBadge && verseauAmount && window.currentRecoveryPrice) {
            verseauAmount.textContent = `${window.currentRecoveryPrice.toLocaleString()} FCFA`;
            verseauBadge.style.display = 'block';
        }
    } catch (e) { /* ignore */ }

    // Ensure the finder block container is blurred until payment
    try {
        const finderBlurContainer = document.getElementById('finder-blur-container');
        if (finderBlurContainer) {
            finderBlurContainer.classList.add('blur-info');
            finderBlurContainer.classList.remove('revealed');
        }
    } catch (e) { /* ignore */ }

    // Check Status and Claim
    if (data.status === 'RETURNED' || (data.claim && data.claim.status === 'VALIDATED')) {
        showSuccessState(data.claim ? data.claim.verification_code : '---');
    } else if (data.claim && data.claim.status === 'PAID') {
        showSuccessState(data.claim.verification_code);
    }
}

/**
 * Process the recovery payment workflow
 */
async function processRecoveryPayment() {
    const step2 = document.getElementById("recoveryStep2");
    if (step2.classList.contains("hidden")) {
        window.goToRecoveryStep2();
        return;
    }

    const btn = document.getElementById("recoverySubmitBtn");
    const originalText = btn.innerText;

    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');

    if (!docId) {
        window.showAlert("ID du document manquant.");
        return;
    }

    if (window.toggleLoader) window.toggleLoader(true);
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Traitement...';

        const phone = document.getElementById("recupPhone").value;
        if (!phone || phone.length < 9) {
            window.showAlert("Veuillez entrer un numéro de téléphone valide.");
            btn.disabled = false;
            btn.innerText = originalText;
            if (window.toggleLoader) window.toggleLoader(false);
            return;
        }

        console.log('💳 [Recuperer] Processing payment for:', docId);
        const result = await payRecoveryFee({
            docId,
            amount: window.currentRecoveryPrice || 5000,
            paymentMethod: window.selectedRecoveryMethod || 'MTN_MOMO',
            phone: phone
        });

        if (result.success) {
            console.log('✅ [Recuperer] Payment initiated:', result.data.nokashId);
            
            // Switch to "Waiting" state in the modal
            const step2 = document.getElementById("recoveryStep2");
            step2.innerHTML = `
                <div class="text-center py-6 space-y-4">
                    <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p class="font-bold text-textMain">En attente de validation sur votre téléphone...</p>
                    <p class="text-[12px] text-textMuted">Veuillez valider la transaction sur votre mobile pour recevoir votre code de retrait.</p>
                </div>
            `;
            btn.classList.add('hidden'); // Hide button while waiting
            
            // Start polling for status
            startPaymentPolling(docId);
        } else {
            window.showAlert(result.message || "Erreur lors du processus de récupération.");
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (error) {
        console.error('❌ [Recuperer] Payment technical error:', error);
        window.showAlert("Erreur de connexion au serveur.");
        btn.disabled = false;
        btn.innerText = originalText;
    } finally {
        if (window.toggleLoader) window.toggleLoader(false);
    }
}

/**
 * Poll the backend to check if the payment has been confirmed
 */
function startPaymentPolling(docId) {
    const pollInterval = setInterval(async () => {
        try {
            console.log('🔍 [Recuperer] Polling for payment status...');
            const result = await getDeclarationById(docId);
            
            if (result.success) {
                const data = result.data;
                if (data.claim && data.claim.status === 'PAID') {
                    console.log('🎉 [Recuperer] Payment confirmed!');
                    clearInterval(pollInterval);
                    window.closeRecoveryModal();
                    showSuccessState(data.claim.verification_code);
                    
                    // Trigger a celebratory sound or notification if desired
                }
            }
        } catch (error) {
            console.warn('⚠️ [Recuperer] Polling error:', error);
        }
    }, 5000); // Check every 5 seconds

    // Stop polling after 5 minutes (timeout)
    setTimeout(() => {
        clearInterval(pollInterval);
        console.log('⏹️ [Recuperer] Polling stopped (timeout).');
    }, 300000);
}

/**
 * Switch UI to success state (code received)
 */
function showSuccessState(verificationCode) {
    const actionPanel = document.getElementById('ownerActionPanel');
    const successPanel = document.getElementById('ownerSuccessPanel');
    const progText = document.getElementById('ownerProgressionText');
    const progBar = document.getElementById('ownerProgressBar');
    const progPercent = document.getElementById('ownerProgressionPercent');
    const pickupCode = document.getElementById('pickupCode');
    
    // Panels
    if (actionPanel) actionPanel.classList.add('hidden');
    const stickyActions = document.getElementById('mobileStickyActions');
    if (stickyActions) {
        stickyActions.classList.add('hidden');
        stickyActions.style.setProperty('display', 'none', 'important');
    }
    if (successPanel) {
        successPanel.classList.remove('hidden');
        successPanel.classList.add('block');
    }

    // Code
    if (pickupCode) pickupCode.textContent = verificationCode;

    // Progress
    if (progText) progText.textContent = 'Paiement Validé — Récupération prête';
    if (progBar) progBar.style.width = '100%';
    if (progPercent) progPercent.textContent = '100%';

    // Timeline Dots
    const step3Dot = document.getElementById('ownerStep3Dot');
    const step4Dot = document.getElementById('ownerStep4Dot');
    
    if (step3Dot) {
        step3Dot.className = "w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-green-100";
        step3Dot.innerHTML = '<i class="fa-solid fa-check"></i>';
    }
    
    if (step4Dot) {
        step4Dot.className = "w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shadow-xl shadow-primary/30 pulse-ring border-4 border-white";
        step4Dot.innerHTML = '<i class="fa-solid fa-key text-sm"></i>';
    }

    const step3Title = document.getElementById('ownerStep3Title');
    const step4Title = document.getElementById('ownerStep4Title');
    if (step3Title) step3Title.className = "text-[11px] font-bold text-green-500 uppercase tracking-tighter";
    if (step4Title) step4Title.className = "text-[12px] font-black text-primary uppercase tracking-tighter";

    // ── Reveal finder info & map after payment ─────────────────────────
    try {
        // Remove block-level blur
        const finderBlock = document.getElementById('finder-block');
        if (finderBlock) {
            finderBlock.classList.remove('blur-info');
            finderBlock.classList.add('revealed');
        }
        const finderBlurContainer = document.getElementById('finder-blur-container');
        if (finderBlurContainer) {
            finderBlurContainer.classList.remove('blur-info');
            finderBlurContainer.classList.add('revealed');
        }
        const revealIds = ['finderName','finderContactBlur','finderDescription','finderLocationNote'];
        revealIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.filter = 'none';
                el.style.userSelect = 'auto';
                el.classList.add('revealed');
            }
        });

        // Hide locked overlays
        const infoOverlay = document.getElementById('finder-info-locked');
        if (infoOverlay) infoOverlay.style.display = 'none';
        const mapOverlay = document.getElementById('finder-map-locked');
        if (mapOverlay) mapOverlay.style.display = 'none';

        // Show map section and init map if coords available
        const mapSection = document.getElementById('finder-map-section');
        if (mapSection) {
            mapSection.classList.remove('hidden');
            if (window.FINDER_LAT && window.FINDER_LNG && typeof window.initFinderMap === 'function') {
                setTimeout(() => window.initFinderMap(window.FINDER_LAT, window.FINDER_LNG, window.FINDER_PHONE), 300);
            }
        }
    } catch (e) {
        console.error('[Recuperer] Error revealing finder info:', e);
    }
}

// ── Map & Route helpers (copied/adapted from recuperation page)
let finderMap = null;
let mapIsFullscreen = false;

async function initFinderMap(finderLat, finderLng, phone) {
    const statusEl = document.getElementById('map-status-text');

    // Prevent double init
    if (finderMap) { finderMap.invalidateSize(); return; }

    finderMap = L.map('finder-route-map', { zoomControl: false, attributionControl: false })
                 .setView([finderLat, finderLng], 13);

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(finderMap);
    L.control.zoom({ position: 'topright' }).addTo(finderMap);

    const finderIcon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.35)"></div>`,
        iconSize: [36,36], iconAnchor: [18,36]
    });

    L.marker([finderLat, finderLng], { icon: finderIcon })
     .addTo(finderMap)
     .bindPopup(`<b>${window.FINDER_NAME || 'Trouveur'}</b><br>📍 ${window.FINDER_CITY || ''}`)
     .openPopup();

    const drawRoute = (ownerLat, ownerLng) => {
        const ownerIcon = L.divIcon({
            className: 'owner-marker-pulse',
            html: `<div style="width:20px;height:20px;background:#1d4ed8;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(29,78,216,.25)"></div>`,
            iconSize: [20,20], iconAnchor: [10,10]
        });
        L.marker([ownerLat, ownerLng], { icon: ownerIcon }).addTo(finderMap).bindPopup('📍 Votre position');

        const bounds = L.latLngBounds([[ownerLat, ownerLng],[finderLat, finderLng]]);
        finderMap.fitBounds(bounds, { padding: [40,40] });

        if (statusEl) statusEl.textContent = 'Tracé de l\'itinéraire...';
        fetch(`https://router.project-osrm.org/route/v1/driving/${ownerLng},${ownerLat};${finderLng},${finderLat}?geometries=geojson&overview=full`)
            .then(r => r.json())
            .then(data => {
                if (!data.routes || !data.routes[0]) return;
                const route = data.routes[0];
                L.geoJSON(route.geometry, { style: { color: '#1d4ed8', weight: 5, opacity: 0.85, lineJoin: 'round', lineCap: 'round' } }).addTo(finderMap);
                const mins = Math.round(route.duration / 60);
                const km   = (route.distance / 1000).toFixed(1);
                const etaEl = document.getElementById('eta-time');
                const distEl = document.getElementById('eta-dist');
                if (etaEl) etaEl.textContent = mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h${mins%60}`;
                if (distEl) distEl.textContent = `${km} km`;
                if (statusEl) statusEl.textContent = `${km} km • ${mins} min en voiture`;
            })
            .catch(() => { if (statusEl) statusEl.textContent = 'Itinéraire calculé (hors ligne)'; });
    };

    if (navigator.geolocation) {
        if (statusEl) statusEl.textContent = 'Localisation en cours...';
        navigator.geolocation.getCurrentPosition(
            pos => drawRoute(pos.coords.latitude, pos.coords.longitude),
            ()  => drawRoute(3.8480, 11.5021)
        );
    } else {
        drawRoute(3.8480, 11.5021);
    }
}

function toggleMapFullscreen() {
    const section = document.getElementById('finder-map-section');
    const icon = document.getElementById('map-fs-icon');
    mapIsFullscreen = !mapIsFullscreen;
    if (mapIsFullscreen) {
        section.classList.add('map-fullscreen');
        icon.className = 'fa-solid fa-compress text-[13px]';
        document.body.style.overflow = 'hidden';
    } else {
        section.classList.remove('map-fullscreen');
        icon.className = 'fa-solid fa-expand text-[13px]';
        document.body.style.overflow = '';
    }
    if (finderMap) setTimeout(() => finderMap.invalidateSize(), 150);
}

window.initFinderMap = initFinderMap;
window.toggleMapFullscreen = toggleMapFullscreen;
