import { Link } from "react-router-dom";

export default function Conditions() {
  return (
    <div className="min-h-screen pt-[88px] px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-[12px] text-textMuted hover:text-primary font-semibold transition-colors inline-flex items-center gap-1 mb-4">
          <i className="fa-solid fa-arrow-left text-[10px]" /> Retour à l'accueil
        </Link>

        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-borda shadow-sm">
          <h1 className="font-bricolage text-2xl font-black text-textMain mb-6">Conditions d'Utilisation</h1>

          <div className="space-y-6">
            <section>
              <h2 className="font-bricolage text-lg font-bold text-textMain mb-2">1. Acceptation des conditions</h2>
              <p className="text-[13px] text-textMuted leading-relaxed">
                En accédant et en utilisant la plateforme DocMaster, vous acceptez d'être lié par les présentes
                conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </section>

            <section>
              <h2 className="font-bricolage text-lg font-bold text-textMain mb-2">2. Description du service</h2>
              <p className="text-[13px] text-textMuted leading-relaxed">
                DocMaster est une plateforme qui permet aux utilisateurs de déclarer des documents perdus,
                de rechercher des documents trouvés, et de faciliter la restitution des documents à leurs
                propriétaires légitimes. La plateforme sert d'intermédiaire entre les personnes ayant perdu
                des documents et celles qui en ont trouvé.
              </p>
            </section>

            <section>
              <h2 className="font-bricolage text-lg font-bold text-textMain mb-2">3. Responsabilités de l'utilisateur</h2>
              <p className="text-[13px] text-textMuted leading-relaxed">
                L'utilisateur s'engage à fournir des informations exactes et complètes lors de l'utilisation
                de la plateforme. Il est responsable de la confidentialité de son compte et de ses identifiants
                de connexion. Toute activité réalisée depuis son compte est de son entière responsabilité.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
