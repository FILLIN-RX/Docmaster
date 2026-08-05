-- Migration: Fonction de normalisation des types de documents
-- Regroupe toutes les valeurs de declarations.doc_type (uuid, code, nom en clair, variantes)
-- vers les types canoniques de document_types.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Le type PERMIS manquait à la migration 39 ; on l'ajoute si absent.
INSERT INTO document_types (nom, code, description, prix_retrouvaille, finder_percent, app_percent, delai_expiration_mois, icone, categorie, points_recompense)
VALUES ('Permis de Conduire', 'PERMIS', 'Permis de conduire (auto, moto, poids lourd)', 8000, 80, 20, 60, 'car', 'TRANSPORT', 75)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION normalize_doc_type(doc_type_value TEXT)
RETURNS UUID AS $$
DECLARE
  v_type_id UUID;
  v_code TEXT;
  v_normalized TEXT;
BEGIN
  IF doc_type_value IS NULL OR TRIM(doc_type_value) = '' THEN
    RETURN NULL;
  END IF;

  v_normalized := LOWER(TRIM(UNACCENT(REPLACE(REPLACE(doc_type_value, '''', ' '), '"', ' '))));

  -- 1. doc_type est déjà l'id d'un type du catalogue (nouveau flux)
  BEGIN
    v_type_id := doc_type_value::UUID;
    IF EXISTS (SELECT 1 FROM document_types WHERE id = v_type_id) THEN
      RETURN v_type_id;
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    NULL;
  END;

  -- 2. Match par code exact (CNI, PASSPORT, AUTRES, ...)
  SELECT id INTO v_type_id FROM document_types WHERE LOWER(code) = v_normalized;
  IF v_type_id IS NOT NULL THEN
    RETURN v_type_id;
  END IF;

  -- 3. Match par nom exact ("Carte Nationale d'Identité", ...)
  SELECT id INTO v_type_id FROM document_types WHERE LOWER(TRIM(UNACCENT(nom))) = v_normalized;
  IF v_type_id IS NOT NULL THEN
    RETURN v_type_id;
  END IF;

  -- 4. Carte de synonymes étendue (données legacy en clair)
  v_code := CASE
    WHEN v_normalized IN ('autre', 'autres', 'autre personnalise', 'autr personnalise', 'custom', 'personnalise', 'autre type', 'autre document', 'inconnu') THEN 'AUTRES'
    WHEN v_normalized IN ('cni', 'cnid', 'cnie', 'cniv', 'carte nationale', 'carte nationale d identite', 'carte d identite', 'carte didentite', 'carte identite', 'carte nationale didentite', 'piece d identite', 'piece didentite', 'piece identite', 'attestation', 'attestation d identite', 'attestation identite', 'identity card', 'national id', 'national id card', 'id card', 'national identity card') THEN 'CNI'
    WHEN v_normalized IN ('passeport', 'passport', 'passeport biometrique', 'passport book', 'passport card', 'passeport ordinaire') THEN 'PASSPORT'
    WHEN v_normalized IN ('permis', 'permis de conduire', 'permis conduire', 'permis b', 'permis a', 'permis c', 'permis ab', 'permis camion', 'permis moto', 'driver licence', 'driver license', 'driving licence', 'driving license') THEN 'PERMIS'
    WHEN v_normalized IN ('diplome', 'baccalaureat', 'bacc', 'bac', 'licence', 'licence pro', 'master', 'master 1', 'master 2', 'doctorat', 'releve de notes', 'releve de note', 'attestation de reussite', 'attestation de succes', 'certificat d etudes', 'parchemin') THEN 'DIPLOME'
    WHEN v_normalized IN ('carte grise', 'carte gris', 'certificat d immatriculation', 'certificat immatriculation', 'immatriculation', 'carte de vehicule') THEN 'CARTE_GRISE'
    WHEN v_normalized IN ('carte bancaire', 'carte blue', 'carte bleue', 'carte bleu', 'carte de banque', 'carte de credit', 'carte de debit', 'carte credit', 'cb', 'credit card', 'debit card', 'bank card', 'visa', 'mastercard') THEN 'CARTE_BLUE'
    WHEN v_normalized IN ('carte de sejour', 'carte sejour', 'titre de sejour', 'titre sejour', 'carte de residence', 'carte residence', 'permis de sejour') THEN 'CARTE_SEJOUR'
    WHEN v_normalized IN ('carte d electeur', 'carte electeur', 'carte electorale', 'carte delecteur', 'carte de vote', 'carte vote', 'electoral card', 'voting card') THEN 'CARTE_VOTE'
    WHEN v_normalized IN ('acte de naissance', 'acte naissance', 'extrait de naissance', 'extrait naissance', 'certificat de naissance', 'birth certificate') THEN 'ACTE_NAISSANCE'
    WHEN v_normalized IN ('acte de mariage', 'acte mariage', 'certificat de mariage', 'marriage certificate') THEN 'ACTE_MARIAGE'
    WHEN v_normalized IN ('acte de deces', 'acte deces', 'extrait de deces', 'extrait deces', 'certificat de deces', 'death certificate') THEN 'ACTE_DECES'
    WHEN v_normalized IN ('titre foncier', 'titre de propriete', 'titre propriete', 'propriete fonciere', 'acte de propriete', 'land title', 'deed') THEN 'TITRE_FINANCIER'
    ELSE NULL
  END;

  IF v_code IS NOT NULL THEN
    SELECT id INTO v_type_id FROM document_types WHERE code = v_code;
    IF v_type_id IS NOT NULL THEN
      RETURN v_type_id;
    END IF;
  END IF;

  -- 5. Aucun match : NULL (regroupé sous AUTRES par les requêtes)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
