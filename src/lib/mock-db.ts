import bcrypt from "bcryptjs";
import { Provider } from "@/types/provider";

export interface MockUser {
  id: string;
  phone: string;
  email?: string;
  password_hash: string;
  role: "client" | "prestataire" | "admin";
  is_active: boolean;
  created_at: string;
}

export interface MockProfile {
  user_id: string;
  nom: string;
  prenom: string;
  commune: string;
  quartier?: string;
  bio?: string;
  competences: string[];
  photo_url: string;
  whatsapp_number?: string;
  call_number?: string;
  disponible: boolean;
  est_verifie: boolean;
  kyc_status: "NON_VERIFIE" | "EN_ATTENTE" | "VERIFIE" | "REJETE";
  rating_avg: number;
  reviews_count: number;
  created_at: string;
}

export interface MockService {
  id: string;
  provider_id: string;
  nom: string;
  categorie: string;
  prix_indicatif: number;
  description?: string;
}

export interface MockReview {
  id: string;
  provider_id: string;
  client_id: string;
  note: number;
  commentaire: string;
  created_at: string;
  client_nom?: string;
  client_prenom?: string;
}

export interface MockKycDocument {
  id: string;
  provider_id: string;
  type_piece: string;
  numero_piece?: string;
  document_url: string;
  statut: "EN_ATTENTE" | "VERIFIE" | "REJETE";
  motif_rejet?: string;
  created_at: string;
}

// Initial Mock Dataset (Empty - Uses Supabase)
const INITIAL_USERS: MockUser[] = [];
const INITIAL_PROFILES: MockProfile[] = [];
const INITIAL_SERVICES: MockService[] = [];
const INITIAL_REVIEWS: MockReview[] = [];
const INITIAL_KYC: MockKycDocument[] = [];

// Global Memory State for Local Development
declare global {
  var __DJASSA_USERS: MockUser[] | undefined;
  var __DJASSA_PROFILES: MockProfile[] | undefined;
  var __DJASSA_SERVICES: MockService[] | undefined;
  var __DJASSA_REVIEWS: MockReview[] | undefined;
  var __DJASSA_KYC: MockKycDocument[] | undefined;
}

if (!global.__DJASSA_USERS) {
  global.__DJASSA_USERS = [...INITIAL_USERS];
}
if (!global.__DJASSA_PROFILES) {
  global.__DJASSA_PROFILES = [...INITIAL_PROFILES];
}
if (!global.__DJASSA_SERVICES) {
  global.__DJASSA_SERVICES = [...INITIAL_SERVICES];
}
if (!global.__DJASSA_REVIEWS) {
  global.__DJASSA_REVIEWS = [...INITIAL_REVIEWS];
}
if (!global.__DJASSA_KYC) {
  global.__DJASSA_KYC = [...INITIAL_KYC];
}

export const MockDb = {
  // Users
  getUsers: () => global.__DJASSA_USERS!,
  findUserById: (id: string) => global.__DJASSA_USERS!.find((u) => u.id === id),
  findUserByIdentifier: (identifier: string) => {
    const clean = identifier.trim().toLowerCase();
    const phoneNormalized = `+225${clean.replace(/\D/g, "").slice(-10)}`;
    return global.__DJASSA_USERS!.find(
      (u) =>
        u.phone === clean ||
        u.phone === phoneNormalized ||
        (u.email && u.email.toLowerCase() === clean)
    );
  },
  updateUser: (id: string, data: Partial<MockUser>) => {
    const idx = global.__DJASSA_USERS!.findIndex((u) => u.id === id);
    if (idx !== -1) {
      global.__DJASSA_USERS![idx] = { ...global.__DJASSA_USERS![idx], ...data };
      return global.__DJASSA_USERS![idx];
    }
    return null;
  },
  createUser: (user: MockUser, profile: MockProfile, services: MockService[] = []) => {
    global.__DJASSA_USERS!.push(user);
    global.__DJASSA_PROFILES!.push(profile);
    if (services.length > 0) {
      global.__DJASSA_SERVICES!.push(...services);
    }
    return { user, profile };
  },

  // Profiles
  getProfiles: () => global.__DJASSA_PROFILES!,
  findProfileByUserId: (userId: string) =>
    global.__DJASSA_PROFILES!.find((p) => p.user_id === userId),
  updateProfile: (userId: string, data: Partial<MockProfile>) => {
    const index = global.__DJASSA_PROFILES!.findIndex((p) => p.user_id === userId);
    if (index !== -1) {
      global.__DJASSA_PROFILES![index] = {
        ...global.__DJASSA_PROFILES![index],
        ...data,
      };
      return global.__DJASSA_PROFILES![index];
    }
    return null;
  },

  // Moderation / Inscription Rejet & Approbation
  rejectProvider: (providerId: string, motifRejet: string = "Dossier ou photo non conforme") => {
    // 1. Désactiver le compte utilisateur
    MockDb.updateUser(providerId, { is_active: false });

    // 2. Mettre à jour le statut KYC et masquer la disponibilité
    MockDb.updateProfile(providerId, {
      est_verifie: false,
      kyc_status: "REJETE",
      disponible: false,
    });

    // 3. Mettre à jour le document KYC
    const kyc = global.__DJASSA_KYC!.find((k) => k.provider_id === providerId);
    if (kyc) {
      kyc.statut = "REJETE";
      kyc.motif_rejet = motifRejet;
    }

    return { success: true, providerId, status: "REJETE", motifRejet };
  },

  approveProvider: (providerId: string) => {
    MockDb.updateUser(providerId, { is_active: true });
    MockDb.updateProfile(providerId, {
      est_verifie: true,
      kyc_status: "VERIFIE",
      disponible: true,
    });

    const kyc = global.__DJASSA_KYC!.find((k) => k.provider_id === providerId);
    if (kyc) {
      kyc.statut = "VERIFIE";
      kyc.motif_rejet = undefined;
    }

    return { success: true, providerId, status: "VERIFIE" };
  },

  activateProvider: (providerId: string) => {
    MockDb.updateUser(providerId, { is_active: true });
    MockDb.updateProfile(providerId, {
      kyc_status: "NON_VERIFIE",
      disponible: true,
    });
    return { success: true, providerId, status: "ACTIF" };
  },

  // Services
  getServicesByProviderId: (providerId: string) =>
    global.__DJASSA_SERVICES!.filter((s) => s.provider_id === providerId),
  addService: (service: MockService) => {
    global.__DJASSA_SERVICES!.push(service);
    return service;
  },

  // Reviews
  getReviewsByProviderId: (providerId: string) =>
    global.__DJASSA_REVIEWS!.filter((r) => r.provider_id === providerId),
  addReview: (review: Omit<MockReview, "id" | "created_at">) => {
    const clientProfile = MockDb.findProfileByUserId(review.client_id);
    const newRev: MockReview = {
      ...review,
      id: `r-${Date.now()}`,
      created_at: new Date().toISOString(),
      client_nom: clientProfile?.nom || "Client",
      client_prenom: clientProfile?.prenom || "Djassa",
    };
    global.__DJASSA_REVIEWS!.push(newRev);

    // Mettre à jour la moyenne du prestataire
    const allProviderReviews = MockDb.getReviewsByProviderId(review.provider_id);
    const avg =
      allProviderReviews.reduce((sum, r) => sum + r.note, 0) /
      allProviderReviews.length;
    MockDb.updateProfile(review.provider_id, {
      rating_avg: Number(avg.toFixed(1)),
      reviews_count: allProviderReviews.length,
    });

    return newRev;
  },

  // KYC
  getKycDocuments: () => global.__DJASSA_KYC!,
  findKycByProviderId: (providerId: string) =>
    global.__DJASSA_KYC!.find((k) => k.provider_id === providerId),
  addKycDocument: (kyc: MockKycDocument) => {
    global.__DJASSA_KYC!.push(kyc);
    MockDb.updateProfile(kyc.provider_id, { kyc_status: "EN_ATTENTE" });
    return kyc;
  },
  updateKycStatus: (
    providerId: string,
    statut: "VERIFIE" | "REJETE",
    motifRejet?: string
  ) => {
    if (statut === "REJETE") {
      return MockDb.rejectProvider(providerId, motifRejet);
    } else {
      return MockDb.approveProvider(providerId);
    }
  },

  // Providers list formatting - NE RETOURNE QUE LES PRESTATAIRES ACTIFS ET NON REJETÉS
  getFeaturedProviders: (): Provider[] => {
    return global
      .__DJASSA_PROFILES!.filter((p) => {
        const user = global.__DJASSA_USERS!.find((u) => u.id === p.user_id);
        const isActive = user?.is_active ?? true;
        const isNotRejected = p.kyc_status !== "REJETE";
        return user?.role === "prestataire" && isActive && isNotRejected && p.disponible;
      })
      .map((p) => {
        const services = MockDb.getServicesByProviderId(p.user_id);
        const mainService = services[0];
        return {
          id: p.user_id,
          nom: p.nom,
          prenom: p.prenom,
          commune: p.commune,
          quartier: p.quartier,
          specialite: mainService?.categorie || p.competences[0] || "Artisan Pro",
          note: p.rating_avg,
          avisCount: p.reviews_count,
          prixIndicatif: mainService?.prix_indicatif || 10000,
          photoUrl: p.photo_url,
          estVerifie: p.est_verifie,
          disponible: p.disponible,
          whatsappNumber: p.whatsapp_number || "0700000000",
          callNumber: p.call_number,
          competences: p.competences,
        };
      });
  },

  // Admin stats
  getAdminData: () => {
    const users = global.__DJASSA_USERS!;
    const profiles = global.__DJASSA_PROFILES!;
    const kycDocs = global.__DJASSA_KYC!;

    const providers = profiles
      .filter((p) => {
        const u = users.find((user) => user.id === p.user_id);
        return u?.role === "prestataire";
      })
      .map((p) => {
        const user = users.find((u) => u.id === p.user_id);
        const kyc = kycDocs.find((k) => k.provider_id === p.user_id);
        const services = MockDb.getServicesByProviderId(p.user_id);
        const isActive = user?.is_active ?? true;

        return {
          id: p.user_id,
          nom: p.nom,
          prenom: p.prenom,
          phone: user?.phone || p.call_number || "",
          email: user?.email,
          commune: p.commune,
          quartier: p.quartier,
          specialite: services[0]?.categorie || p.competences[0] || "Artisan",
          disponible: p.disponible,
          estVerifie: p.est_verifie,
          kycStatus: p.kyc_status,
          isActive: isActive,
          motifRejet: kyc?.motif_rejet,
          documentUrl: kyc?.document_url,
          typePiece: kyc?.type_piece || "CNI",
          createdAt: p.created_at,
        };
      });

    return {
      stats: {
        totalUsers: users.length,
        totalProviders: providers.length,
        verifiedProviders: providers.filter((p) => p.estVerifie && p.isActive).length,
        pendingKyc: providers.filter((p) => p.kycStatus === "EN_ATTENTE" && p.isActive).length,
        rejectedProviders: providers.filter((p) => !p.isActive || p.kycStatus === "REJETE").length,
      },
      providers,
    };
  },
};
