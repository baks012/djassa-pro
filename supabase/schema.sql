-- ==============================================================================
-- DJASSA PRO - SCRIPT SQL DE PRODUCTION POSTGRESQL & SUPABASE (AVEC RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Énumérations
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'prestataire', 'admin');
    CREATE TYPE verification_status AS ENUM ('NON_VERIFIE', 'EN_ATTENTE', 'VERIFIE', 'REJETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table USERS
CREATE TABLE IF NOT EXISTS public."User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT chk_phone_format CHECK (phone ~ '^\+225[0-9]{10}$')
);

-- Table PROFILES
CREATE TABLE IF NOT EXISTS public."Profile" (
    "userId" UUID PRIMARY KEY REFERENCES public."User"(id) ON DELETE CASCADE,
    nom VARCHAR(80) NOT NULL,
    prenom VARCHAR(80) NOT NULL,
    commune VARCHAR(80) NOT NULL,
    quartier VARCHAR(100),
    bio TEXT,
    competences TEXT[] DEFAULT '{}',
    "photoUrl" TEXT,
    "whatsappNumber" VARCHAR(20),
    "callNumber" VARCHAR(20),
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    "estVerifie" BOOLEAN NOT NULL DEFAULT FALSE,
    "kycStatus" verification_status NOT NULL DEFAULT 'NON_VERIFIE',
    "ratingAvg" NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table SERVICES
CREATE TABLE IF NOT EXISTS public."Service" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "providerId" UUID NOT NULL REFERENCES public."Profile"("userId") ON DELETE CASCADE,
    nom VARCHAR(120) NOT NULL,
    categorie VARCHAR(80) NOT NULL,
    "prixIndicatif" NUMERIC(12, 2) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public."Profile"(commune, disponible, "estVerifie");
CREATE INDEX IF NOT EXISTS idx_services_category ON public."Service"(categorie);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & POLITIQUES DE SÉCURITÉ
-- ==============================================================================

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Service" ENABLE ROW LEVEL SECURITY;

-- Fonction d'aide pour détecter l'administrateur
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public."User"
        WHERE id = uid AND role = 'admin'
    );
$$;

-- Trigger cyber : Interdiction formelle à un utilisateur normal de modifier "estVerifie"
CREATE OR REPLACE FUNCTION public.protect_profile_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (NEW."estVerifie" IS DISTINCT FROM OLD."estVerifie") THEN
        IF NOT public.is_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Action interdite : Seul un administrateur peut modifier le statut de vérification.';
        END IF;
    END IF;
    NEW."updatedAt" = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_verification ON public."Profile";
CREATE TRIGGER trg_protect_profile_verification
    BEFORE UPDATE ON public."Profile"
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_verification();

-- Politiques RLS
-- 1. Visibilité publique : Uniquement les prestataires disponibles et vérifiés
CREATE POLICY "Public can view verified and available profiles"
ON public."Profile" FOR SELECT
USING (
    (disponible = TRUE AND "estVerifie" = TRUE)
    OR ("userId" = auth.uid())
    OR public.is_admin(auth.uid())
);

-- 2. Modification du profil par le propriétaire
CREATE POLICY "Users can update own profile"
ON public."Profile" FOR UPDATE
USING ("userId" = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK ("userId" = auth.uid() OR public.is_admin(auth.uid()));

-- 3. Visibilité des services
CREATE POLICY "Public can view services of verified providers"
ON public."Service" FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public."Profile" p
        WHERE p."userId" = "Service"."providerId"
          AND p.disponible = TRUE
          AND p."estVerifie" = TRUE
    )
    OR ("providerId" = auth.uid())
    OR public.is_admin(auth.uid())
);
