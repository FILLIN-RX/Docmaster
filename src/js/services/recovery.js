import { getDeclarationById } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');

    if (!docId) {
        console.error('No ID provided');
        return;
    }

    const result = await getDeclarationById(docId);
    if (result.success) {
        renderRecoveryData(result.data);
    } else {
        alert(result.message);
    }
});

function renderRecoveryData(doc) {
    const isOwnerPage = window.location.pathname.includes('recuperer.html');
    
    // Fill basic info
    const title = document.querySelector('header span');
    if (title && doc.doc_type) {
        title.textContent = isOwnerPage ? `Récupérer : ${doc.doc_type}` : `Rendre : ${doc.doc_type}`;
    }

    if (isOwnerPage) {
        renderOwnerData(doc);
    } else {
        renderFinderData(doc);
    }
}

function renderOwnerData(doc) {
    const docImage = document.getElementById('docImage');
    if (docImage && doc.photo_recto) {
        docImage.src = doc.photo_recto.startsWith('http') ? doc.photo_recto : '/' + doc.photo_recto.replace(/^\//, '');
    }

    const docMatchDate = document.getElementById('docMatchDate');
    if (docMatchDate) {
        docMatchDate.textContent = `Signalé le ${new Date(doc.created_at).toLocaleDateString('fr-FR')}`;
    }

    const docLocation = document.getElementById('docLocation');
    if (docLocation) {
        docLocation.textContent = doc.ville || 'Position en attente';
    }

    const progText = document.getElementById('ownerProgressionText');
    if (progText) {
        if (doc.status === 'MATCHED') {
            progText.textContent = 'Étape 3 sur 4 — Confirmation & Paiement';
        } else if (doc.status === 'RETURNED') {
            progText.textContent = 'Processus Terminé';
        }
    }
}

function renderFinderData(doc) {
    // History summary
    const finderRef = document.querySelector('.timeline-item p.text-textMuted');
    if (finderRef) finderRef.textContent = `Réf: ${doc.identifiant_doc_dm || 'DM-MATCH'}`;

    // Status banner
    const progText = document.querySelector('#viewFinder .font-bold.text-white');
    if (progText) {
        if (doc.status === 'MATCHED') {
            progText.textContent = 'Propriétaire identifié — En attente du code';
        } else if (doc.status === 'RETURNED') {
            progText.textContent = 'Remise effectuée — Gains versés';
        }
    }
}

