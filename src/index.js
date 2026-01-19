document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link");
  // On récupère le chemin actuel, par défaut "index.html" si vide
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const recherchePath =
    window.location.pathname.split("/rechercher.html").pop() ||
    "rechercher.html";
  const objectPath =
    window.location.pathname.split("/object.html").pop() || "object.html";

  const documentPath =
    window.location.pathname.split("/document.html").pop() || "document.html";

  navLinks.forEach((link) => {
    const anchor = link.querySelector("a");
    const href = anchor.getAttribute("href");

    if (
      href === currentPath ||
      href === recherchePath ||
      href === objectPath ||
      href === documentPath
    ) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});
// 1. Vos données JSON
const data = {
  documents: [
    {
      id: 1,
      titre: "Carte D'identité",
      date_retrouve: "13/08/2025",
      statut: "RÉCENT",
      priorite: 1,
      proprietaire: "Jean Dupont",
      retrouve_par: "Pierre Martin",
      pourcentage_restitution: 50,
      image_url: "assets/images/carte.jpeg",
    },
    {
      id: 2,
      titre: "Passeport",
      date_retrouve: "15/08/2025",
      statut: "RÉCENT",
      priorite: 2,
      proprietaire: "Awa Traoré",
      retrouve_par: "Koffi Paul",
      pourcentage_restitution: 80,
      image_url: "assets/images/passport.jpg",
    },
  ],
};

// 2. Fonction pour générer la carte
function renderCards(docs) {
  const container = document.getElementById("document-container");
  container.innerHTML = ""; // Vide le conteneur

  docs.forEach((doc) => {
    // Calcul de l'offset pour le cercle de progression SVG
    // 125 est la circonférence approximative pour r=20
    const strokeOffset = 125 - (125 * doc.pourcentage_restitution) / 100;

    const cardHTML = `
      <div class="bg-white/20  rounded-[35px] hover:-translate-y-2 transition-all overflow-hidden shadow-lg border border-gray-100 flex flex-col relative animate-fadeIn">
  
  <div class="relative">
  <!-- Image -->
  <div class="h-48 bg-gray-200/30 overflow-hidden rounded-t-[35px] group">
    <img src="${doc.image_url}" 
         alt="${doc.titre}" 
         class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110">
  </div>

  <!-- Badge Statut -->
  <span
    class="absolute left-6 top-48 -translate-y-1/2
           bg-[#2ecc71] text-white
           px-4 py-1
           rounded-full text-xs font-bold uppercase tracking-wider
           shadow-md z-30">
    ${doc.statut}
  </span>

  <!-- Badge Priorité -->
  <div
    class="absolute right-6 top-48 -translate-y-1/2
           bg-orange-400 text-white
           w-8 h-8
           flex items-center justify-center
           rounded-full text-xs font-bold
           shadow-md z-30">
    ${doc.priorite}
  </div>
</div>


  <!-- Contenu principal avec fond blanc légèrement transparent -->
  <div class=" p-6 bg-white/30 relative rounded-b-[35px]">
    

    <div class="flex items-center gap-2 text-gray-400 mb-2">
      <i class="fa-solid fa-calendar-days"></i>
      <span class="font-semibold text-sm">${doc.date_retrouve}</span>
    </div>
    
    <h2 class="text-2xl font-black text-[#1e272e] mb-4">${doc.titre}</h2>

    <div class="space-y-3 mb-8">
      <p class="flex items-center gap-2 font-bold text-gray-600">
        <i class="fa-solid fa-user text-gray-400"></i> Propriétaire: 
        <span class="text-orange-500">${doc.proprietaire}</span>
      </p>
      <p class="flex items-center gap-2 font-bold text-gray-600">
        <i class="fa-solid fa-magnifying-glass text-gray-400"></i> Retrouvé par: 
        <span class="text-orange-500">@ ${doc.retrouve_par}</span>
      </p>
    </div>

    <div class="flex items-center justify-between border-t border-dashed  border-gray-200 pt-6">
      <div class="flex items-center text-xs gap-3">
        <div class="relative w-12 h-12 flex items-center justify-center">
          <svg class="w-full h-full transform -rotate-90">
            <circle cx="24" cy="24" r="20" stroke="#f1f2f6" stroke-width="4" fill="transparent"/>
            <circle cx="24" cy="24" r="20" stroke="#EFA751" stroke-width="4" fill="transparent" 
                    stroke-dasharray="125" stroke-dashoffset="${strokeOffset}" class="transition-all duration-1000"/>
          </svg>
          <span class="absolute text-[10px] font-black">${doc.pourcentage_restitution}%</span>
        </div>
        <span class="font-bold text-gray-500 text-sm italic">Restitution</span>
      </div>

      <button class="bg-[#2ecc71] hover:bg-green-600 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95">
        <i class="fa-solid fa-play text-xs"></i> Récupérer
      </button>
    </div>
  </div>
</div>

    `;
    container.innerHTML += cardHTML;
  });
}

// 3. Lancer le chargement au démarrage
document.addEventListener("DOMContentLoaded", () => {
  renderCards(data.documents);
});
// Script simple pour ouvrir/fermer et changer le drapeau
  const btn = document.getElementById('langButton');
  const dropdown = document.getElementById('langDropdown');
  
  btn.onclick = () => dropdown.classList.toggle('hidden');

  function changeLang(code, flagUrl) {
    document.getElementById('currentFlag').src = flagUrl;
    btn.querySelector('span').innerText = code.toUpperCase();
    dropdown.classList.add('hidden');
    // Ici tu peux ajouter ta logique de changement de langue (i18next, etc.)
  }