document.addEventListener("DOMContentLoaded", () => {
  /**
   * ==================================
   * Compteurs animés (IntersectionObserver pour performance)
   * ==================================
   */
  const counters = document.querySelectorAll(".number");

  const animateCounter = (counter) => {
    const target = +counter.getAttribute("data-target");
    let count = 0;
    const increment = target / 100;

    const update = () => {
      if (count < target) {
        count += increment;
        counter.innerText = Math.min(Math.ceil(count), target);
        requestAnimationFrame(update);
      } else {
        counter.innerText = target;
      }
    };
    update();
  };

  // Lance l'animation quand l'élément devient visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((c) => observer.observe(c));

  /**
   * ==================================
   * Données des abonnements
   * ==================================
     const abonnements = [
    {
      nom: "Gratuit",
      prix: 0,
      isFeatured: false,
      features: [
        { valeur: "30 jours", label: "de validité", active: true },
        { valeur: "1", label: "Signalement / mois", active: true },
        { valeur: "SMS", label: "Alertes", active: false },
        { valeur: "Limitée", label: "Géolocalisation", active: false },
        { valeur: "x", label: "Notification Push", active: false },
        { valeur: "x", label: "Support prioritaire", active: false }
      ],
    },
    {
      nom: "Standard",
      prix: 500,
      isFeatured: false,
      features: [
        { valeur: "30 jours", label: "de validité", active: true },
        { valeur: "5", label: "Signalements / mois", active: true },
        { valeur: "SMS + Email", label: "Alertes", active: true },
        { valeur: "Basique", label: "Géolocalisation", active: true },
        { valeur: "x", label: "Notification Push", active: false },
        { valeur: "x", label: "Support prioritaire", active: false }
      ],
    },
    {
      nom: "Pro",
      prix: 1500,
      isFeatured: true,
      features: [
        { valeur: "12 mois", label: "de validité", active: true },
        { valeur: "15", label: "Signalements / mois", active: true },
        { valeur: "SMS + Email + Push", label: "Alertes", active: true },
        { valeur: "Avancée", label: "Géolocalisation", active: true },
        { valeur: "✓", label: "Notification Push", active: true },
        { valeur: "x", label: "Support prioritaire", active: false }
      ],
    },
    {
      nom: "VIP",
      prix: 3000,
      isFeatured: false,
      features: [
        { valeur: "12 mois", label: "de validité", active: true },
        { valeur: "Illimité", label: "Signalements / mois", active: true },
        { valeur: "Toutes", label: "Alertes", active: true },
        { valeur: "Avancée", label: "Géolocalisation", active: true },
        { valeur: "✓", label: "Notification Push", active: true },
        { valeur: "✓", label: "Support prioritaire", active: true }
      ],
    },
  ];
],
    },
  ];

  /**
   * ==================================
   * Génération des cartes HTML
   * ==================================
   */
  const genererCartes = () => {
    const container = document.getElementById("pricing-container");
    if (!container) return;

    // Detect if we are on Abonnement.html (has specific layout)
    const isAbonnementPage = document.body.classList.contains('md:flex') || !!document.querySelector('.main-wrapper');

    if (isAbonnementPage) {
       // Optional: Custom rendering for Abonnement.html if needed
       // For now, we use the standard cards but they should match the new style
    }

    container.innerHTML = abonnements
      .map((plan, index) => {
        const isFeatured = plan.isFeatured;
        
        // Classes specific to the dashboard/abonnement style
        const cardClasses = isFeatured
          ? "plan-card featured bg-green-dark rounded-[20px] p-5 flex flex-col relative overflow-hidden"
          : "plan-card bg-white border border-borderMain rounded-[20px] p-5 flex flex-col";

        const textClass = isFeatured ? "text-white" : "text-textMain";
        const mutedTextClass = isFeatured ? "text-white/50" : "text-textMuted";
        const btnClass = isFeatured 
          ? "w-full py-2.5 rounded-[12px] bg-primary text-white text-[13.5px] font-bold hover:bg-primary-dark transition-all active:scale-[.98] relative z-10 shadow-lg shadow-primary/20"
          : "w-full py-2.5 rounded-[12px] bg-white border border-borderMain text-textMain text-[13.5px] font-bold hover:border-primary hover:text-primary transition-all active:scale-[.98]";

        return `
            <div class="${cardClasses}">
                ${isFeatured ? '<div class="absolute w-40 h-40 rounded-full bg-primary/8 -bottom-10 -right-10 pointer-events-none"></div>' : ''}
                <div class="mb-4 relative z-10">
                    <div class="w-10 h-10 rounded-[12px] ${isFeatured ? 'bg-primary/15' : 'bg-primary/10'} flex items-center justify-center mb-3">
                        <i class="fa-solid ${isFeatured ? 'fa-rocket text-primary' : 'fa-star text-primary'} text-base"></i>
                    </div>
                    <div class="font-bricolage text-lg font-bold ${textClass}">${plan.nom}</div>
                    <div class="${mutedTextClass} text-[12.5px] font-medium">${isFeatured ? 'Recommandé' : 'Populaire'}</div>
                </div>
                <div class="mb-5 relative z-10">
                    <div class="font-bricolage text-3xl font-extrabold ${textClass} leading-none">
                        ${plan.prix} <span class="text-base font-bold ${mutedTextClass}">XAF</span>
                    </div>
                    <div class="text-[12px] ${mutedTextClass} mt-0.5">par mois</div>
                </div>
                <div class="flex flex-col gap-2.5 flex-1 mb-5 relative z-10">
                    ${plan.features.map(f => `
                        <div class="flex items-center gap-2.5 text-[13px]">
                            <i class="fa-solid ${f.active === false ? 'fa-xmark text-gray-400' : 'fa-check ' + (isFeatured ? 'text-primary' : 'text-green-500')} w-4 flex-shrink-0"></i>
                            <span class="${textClass} font-medium ${f.active === false ? 'opacity-40 line-through' : ''}">${plan.nom === 'Gratuit' && f.label === 'Signalement / mois' ? '1' : f.valeur} ${f.label}</span>
                        </div>
                    `).join('')}
                </div>
                <button onclick="souscrire(${index})" class="${btnClass}">
                    ${plan.prix === 0 ? 'Plan actuel' : 'Passer au ' + plan.nom}
                </button>
            </div>
        `;
      })
      .join("");
  };

  const genererComparatif = () => {
    const tableBody = document.querySelector("table tbody");
    if (!tableBody) return;

    // We take the features from the Pro plan as a template for labels
    const labels = abonnements[2].features.map(f => f.label);
    
    tableBody.innerHTML = labels.map((label, featureIndex) => {
      return `
        <tr class="hover:bg-surface2 transition-colors">
          <td class="px-5 py-3 text-[13px] font-medium text-textMain">${label}</td>
          ${abonnements.map((plan, planIndex) => {
            const feat = plan.features[featureIndex];
            if (!feat) return `<td class="px-3 py-3 text-center text-[13px] text-textMuted">-</td>`;
            
            const isFeatured = plan.isFeatured;
            const cellClass = isFeatured ? 'bg-primary/5' : '';
            const textClass = plan.nom === 'Standard' ? 'text-primary' : (plan.nom === 'VIP' ? 'text-amber-600' : (plan.nom === 'Pro' ? 'text-green-mid' : 'text-textMuted'));
            
            let content = feat.valeur;
            if (feat.valeur === '✓') content = '<i class="fa-solid fa-check text-green-500"></i>';
            if (feat.valeur === 'x' || feat.active === false) content = '<i class="fa-solid fa-xmark text-gray-300"></i>';
            if (feat.valeur === '✓' && plan.nom === 'Standard') content = '<i class="fa-solid fa-check text-primary"></i>';

            return `<td class="px-3 py-3 text-center text-[13px] font-semibold ${textClass} ${cellClass}">${content}</td>`;
          }).join('')}
        </tr>
      `;
    }).join('');
  };

  const genererFactures = () => {
    const container = document.getElementById("invoice-container");
    if (!container) return;

    const factures = [
      { plan: "Standard", date: "10 Avr. 2024", montant: 500, statut: "Payé", methode: "MTN Money" },
      { plan: "Standard", date: "10 Mars 2024", montant: 500, statut: "Payé", methode: "Orange Money" },
      { plan: "Gratuit", date: "10 Fév. 2024", montant: 0, statut: "Actif", methode: "Système" }
    ];

    container.innerHTML = factures.map(f => `
      <div class="flex items-center gap-3 px-5 py-3.5 hover:bg-surface2 transition-colors">
        <div class="w-9 h-9 rounded-[10px] bg-green-light flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-file-invoice text-green-mid text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[13.5px] font-semibold text-textMain">Plan ${f.plan} — ${f.date.split(' ')[1]}</div>
          <div class="text-[11.5px] text-textMuted italic">${f.date} · ${f.methode}</div>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-[13.5px] font-bold text-textMain">${f.montant} XAF</div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${f.statut === 'Payé' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">${f.statut}</span>
        </div>
        <button class="ml-2 w-8 h-8 rounded-[8px] bg-bgMain border border-borderMain flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-textMuted flex-shrink-0">
          <i class="fa-solid fa-download text-[11px]"></i>
        </button>
      </div>
    `).join('');
  };

  // Initialisation
  genererCartes();
  genererComparatif();
  genererFactures();

  /**
   * ==================================
   * Gestion du Modal (Global window)
   * ==================================
   */
  let currentPlanData = null;

  window.souscrire = function (index) {
    const plan = abonnements[index];
    currentPlanData = plan;

    // Injection des données
    document.getElementById("modalTitle").innerText = `Paiement ${plan.nom}`;
    document.getElementById("displayPlan").innerText = plan.nom;
    document.getElementById("displayPrix").innerText = `${plan.prix} FCFA`;
    document.getElementById("displayDocs").innerText =
      plan.features[1].valeur + " Docs par type";
    document.getElementById("displaytime").innerText = plan.features[0].valeur;

    // Reset Steps
    document.getElementById("viewStep1").classList.remove("hidden");
    document.getElementById("viewStep2").classList.add("hidden");
    document.getElementById("submitBtn").innerText = "Suivant";

    // Show Modal
    const wrapper = document.getElementById("modalWrapper");
    const box = document.getElementById("modalBox");
    wrapper.classList.remove("hidden");
    wrapper.classList.add("flex");
    setTimeout(() => box.classList.remove("translate-y-full"), 10);
  };

  window.closeSubscriptionModal = function () {
    const box = document.getElementById("modalBox");
    const wrapper = document.getElementById("modalWrapper");
    box.classList.add("translate-y-full");
    setTimeout(() => {
      wrapper.classList.add("hidden");
      wrapper.classList.remove("flex");
    }, 300);
  };

  window.goToStep2 = function () {
    const view1 = document.getElementById("viewStep1");
    const view2 = document.getElementById("viewStep2");
    
    view1.classList.add("opacity-0");
    setTimeout(() => {
        view1.classList.add("hidden");
        view1.classList.remove("opacity-0");
        view2.classList.remove("hidden");
        view2.classList.add("animate-fade-in");
        document.getElementById("submitBtn").innerText = "Confirmer le paiement";
    }, 200);
  };

  window.processPayment = function () {
    const step2Visible = !document
      .getElementById("viewStep2")
      .classList.contains("hidden");

    if (!step2Visible) {
      goToStep2();
    } else {
      const phone = document.getElementById("payPhone").value;
      const pseudo = document.getElementById("payPseudo").value;

      if (!phone || !pseudo) {
        alert("Veuillez remplir votre numéro et votre pseudo.");
        return;
      }
      
      const fullNumber = getFullNumber();
      if (!fullNumber) return; // Error handled in getFullNumber

      // Simuler appel API
      const btn = document.getElementById("submitBtn");
      const originalText = btn.innerText;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Traitement...';
      btn.disabled = true;

      setTimeout(() => {
        alert(
          `Félicitations !\nVotre abonnement "${currentPlanData.nom}" est maintenant actif.\nNuméro de transaction: #${Math.floor(Math.random() * 1000000)}`,
        );
        btn.innerHTML = originalText;
        btn.disabled = false;
        closeSubscriptionModal();
      }, 2000);
    }
  };
  // Sélection de l'élément
  const input = document.querySelector("#payPhone");
  let iti = null;

  if (input && window.intlTelInput) {
    // Initialisation de la bibliothèque
    iti = window.intlTelInput(input, {
        initialCountry: "cm",
        separateDialCode: true,
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.5.0/build/js/utils.js",
    });
  }

  // Pour récupérer le numéro complet (ex: +237690000000) lors du paiement :
  function getFullNumber() {
    if (!iti) return document.getElementById("payPhone").value;
    
    if (iti.isValidNumber()) {
      return iti.getNumber();
    } else {
      alert("Numéro de téléphone invalide pour le pays sélectionné");
      return null;
    }
  }
});
