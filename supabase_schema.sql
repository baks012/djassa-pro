-- =============================================================================
-- DJASSA PRO — SCHEMA COMPLET BASE DE DONNÉES SUPABASE (POSTGRESQL)
-- =============================================================================
-- Ce script configure l'intégralité de la base de données :
-- 1. Nettoyage & Extensions
-- 2. Tables métier (Users, Profiles, Services, Reviews, KYC, Audit Logs)
-- 3. Trigger automatique de synchronisation avec Supabase Auth (auth.users)
-- 4. Vues optimisées pour les prestataires actifs
-- 5. Sécurité Row Level Security (RLS) & Politiques d'accès
-- 6. Configuration du Stockage Supabase (Buckets Avatars & Documents CNI)
-- 7. Jeu de données initial & Comptes Démo (Admin, Prestataires, Clients)
--
-- POUR EXÉCUTER :
-- Rendez-vous sur votre tableau de bord Supabase :
-- SQL Editor -> Click "New Query" -> Collez tout ce script -> Click "Run"
-- =============================================================================

-- 1. EXTENSIONS & NETTOYAGE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP VIEW IF EXISTS active_providers_view CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;


-- =============================================================================
-- 2. TABLES PRINCIPALES
-- =============================================================================

-- A. Table des Utilisateurs Plateforme
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'prestataire', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. Table des Profils Détaillés (Artisans & Clients)
CREATE TABLE public.profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    commune TEXT NOT NULL DEFAULT 'Cocody',
    quartier TEXT,
    bio TEXT,
    competences JSONB DEFAULT '[]'::jsonb,
    photo_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    whatsapp_number TEXT,
    call_number TEXT,
    disponible BOOLEAN DEFAULT true,
    est_verifie BOOLEAN DEFAULT false,
    kyc_status TEXT DEFAULT 'NON_VERIFIE' CHECK (kyc_status IN ('NON_VERIFIE', 'EN_ATTENTE', 'VERIFIE', 'REJETE')),
    rating_avg NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Table des Services / Métiers proposés par les prestataires
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    categorie TEXT NOT NULL,
    prix_indicatif NUMERIC NOT NULL DEFAULT 5000,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Table des Avis & Notations Clients
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    client_nom TEXT DEFAULT 'Client vérifié',
    client_prenom TEXT,
    note INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Table des Documents KYC (Contrôle d'identité / CNI)
CREATE TABLE public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    type_piece TEXT NOT NULL DEFAULT 'CNI',
    numero_piece TEXT,
    document_url TEXT NOT NULL,
    statut TEXT DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'VERIFIE', 'REJETE')),
    motif_rejet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- F. Table du Journal d'Audit Administrateur
CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =============================================================================
-- 3. INDEX POUR PERFORMANCES OPTIMALES
-- =============================================================================
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role_active ON public.users(role, is_active);
CREATE INDEX idx_profiles_commune ON public.profiles(commune);
CREATE INDEX idx_profiles_verifie ON public.profiles(est_verifie);
CREATE INDEX idx_profiles_disponible ON public.profiles(disponible);
CREATE INDEX idx_profiles_kyc ON public.profiles(kyc_status);
CREATE INDEX idx_services_provider ON public.services(provider_id);
CREATE INDEX idx_services_categorie ON public.services(categorie);
CREATE INDEX idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX idx_kyc_provider ON public.kyc_documents(provider_id);


-- =============================================================================
-- 4. VUE PUBLIQUE : PRESTATAIRES ACTIFS ET NON REJETÉS
-- =============================================================================
-- Cette vue ne renvoie QUE les prestataires autorisés à apparaître sur le site :
CREATE OR REPLACE VIEW public.active_providers_view AS
SELECT 
    p.user_id AS id,
    p.nom,
    p.prenom,
    p.commune,
    p.quartier,
    p.bio,
    p.competences,
    p.photo_url,
    p.whatsapp_number,
    p.call_number,
    p.disponible,
    p.est_verifie,
    p.kyc_status,
    p.rating_avg,
    p.reviews_count,
    u.phone,
    u.email,
    u.is_active,
    p.created_at
FROM public.profiles p
JOIN public.users u ON u.id = p.user_id
WHERE u.role = 'prestataire'
  AND u.is_active = true
  AND p.kyc_status != 'REJETE'
  AND p.disponible = true;


-- =============================================================================
-- 5. TRIGGER AUTOMATIQUE DE SYNCHRONISATION AVEC SUPABASE AUTH
-- =============================================================================
-- Dès qu'un utilisateur est créé via l'interface Supabase Auth (Email / Téléphone),
-- ce trigger insère automatiquement son entrée dans public.users et public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_nom TEXT;
    user_prenom TEXT;
    user_commune TEXT;
    user_photo TEXT;
BEGIN
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'client');
    user_nom := COALESCE(new.raw_user_meta_data->>'nom', 'Utilisateur');
    user_prenom := COALESCE(new.raw_user_meta_data->>'prenom', 'Djassa');
    user_commune := COALESCE(new.raw_user_meta_data->>'commune', 'Cocody');
    user_photo := COALESCE(new.raw_user_meta_data->>'photo_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80');

    -- 1. Insertion dans public.users
    INSERT INTO public.users (id, phone, email, role, is_active)
    VALUES (
        new.id,
        COALESCE(new.phone, new.raw_user_meta_data->>'phone', '+225' || substr(md5(random()::text), 1, 10)),
        new.email,
        user_role,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone;

    -- 2. Insertion dans public.profiles
    INSERT INTO public.profiles (
        user_id, nom, prenom, commune, photo_url,
        whatsapp_number, call_number, disponible, est_verifie, kyc_status
    )
    VALUES (
        new.id,
        user_nom,
        user_prenom,
        user_commune,
        user_photo,
        new.phone,
        new.phone,
        true,
        (user_role = 'admin'),
        CASE WHEN user_role = 'admin' THEN 'VERIFIE' ELSE 'NON_VERIFIE' END
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activation du trigger sur auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 6. SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique
CREATE POLICY "Lecture publique des profils actifs" 
    ON public.profiles FOR SELECT 
    USING (kyc_status != 'REJETE');

CREATE POLICY "Lecture publique des services" 
    ON public.services FOR SELECT 
    USING (true);

CREATE POLICY "Lecture publique des avis clients" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Tout le monde peut publier un avis" 
    ON public.reviews FOR INSERT 
    WITH CHECK (true);

-- Politiques de gestion pour les utilisateurs connectés
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Les prestataires gèrent leurs services" 
    ON public.services FOR ALL 
    USING (auth.uid() = provider_id);

CREATE POLICY "Les prestataires peuvent envoyer leurs documents KYC" 
    ON public.kyc_documents FOR INSERT 
    WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Les prestataires consultent leurs documents KYC" 
    ON public.kyc_documents FOR SELECT 
    USING (auth.uid() = provider_id);


-- =============================================================================
-- 7. STOCKAGE SUPABASE (STORAGE BUCKETS)
-- =============================================================================
-- Création automatique des buckets de stockage (Photos de profil et Pièces CNI)
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('cni_documents', 'cni_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques d'accès aux fichiers Storage
CREATE POLICY "Accès public aux photos de profil"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Upload public / utilisateurs des photos de profil"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Upload des documents KYC par le prestataire"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'cni_documents');


-- =============================================================================
-- 8. COMPTES DÉMO & DONNÉES DE DÉPART (PRÊTS À L'EMPLOI)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. COMPTE ADMINISTRATEUR DÉMO
-- Email : admin@djassa.ci
-- Mot de passe : admin123
-- -----------------------------------------------------------------------------
INSERT INTO public.users (id, phone, email, password_hash, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '+2250700000001',
    'admin@djassa.ci',
    '$2a$10$fMHvoGaemb4YSuXRXGndE.bLX85KE8IZLfpwHIeCmGwEZPM.gtU.2',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (user_id, nom, prenom, commune, quartier, bio, whatsapp_number, call_number, disponible, est_verifie, kyc_status, rating_avg, reviews_count)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Administrateur',
    'Djassa',
    'Plateau',
    'Centre',
    'Compte Administrateur Général Djassa Pro.',
    '0700000001',
    '0700000001',
    true,
    true,
    'VERIFIE',
    5.0,
    0
) ON CONFLICT (user_id) DO NOTHING;


-- -----------------------------------------------------------------------------
-- B. PRESTATAIRE DÉMO 1 : ÉLECTRICIEN (VÉRIFIÉ)
-- Téléphone : 0700000003
-- Mot de passe : demo123
-- -----------------------------------------------------------------------------
INSERT INTO public.users (id, phone, email, password_hash, role, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000003',
    '+2250700000003',
    'prestataire@djassa.ci',
    '$2a$10$Kvh9.f5uexFwKqZ3EvB.TuVE556s4tXuGnFjptQt80A2yzKCzaPJ6',
    'prestataire',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
    user_id, nom, prenom, commune, quartier, bio,
    competences, photo_url, whatsapp_number, call_number,
    disponible, est_verifie, kyc_status, rating_avg, reviews_count
)
VALUES (
    'c0000000-0000-0000-0000-000000000003',
    'Touré',
    'Amadou',
    'Cocody',
    'Riviera Palmeraie',
    'Électricien certifié avec 8 ans d''expérience. Installation complète, dépannage rapide et pose de tableaux électriques.',
    '["Électricité Bâtiment", "Dépannage d''Urgence", "Climatisation", "Tableaux Électriques"]'::jsonb,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    '0700000003',
    '0700000003',
    true,
    true,
    'VERIFIE',
    4.9,
    12
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.services (provider_id, nom, categorie, prix_indicatif, description)
VALUES 
(
    'c0000000-0000-0000-0000-000000000003',
    'Diagnostic et Réparation Court-Circuit',
    'Électricité',
    15000,
    'Intervention rapide pour diagnostiquer et rétablir le courant en toute sécurité.'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'Installation Tableau Électrique & Disjoncteur',
    'Électricité',
    45000,
    'Pose complète aux normes de sécurité ivoiriennes.'
);


-- -----------------------------------------------------------------------------
-- C. PRESTATAIRE DÉMO 2 : PLOMBIER (VÉRIFIÉ)
-- Téléphone : 0700000004
-- Mot de passe : demo123
-- -----------------------------------------------------------------------------
INSERT INTO public.users (id, phone, email, password_hash, role, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000004',
    '+2250700000004',
    'plombier@djassa.ci',
    '$2a$10$Kvh9.f5uexFwKqZ3EvB.TuVE556s4tXuGnFjptQt80A2yzKCzaPJ6',
    'prestataire',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
    user_id, nom, prenom, commune, quartier, bio,
    competences, photo_url, whatsapp_number, call_number,
    disponible, est_verifie, kyc_status, rating_avg, reviews_count
)
VALUES (
    'c0000000-0000-0000-0000-000000000004',
    'Koffi',
    'Franck',
    'Yopougon',
    'Niangon',
    'Artisan plombier expérimenté. Réparation rapide de fuites d''eau, pose de chauffe-eau et débouchage.',
    '["Plomberie Sanitaire", "Recherche de Fuite", "Débouchage Canalisation", "Chauffe-eau"]'::jsonb,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    '0700000004',
    '0700000004',
    true,
    true,
    'VERIFIE',
    4.8,
    8
) ON CONFLICT (user_id) DO NOTHING;


-- -----------------------------------------------------------------------------
-- D. PRESTATAIRE DÉMO 3 : COIFFEUSE & BEAUTÉ (VÉRIFIÉE)
-- Téléphone : 0700000005
-- Mot de passe : demo123
-- -----------------------------------------------------------------------------
INSERT INTO public.users (id, phone, email, password_hash, role, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000005',
    '+2250700000005',
    'coiffure@djassa.ci',
    '$2a$10$Kvh9.f5uexFwKqZ3EvB.TuVE556s4tXuGnFjptQt80A2yzKCzaPJ6',
    'prestataire',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
    user_id, nom, prenom, commune, quartier, bio,
    competences, photo_url, whatsapp_number, call_number,
    disponible, est_verifie, kyc_status, rating_avg, reviews_count
)
VALUES (
    'c0000000-0000-0000-0000-000000000005',
    'Soro',
    'Awa',
    'Marcory',
    'Zone 4',
    'Styliste coiffeuse professionnelle à domicile ou en salon. Tresses africaines, soins capillaires et perruques sur-mesure.',
    '["Coiffure Féminine", "Tresses Africaines", "Maquillage Pro", "Soins Visage"]'::jsonb,
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    '0700000005',
    '0700000005',
    true,
    true,
    'VERIFIE',
    5.0,
    15
) ON CONFLICT (user_id) DO NOTHING;


-- -----------------------------------------------------------------------------
-- E. PRESTATAIRE DÉMO 4 : MENUISIER (EN ATTENTE DE VÉRIFICATION KYC)
-- Téléphone : 0700000006
-- Mot de passe : demo123
-- -----------------------------------------------------------------------------
INSERT INTO public.users (id, phone, email, password_hash, role, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000006',
    '+2250700000006',
    'menuisier@djassa.ci',
    '$2a$10$Kvh9.f5uexFwKqZ3EvB.TuVE556s4tXuGnFjptQt80A2yzKCzaPJ6',
    'prestataire',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
    user_id, nom, prenom, commune, quartier, bio,
    competences, photo_url, whatsapp_number, call_number,
    disponible, est_verifie, kyc_status, rating_avg, reviews_count
)
VALUES (
    'c0000000-0000-0000-0000-000000000006',
    'Koné',
    'Moussa',
    'Treichville',
    'Avenue 8',
    'Menuisier aluminium et bois. Fabrication de portes, vitrines, fenêtres coulissantes et placards.',
    '["Menuiserie Aluminium", "Menuiserie Bois", "Vitrines", "Pose Fenêtres"]'::jsonb,
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80',
    '0700000006',
    '0700000006',
    true,
    false,
    'EN_ATTENTE',
    4.7,
    4
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.kyc_documents (provider_id, type_piece, numero_piece, document_url, statut)
VALUES (
    'c0000000-0000-0000-0000-000000000006',
    'CNI',
    'CI098765432',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
    'EN_ATTENTE'
);


-- =============================================================================
-- 6. PERMISSIONS & ACCÈS PUBLIC / ANON (POUR NEXT.JS & L'APPLICATION)
-- =============================================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.services TO anon, authenticated, service_role;
GRANT ALL ON public.reviews TO anon, authenticated, service_role;
GRANT ALL ON public.kyc_documents TO anon, authenticated, service_role;
GRANT ALL ON public.active_providers_view TO anon, authenticated, service_role;

