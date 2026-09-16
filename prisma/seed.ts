import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début de l'amorçage de la base de données Djassa Pro...");

  // Nettoyage préalable
  await prisma.adminAuditLog.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.kycDocument.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("DjassaPass2026!", 10);
  const adminPasswordHash = await bcrypt.hash("BakayokoAdmin2026!", 12);
  const soryPasswordHash = await bcrypt.hash("SoryPro2026!", 10);

  // 1. ADMINISTRATEUR PRINCIPAL — Bakayoko Sory (Créateur de la plateforme)
  const adminUser = await prisma.user.create({
    data: {
      phone: "+2250700000001",
      email: "bakayoko.sory@djassapro.ci",
      passwordHash: adminPasswordHash,
      role: "admin",
      profile: {
        create: {
          nom: "Bakayoko",
          prenom: "Sory",
          commune: "Plateau",
          quartier: "Immeuble CCIA",
          bio: "Fondateur et administrateur de Djassa Pro. Ingénieur passionné par l'insertion professionnelle des jeunes ivoiriens.",
          disponible: true,
          estVerifie: true,
          kycStatus: "VERIFIE",
        },
      },
    },
  });
  console.log(`✅ Administrateur principal créé : ${adminUser.email}`);

  // 2. Compte Prestataire Personnel de Sory (compte de test du fondateur)
  const soryProviderUser = await prisma.user.create({
    data: {
      phone: "+2250707070707",
      email: "sory.prestataire@djassapro.ci",
      passwordHash: soryPasswordHash,
      role: "prestataire",
      profile: {
        create: {
          nom: "Bakayoko",
          prenom: "Sory",
          commune: "Cocody",
          quartier: "Angré Star 11",
          bio: "Développeur web et concepteur d'applications mobiles. Création de sites vitrine, e-commerce et applications pour PME ivoiriennes. Fondateur de Djassa Pro.",
          competences: JSON.stringify(["Développement Web", "Création d'applications", "Design UI/UX"]),
          photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
          whatsappNumber: "0707070707",
          callNumber: "0707070707",
          disponible: true,
          estVerifie: true,
          kycStatus: "VERIFIE",
          ratingAvg: 5.0,
          reviewsCount: 1,
          services: {
            create: [
              {
                nom: "Création de site web professionnel",
                categorie: "Informatique & Tech",
                prixIndicatif: 150000,
                description: "Site vitrine ou e-commerce complet, responsive, livré en 7 jours avec domaine et hébergement inclus.",
              },
            ],
          },
          kycDocuments: {
            create: [
              {
                typePiece: "CNI",
                numeroPiece: "CI-SORY-2026",
                documentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
                statut: "VERIFIE",
              },
            ],
          },
        },
      },
    },
  });
  console.log(`✅ Prestataire personnel créé : ${soryProviderUser.email}`);

  // 3. Prestataires réels et réalistes pour Abidjan
  const providersData = [
    {
      phone: "+2250701020304",
      email: "jean.kouassi@djassapro.ci",
      nom: "Kouassi",
      prenom: "Jean-Eudes",
      commune: "Cocody",
      quartier: "Angré 8ème Tranche",
      bio: "Plombier qualifié certifié CAP. Dépannage rapide de fuites d'eau, installation de sanitaires et robinetterie à Cocody et environs.",
      competences: ["Plomberie sanitaire", "Recherche de fuite", "Installation chauffe-eau"],
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      whatsappNumber: "0701020304",
      callNumber: "0701020304",
      disponible: true,
      estVerifie: true,
      kycStatus: "VERIFIE" as const,
      ratingAvg: 4.9,
      reviewsCount: 34,
      services: [
        {
          nom: "Dépannage plomberie urgente & fuite d'eau",
          categorie: "Plomberie",
          prixIndicatif: 5000,
          description: "Intervention rapide à domicile sous 1h pour colmater une fuite ou réparer vos canalisations.",
        },
        {
          nom: "Installation robinetterie & WC",
          categorie: "Plomberie",
          prixIndicatif: 15000,
          description: "Pose complète de mitigeur, lavabo et mécanisme de chasse d'eau.",
        },
      ],
    },
    {
      phone: "+2250505060708",
      email: "aicha.toure@djassapro.ci",
      nom: "Touré",
      prenom: "Aïcha",
      commune: "Yopougon",
      quartier: "Niangon Sud",
      bio: "Coiffeuse professionnelle passionnée. Spécialiste des nattes collées, rastas, tresses sénégalaises et soins capillaires naturels à domicile.",
      competences: ["Tresses africaines", "Perruques & Tissages", "Soins cheveux afro"],
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      whatsappNumber: "0505060708",
      callNumber: "0505060708",
      disponible: true,
      estVerifie: true,
      kycStatus: "VERIFIE" as const,
      ratingAvg: 5.0,
      reviewsCount: 52,
      services: [
        {
          nom: "Tresses & Nattes africaines à domicile",
          categorie: "Coiffure & Beauté",
          prixIndicatif: 3500,
          description: "Nattes collées simples ou avec mèches, finitions soignées sans douleur.",
        },
        {
          nom: "Pose de tissage et perruque",
          categorie: "Coiffure & Beauté",
          prixIndicatif: 6000,
          description: "Pose avec ou sans colle, coiffage et lissage inclus.",
        },
      ],
    },
    {
      phone: "+2250102030405",
      email: "amadou.bakayoko@djassapro.ci",
      nom: "Bakayoko",
      prenom: "Amadou",
      commune: "Koumassi",
      quartier: "Remblais",
      bio: "Électricien bâtiment et frigoriste. Dépannage de disjoncteur, câblage complet et entretien de climatiseurs split.",
      competences: ["Électricité générale", "Entretien climatiseur", "Mise aux normes"],
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      whatsappNumber: "0102030405",
      callNumber: "0102030405",
      disponible: true,
      estVerifie: true,
      kycStatus: "VERIFIE" as const,
      ratingAvg: 4.8,
      reviewsCount: 22,
      services: [
        {
          nom: "Nettoyage & Recharge gaz climatiseur Split",
          categorie: "Climatisation & Électricité",
          prixIndicatif: 10000,
          description: "Entretien préventif avec produit antibactérien et contrôle de pression de gaz.",
        },
        {
          nom: "Dépannage panne électrique & court-circuit",
          categorie: "Électricité",
          prixIndicatif: 7000,
          description: "Localisation de panne, remplacement de disjoncteur ou prise grillée.",
        },
      ],
    },
    {
      phone: "+2250709080706",
      email: "stephane.yao@djassapro.ci",
      nom: "Yao",
      prenom: "Koffi Stéphane",
      commune: "Cocody",
      quartier: "Riviera Palmeraie",
      bio: "Étudiant en Master Mathématiques Appliquées à l'Université FHB. Soutien scolaire et remise à niveau pour collégiens et lycéens.",
      competences: ["Mathématiques", "Physique-Chimie", "Préparation BEPC & BAC"],
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
      whatsappNumber: "0709080706",
      callNumber: "0709080706",
      disponible: true,
      estVerifie: true,
      kycStatus: "VERIFIE" as const,
      ratingAvg: 4.9,
      reviewsCount: 18,
      services: [
        {
          nom: "Cours particulier de Mathématiques (2h)",
          categorie: "Soutien Scolaire",
          prixIndicatif: 5000,
          description: "Explications méthodiques des cours et résolution guidée des exercices types examens.",
        },
      ],
    },
    {
      phone: "+2250508091011",
      email: "fatou.bamba@djassapro.ci",
      nom: "Bamba",
      prenom: "Fatoumata",
      commune: "Marcory",
      quartier: "Zone 4",
      bio: "Experte en entretien ménager, repassage et grand nettoyage après déménagement. Ponctuelle, discrète et minutieuse.",
      competences: ["Ménage approfondi", "Repassage soigné", "Nettoyage vitres"],
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
      whatsappNumber: "0508091011",
      callNumber: "0508091011",
      disponible: true,
      estVerifie: true,
      kycStatus: "VERIFIE" as const,
      ratingAvg: 4.85,
      reviewsCount: 29,
      services: [
        {
          nom: "Ménage à domicile & Repassage (Demi-journée)",
          categorie: "Ménage & Maison",
          prixIndicatif: 8000,
          description: "Nettoyage complet du sol, cuisine, sanitaires et repassage de votre linge.",
        },
      ],
    },
    {
      phone: "+2250109080706",
      email: "eric.koffi@djassapro.ci",
      nom: "Koffi",
      prenom: "Éric",
      commune: "Abobo",
      quartier: "Abobo Baoulé",
      bio: "Livreur express à moto avec glacière étanche. Courses rapides de colis, repas et documents administratifs dans tout Abidjan.",
      competences: ["Livraison express", "Courses urgentes", "Moto sécurisée"],
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
      whatsappNumber: "0109080706",
      callNumber: "0109080706",
      disponible: true,
      estVerifie: false, // En attente pour tester la modération admin
      kycStatus: "EN_ATTENTE" as const,
      ratingAvg: 4.5,
      reviewsCount: 6,
      services: [
        {
          nom: "Course de livraison express moto (Inter-communes)",
          categorie: "Livraison & Courses",
          prixIndicatif: 2500,
          description: "Livraison de vos paquets en moins de 90 minutes entre communes d'Abidjan.",
        },
      ],
    },
  ];

  for (const p of providersData) {
    const user = await prisma.user.create({
      data: {
        phone: p.phone,
        email: p.email,
        passwordHash: defaultPasswordHash,
        role: "prestataire",
        profile: {
          create: {
            nom: p.nom,
            prenom: p.prenom,
            commune: p.commune,
            quartier: p.quartier,
            bio: p.bio,
            competences: JSON.stringify(p.competences),
            photoUrl: p.photoUrl,
            whatsappNumber: p.whatsappNumber,
            callNumber: p.callNumber,
            disponible: p.disponible,
            estVerifie: p.estVerifie,
            kycStatus: p.kycStatus,
            ratingAvg: p.ratingAvg,
            reviewsCount: p.reviewsCount,
            services: {
              create: p.services,
            },
            kycDocuments: {
              create: [
                {
                  typePiece: "CNI",
                  numeroPiece: "CI-00289192",
                  documentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
                  statut: p.kycStatus,
                },
              ],
            },
          },
        },
      },
    });
    console.log(`✅ Prestataire ajouté : ${p.prenom} ${p.nom} (${p.commune})`);
  }

  console.log("\n🎉 Amorçage terminé avec succès !");
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("  🔑  IDENTIFIANTS DE CONNEXION — DJASSA PRO");
  console.log("════════════════════════════════════════════════════════════════");
  console.log("");
  console.log("  👑  ADMINISTRATEUR (accès Back-Office /admin)");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Email    : bakayoko.sory@djassapro.ci");
  console.log("  Téléphone: 0700000001");
  console.log("  Mot de passe: BakayokoAdmin2026!");
  console.log("  → Rôle : admin  |  Redirigé vers : /admin");
  console.log("");
  console.log("  🧑‍💼  PRESTATAIRE PERSONNEL (Sory — compte de test)");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Email    : sory.prestataire@djassapro.ci");
  console.log("  Téléphone: 0707070707");
  console.log("  Mot de passe: SoryPro2026!");
  console.log("  → Rôle : prestataire  |  Redirigé vers : /dashboard/prestataire");
  console.log("");
  console.log("  👷  PRESTATAIRES DE DÉMONSTRATION (mot de passe universel)");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Mot de passe : DjassaPass2026!");
  console.log("  Exemples : jean.kouassi@djassapro.ci | aicha.toure@djassapro.ci");
  console.log("");
  console.log("════════════════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("Erreur d'amorçage :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
