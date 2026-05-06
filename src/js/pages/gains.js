/**
 * ═════════════════════════════════════════════════════════════════
 * GAINS.JS - Logic for the Earnings & Wallet Page
 * ═════════════════════════════════════════════════════════════════
 */

import { getSession, checkAuth } from '../services/auth.js';
import { getTransactionHistory, getMyDeclarations, getMyReferrals } from '../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ensure user is authenticated
    checkAuth();
    const user = getSession();
    if (!user) return;

    console.log("💰 Initializing Gains page for:", user.email);

    // 2. Initial UI state (Real-time data from session)
    updateHeaderUI(user);
    updateBalanceUI(user);

    // 3. Fetch detailed data
    try {
        const [txResult, declResult, refResult] = await Promise.all([
            getTransactionHistory(),
            getMyDeclarations(),
            getMyReferrals()
        ]);

        if (txResult.success) {
            renderTransactions(txResult.data);
            updateStatsFromTransactions(txResult.data, user);
        }

        if (declResult.success) {
            updateStatsFromDeclarations(declResult.data);
            // Points breakdown from declarations
            updatePointsBreakdown(declResult.data, refResult.success ? refResult.data : []);
        }

        renderPaymentMethods();

    } catch (error) {
        console.error("❌ Error fetching gains data:", error);
    }
});

/**
 * Update the Topbar and Profile info
 */
function updateHeaderUI(user) {
    const topInitial = document.getElementById('topInitial');
    const topName = document.getElementById('topName');
    
    if (topInitial) topInitial.textContent = user.initial || 'U';
    if (topName) topName.textContent = user.prenom || user.nom || 'Utilisateur';
}

/**
 * Update Wallet Balance and Progress
 */
function updateBalanceUI(user) {
    const balanceDisplay = document.getElementById('balance-display');
    const minWithdrawal = 500;
    const currentBalance = user.wallet_balance || 0;
    
    if (balanceDisplay) {
        balanceDisplay.innerHTML = `${currentBalance.toLocaleString()} <span class="text-2xl font-bold text-white/70">XAF</span>`;
    }

    // Update progress bar
    const progressPercent = Math.min((currentBalance / minWithdrawal) * 100, 100);
    const progressFill = document.querySelector('.prog-fill');
    const progressText = document.querySelector('.wallet-card .text-white.font-bold');
    
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${currentBalance} / ${minWithdrawal} XAF`;

    // Update Points
    const pointsDisplay = document.querySelector('.font-bricolage.text-primary');
    if (pointsDisplay) pointsDisplay.textContent = `${user.points || 0} pts`;
}

/**
 * Render Transaction List
 */
function renderTransactions(transactions) {
    const txList = document.getElementById('tx-list');
    if (!txList) return;

    if (!transactions || transactions.length === 0) {
        txList.innerHTML = `
            <div class="p-10 text-center text-textMuted">
                <i class="fa-solid fa-receipt text-3xl opacity-20 mb-3"></i>
                <p class="text-sm">Aucune transaction pour le moment.</p>
            </div>
        `;
        return;
    }

    txList.innerHTML = '';
    transactions.forEach((tx, i) => {
        const isPositive = tx.amount > 0 && tx.type !== 'recovery_fee';
        const sign = isPositive ? '+' : '-';
        const amount = Math.abs(tx.amount);
        
        let icon = "fa-receipt";
        let iconBg = "bg-gray-100";
        let iconCls = "text-gray-500";
        let label = tx.type;
        let sub = tx.payment_method;

        // Custom mapping based on type
        if (tx.type === 'finder_payout') {
            icon = "fa-file-circle-check";
            iconBg = "bg-green-light";
            iconCls = "text-green-mid";
            label = "Commission document";
            sub = "Récompense DocMaster";
        } else if (tx.type === 'recovery_fee') {
            icon = "fa-arrow-up";
            iconBg = "bg-orange-50";
            iconCls = "text-orange-500";
            label = "Frais de récupération";
            sub = "Paiement effectué";
        } else if (tx.type === 'withdrawal') {
            icon = "fa-arrow-right-from-bracket";
            iconBg = "bg-blue-50";
            iconCls = "text-blue-400";
            label = "Retrait de gains";
            sub = tx.metadata?.phone || "Mobile Money";
        }

        const date = new Date(tx.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        txList.innerHTML += `
            <div class="tx-row flex items-center gap-3 px-5 py-3.5 ${i < transactions.length - 1 ? 'border-b border-borderMain' : ''}">
                <div class="w-9 h-9 rounded-[10px] ${iconBg} flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid ${icon} ${iconCls} text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-textMain truncate leading-tight">${label}</p>
                    <p class="text-[11px] text-textMuted mt-0.5">${sub} · ${date}</p>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                    <span class="font-bricolage text-[14px] font-extrabold ${isPositive ? 'text-green-mid' : 'text-textMuted'}">${sign}${amount} XAF</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.status === 'SUCCESS' ? 'badge-green' : 'badge-orange'}">${tx.status}</span>
                </div>
            </div>
        `;
    });
}

/**
 * Update Stats from Transactions
 */
function updateStatsFromTransactions(transactions, user) {
    const totalEarned = transactions
        .filter(t => t.type === 'finder_payout' && t.status === 'SUCCESS')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalWithdrawn = transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'SUCCESS')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    // Update UI (Index mapping: 2 = total earned, 3 = total withdrawn)
    const stats = document.querySelectorAll('.stat-card .text-2xl');
    if (stats.length >= 4) {
        stats[2].textContent = totalEarned.toLocaleString();
        stats[3].textContent = totalWithdrawn.toLocaleString();
    }
}

/**
 * Update Stats from Declarations
 */
function updateStatsFromDeclarations(declarations) {
    const totalFound = declarations.filter(d => d.declaration_type === 'FOUND').length;
    const totalReturned = declarations.filter(d => d.status === 'RETURNED').length;

    // Update UI (Index mapping: 0 = total found, 1 = total returned)
    const stats = document.querySelectorAll('.stat-card .text-2xl');
    if (stats.length >= 2) {
        stats[0].textContent = totalFound;
        stats[1].textContent = totalReturned;
    }
}

/**
 * Update Points Breakdown Section
 */
function updatePointsBreakdown(declarations, referrals) {
    // 1. Calculate Points from Declarations (Static reward for creating a declaration)
    const PTS_PER_DECL = 50; 
    const totalDecls = declarations.length;
    const declPoints = totalDecls * PTS_PER_DECL;

    // 2. Calculate Points from Returns (Dynamic based on DocumentType reward)
    const returnedDecls = declarations.filter(d => d.status === 'RETURNED');
    const returnPoints = returnedDecls.reduce((sum, d) => {
        return sum + (d.docTypeInfo?.points_recompense || 0);
    }, 0);

    // 3. Calculate Points from Referrals (Dynamic based on each referral's reward)
    // referralData.referrals is the array from getMyReferrals
    const referralList = referrals.referrals || [];
    const totalRefs = referralList.length;
    const refPoints = referralList.reduce((sum, ref) => sum + (ref.points_gagnes || 0), 0);

    const pointsContainers = document.querySelectorAll('.bg-white.border.border-borderMain.rounded-\\[18px\\].p-5 .flex.flex-col.gap-2 > div');
    
    if (pointsContainers.length >= 3) {
        // 1. Documents déclarés
        const declRow = pointsContainers[0];
        declRow.querySelector('.text-textMuted').innerHTML = `Documents déclarés <span class="text-textMain font-semibold">(+${PTS_PER_DECL} pts × ${totalDecls})</span>`;
        declRow.querySelector('.font-bold.text-textMain').textContent = `${declPoints} pts`;
        declRow.querySelector('.prog-fill').style.width = `${Math.min(declPoints / 5, 100)}%`;

        // 2. Documents remis
        const returnRow = pointsContainers[1];
        // For the label, we'll show the count. Since points varies per doc, we don't show "+X pts x Y" but just total
        returnRow.querySelector('.text-textMuted').innerHTML = `Documents remis <span class="text-textMain font-semibold">(${returnedDecls.length} documents)</span>`;
        returnRow.querySelector('.font-bold.text-textMain').textContent = `${returnPoints} pts`;
        returnRow.querySelector('.prog-fill').style.width = `${Math.min(returnPoints / 5, 100)}%`;

        // 3. Parrainage
        const refRow = pointsContainers[2];
        refRow.querySelector('.text-textMuted').innerHTML = `Parrainage <span class="text-textMain font-semibold">(${totalRefs} personnes)</span>`;
        refRow.querySelector('.font-bold.text-textMain').textContent = `${refPoints} pts`;
        refRow.querySelector('.prog-fill').style.width = `${Math.min(refPoints / 2, 100)}%`;
    }

    // Update level info
    const totalPoints = declPoints + returnPoints + refPoints;
    const nextLevelPoints = 500;
    const pointsToNext = Math.max(nextLevelPoints - totalPoints, 0);
    
    const levelLabel = document.querySelector('.text-\\[12\\.5px\\].font-bold.text-textMain');
    const pointsToNextLabel = document.querySelector('.text-\\[11px\\].text-textMuted.mt-1'); // Adjusted selector
    const nextLevelValue = document.querySelector('.text-\\[13px\\].font-bold.text-primary');

    if (levelLabel) {
        levelLabel.textContent = totalPoints >= 500 ? "Niveau Or" : "Niveau Argent";
    }
    
    // Find the status text for "points to reach Gold"
    const statusText = document.querySelector('.p-3.bg-primary\\/5 p.text-\\[11px\\].text-textMuted');
    if (statusText) {
        statusText.textContent = pointsToNext > 0 
            ? `${pointsToNext} pts pour atteindre Or` 
            : "Félicitations ! Vous êtes au niveau Or";
    }
}

/**
 * Render Payment Methods
 */
function renderPaymentMethods() {
    const pmContainer = document.getElementById("payment-methods");
    if (!pmContainer) return;

    const methods = [
        { icon: "fa-mobile-screen-button", name: "MTN Mobile Money", color: "text-yellow-500", bg: "bg-yellow-50", connected: true },
        { icon: "fa-mobile-screen-button", name: "Orange Money", color: "text-orange-500", bg: "bg-orange-50", connected: false },
        { icon: "fa-university", name: "Virement bancaire", color: "text-blue-400", bg: "bg-blue-50", connected: false },
    ];

    pmContainer.innerHTML = '';
    methods.forEach(m => {
        pmContainer.innerHTML += `
            <div class="flex items-center gap-3 p-3.5 border-2 ${m.connected ? 'border-primary bg-primary/5' : 'border-borderMain bg-surface2'} rounded-[13px] cursor-pointer hover:border-primary transition-all group">
                <div class="w-9 h-9 rounded-[10px] ${m.bg} flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid ${m.icon} ${m.color} text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[12.5px] font-bold text-textMain leading-tight truncate">${m.name}</p>
                    <p class="text-[10.5px] ${m.connected ? 'text-green-mid font-semibold' : 'text-textMuted'}">${m.connected ? '✓ Connecté' : 'Ajouter'}</p>
                </div>
                <i class="fa-solid ${m.connected ? 'fa-circle-check text-primary' : 'fa-plus text-textMuted group-hover:text-primary'} text-sm transition-colors"></i>
            </div>`;
    });
}

// Global window functions for HTML calls
window.withdraw = function() {
    const session = getSession();
    const balance = session?.wallet_balance || 0;
    if (balance < 500) {
        alert(`Solde insuffisant — minimum 500 XAF requis.\nSolde actuel : ${balance} XAF`);
    } else {
        alert("Fonctionnalité de retrait bientôt disponible !");
    }
};
