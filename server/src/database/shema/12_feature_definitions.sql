-- Table des définitions de fonctionnalités
CREATE TABLE IF NOT EXISTS feature_definitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- ex: 'DOCS_LIMIT'
    label VARCHAR(100) NOT NULL,      -- ex: 'Nombre de documents par type'
    type VARCHAR(20) NOT NULL,       -- 'boolean' or 'number'
    description TEXT
);

-- Seed des 10 fonctionnalités prédéfinies
INSERT INTO feature_definitions (code, label, type, description) VALUES
('docs_per_type', 'Documents autorisés par type', 'number', 'Limite de documents pour chaque catégorie'),
('objects_limit', 'Nombre d''objets (appareils)', 'number', 'Nombre maximal d''objets suivis'),
('sms_alerts', 'Alertes par SMS', 'boolean', 'Envoi de notifications SMS en cas de perte'),
('email_alerts', 'Alertes par Email', 'boolean', 'Envoi de notifications par email'),
('geo_tracking', 'Géolocalisation avancée', 'boolean', 'Accès à la carte de suivi précise'),
('priority_support', 'Support Prioritaire', 'boolean', 'Assistance technique rapide'),
('verified_badge', 'Badge Profil Vérifié', 'boolean', 'Affiche un badge de confiance'),
('history_days', 'Historique (jours)', 'number', 'Durée de conservation de l''historique'),
('ads_free', 'Sans publicités', 'boolean', 'Suppression des bannières promotionnelles'),
('export_data', 'Exportation des données', 'boolean', 'Possibilité d''exporter les rapports en PDF/CSV')
ON CONFLICT (code) DO NOTHING;
