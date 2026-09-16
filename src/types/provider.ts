export interface Provider {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  commune: string;
  quartier?: string | null;
  bio?: string | null;
  competences: string[];
  prixIndicatif: number;
  photoUrl: string;
  whatsappNumber: string;
  callNumber?: string | null;
  estVerifie: boolean;
  disponible: boolean;
  note: number;
  avisCount: number;
  services?: {
    id: string;
    nom: string;
    categorie: string;
    prixIndicatif: number;
    description?: string | null;
  }[];
}

export interface SearchFilters {
  query?: string;
  commune?: string;
  categorie?: string;
  onlyVerified?: boolean;
}
