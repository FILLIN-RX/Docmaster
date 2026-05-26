import { Link } from "react-router-dom";

export default function Confidentialite() {
  return (
    <div className="min-h-screen pt-[88px] px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-[12px] text-textMuted hover:text-primary font-semibold transition-colors inline-flex items-center gap-1 mb-4">
          <i className="fa-solid fa-arrow-left text-[10px]" /> Retour à l'accueil
        </Link>

        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-borda shadow-sm">
          <h1 className="font-bricolage text-2xl font-black text-textMain mb-6">Politique de Confidentialité</h1>

          <div className="space-y-6">
            <section>
              <h2 className="font-bricolage text-lg font-bold text-textMain mb-2">1. Collecte des données</h2>
              <p className="text-[13px] text-textMuted leading-relaxed">
                Nous collectons les informations que vous nous fournissez directement, notamment votre nom,
                prénom, adresse email, numéro de téléphone, et les informations relatives aux documents que
                vous déclarez ou sauvegardez sur la plateforme.
              </p>
            </section>

            <section>
              <h2 className="font-bricolage text-lg font-bold text-textMain mb-2">2. Utilisation des données</h2>
              <p className="text-[13px] text-textMuted leading-relaxed">
                Vos données sont utilisées uniquement dans le cadre du fonctionnement de la plateforme
                DocMaster : faciliter la mise en relation entre les propriétaires de documents perdus et
                les personnes qui les ont trouvés, améliorer nos services, et vous contacter si nécessaire.
              </p>
            </section>

            <section>
              <h2 className="font-bricolage text-lg font-bold text-textMain mb-2">3. Protection des données</h2>
              <p className="text-[13px] text-textMuted leading-relaxed">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées
                pour protéger vos données personnelles contre tout accès non autorisé, modification,
                divulgation ou destruction.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
