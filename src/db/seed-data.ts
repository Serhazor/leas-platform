/**
 * Initial French content used by `npm run db:seed`.
 * Everything here is editable afterwards from /admin — nothing is read from this
 * file at runtime. No testimonials, figures, certifications or claims are invented:
 * the owner completes her biography, experience and qualifications from the admin.
 */
import type { SectionItem } from "./schema";

type SeedSection = {
  key: string;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  cta2Label?: string;
  cta2Href?: string;
  items?: SectionItem[];
  isVisible?: boolean;
};

type SeedPage = {
  key: string;
  path: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  sections: SeedSection[];
};

export const seedSettings = {
  companyName: "Leas",
  tagline: "États des lieux, conciergerie et assistance professionnelle",
  footerText:
    "Prestataire indépendante de services immobiliers et d'accompagnement professionnel. Intervention pour le compte des agences, gestionnaires, propriétaires et entreprises.",
  seoTitle: "Leas — États des lieux, conciergerie et assistance professionnelle",
  seoDescription:
    "États des lieux d'entrée et de sortie, inspections de logements, conciergerie à la demande, assistance administrative et commerciale : un relais fiable pour les professionnels de l'immobilier et les entreprises.",
  emailSenderName: "Leas",
  emailSignature: "À très bientôt,\nL'équipe Leas",
  hostingInfo:
    "Vercel Inc.\n440 N Barranca Ave #4133\nCovina, CA 91723, États-Unis\nhttps://vercel.com",
  contactHoursNote: "Réponse sous 24 h ouvrées",
};

export const seedCategories = [
  { slug: "services-immobiliers", name: "Services immobiliers", description: "États des lieux et inspections de biens locatifs.", position: 1 },
  { slug: "conciergerie", name: "Conciergerie", description: "Un relais sur place, à la demande.", position: 2 },
  { slug: "assistance-administrative", name: "Assistance administrative", description: "Du temps libéré pour l'essentiel.", position: 3 },
  { slug: "assistance-commerciale", name: "Assistance commerciale", description: "Un appui pour votre développement.", position: 4 },
  { slug: "evenementiel", name: "Événementiel", description: "Coordination et logistique d'événements.", position: 5 },
];

export const seedServices = [
  {
    slug: "etat-des-lieux-entree",
    category: "services-immobiliers",
    title: "État des lieux d'entrée",
    icon: "key",
    durationMinutes: 90,
    requiresAddress: true,
    shortDescription:
      "Un état des lieux détaillé à la remise des clés, pièce par pièce et photos à l'appui.",
    description: `L'état des lieux d'entrée est le document de référence de toute la location. Il décrit précisément l'état du logement au moment où le locataire en prend possession.

J'interviens pour votre compte, en présence du locataire, et je réalise un constat complet et objectif.

## Ce que comprend la prestation
- Description détaillée de chaque pièce : sols, murs, plafonds, menuiseries, équipements
- Photographies des éléments significatifs
- Relevés des compteurs (eau, électricité, gaz le cas échéant)
- Inventaire des clés et badges remis
- Inventaire du mobilier pour les locations meublées

## Pour qui ?
Agences immobilières, administrateurs de biens, sociétés de gestion locative et propriétaires bailleurs qui souhaitent déléguer cette étape.`,
    ctaLabel: "Réserver un état des lieux",
    seoTitle: "État des lieux d'entrée pour agences et propriétaires",
    seoDescription:
      "État des lieux d'entrée réalisé pour votre compte : description pièce par pièce, photos, relevés de compteurs et inventaire des clés.",
  },
  {
    slug: "etat-des-lieux-sortie",
    category: "services-immobiliers",
    title: "État des lieux de sortie",
    icon: "door",
    durationMinutes: 90,
    requiresAddress: true,
    shortDescription:
      "Un constat rigoureux au départ du locataire, comparable point par point avec l'entrée.",
    description: `À la restitution des clés, le logement est examiné selon la même méthode que lors de l'entrée. Les écarts constatés sont décrits de manière factuelle et documentée.

Un état des lieux de sortie clair facilite les échanges entre le bailleur et le locataire, notamment au moment de la restitution du dépôt de garantie.

## Ce que comprend la prestation
- Vérification de chaque pièce et de chaque équipement
- Description précise des différences constatées
- Photographies à l'appui
- Relevés des compteurs et restitution des clés

## Pour qui ?
Professionnels de la gestion locative et propriétaires qui ne peuvent pas être présents ou qui souhaitent un constat réalisé par un tiers.`,
    ctaLabel: "Réserver un état des lieux",
    seoTitle: "État des lieux de sortie réalisé pour votre compte",
    seoDescription:
      "État des lieux de sortie précis et documenté, réalisé pour les agences, gestionnaires et propriétaires bailleurs.",
  },
  {
    slug: "inspection-constat-logement",
    category: "services-immobiliers",
    title: "Inspection et constat de logement",
    icon: "search",
    durationMinutes: 60,
    requiresAddress: true,
    shortDescription:
      "Une visite de contrôle en cours de bail, avant une remise en location ou après travaux.",
    description: `Vous avez besoin de connaître l'état d'un bien sans vous déplacer ? Je réalise une visite de contrôle et vous transmets un compte rendu illustré.

## Situations fréquentes
- Visite en cours de bail, avec l'accord du locataire
- Vérification avant une remise en location
- Contrôle après travaux ou après un sinistre
- Point sur l'état d'un logement vacant

Le compte rendu décrit les constats de façon neutre et factuelle, photos à l'appui.`,
    ctaLabel: "Demander une inspection",
    seoTitle: "Inspection et constat de logement locatif",
    seoDescription:
      "Visite de contrôle d'un bien locatif avec compte rendu illustré : en cours de bail, avant relocation ou après travaux.",
  },
  {
    slug: "conciergerie-a-la-demande",
    category: "conciergerie",
    title: "Conciergerie à la demande",
    icon: "bell",
    durationMinutes: 60,
    requiresAddress: true,
    shortDescription:
      "Remise de clés, accueil, vérification du logement : un relais sur place quand vous ne pouvez pas l'être.",
    description: `Certaines missions demandent simplement qu'une personne de confiance soit présente au bon moment. Je vous propose un service de conciergerie ponctuel, sans abonnement.

## Exemples de missions
- Remise ou récupération de clés
- Accueil de locataires ou de voyageurs
- Vérification d'un logement entre deux occupations
- Présence lors du passage d'un artisan ou d'un prestataire
- Relevé de courrier ou contrôle ponctuel d'un bien inoccupé

Chaque mission fait l'objet d'un retour rapide, par message ou par e-mail.`,
    ctaLabel: "Réserver une intervention",
    seoTitle: "Conciergerie à la demande pour propriétaires et gestionnaires",
    seoDescription:
      "Remise de clés, accueil, vérification de logement, présence lors d'interventions : un service de conciergerie ponctuel et fiable.",
  },
  {
    slug: "assistance-administrative",
    category: "assistance-administrative",
    title: "Assistance administrative",
    icon: "file",
    durationMinutes: 45,
    requiresAddress: false,
    shortDescription:
      "Gestion de dossiers, courriers, classement et suivi : du temps libéré pour l'essentiel.",
    description: `Les tâches administratives s'accumulent vite et prennent du temps sur votre cœur de métier. Je peux vous en décharger, ponctuellement ou de façon régulière.

## Exemples de missions
- Préparation et suivi de dossiers
- Rédaction et mise en forme de courriers
- Classement et archivage de documents
- Saisie et mise à jour de données
- Suivi des relances et des échéances

Le premier rendez-vous, par téléphone ou en visioconférence, permet de faire le point sur vos besoins et de définir une organisation adaptée.`,
    ctaLabel: "Prendre rendez-vous",
    seoTitle: "Assistance administrative pour professionnels",
    seoDescription:
      "Gestion de dossiers, courriers, classement, saisie et suivi : une assistance administrative ponctuelle ou régulière.",
  },
  {
    slug: "assistance-commerciale",
    category: "assistance-commerciale",
    title: "Assistance commerciale",
    icon: "briefcase",
    durationMinutes: 45,
    requiresAddress: false,
    shortDescription:
      "Relances, suivi clients, organisation d'agenda : un appui pour votre développement.",
    description: `Développer son activité demande de la régularité : relancer, suivre, organiser. Je vous accompagne sur ces tâches pour que les opportunités ne restent pas en attente.

## Exemples de missions
- Suivi et relance de prospects ou de clients
- Organisation de rendez-vous et gestion d'agenda
- Préparation de documents commerciaux
- Mise à jour de votre fichier clients

Le premier rendez-vous, par téléphone ou en visioconférence, permet de définir ensemble le périmètre de la mission.`,
    ctaLabel: "Prendre rendez-vous",
    seoTitle: "Assistance commerciale externalisée",
    seoDescription:
      "Relances, suivi clients, organisation d'agenda et préparation de documents : un appui commercial ponctuel ou régulier.",
  },
  {
    slug: "coordination-evenementielle",
    category: "evenementiel",
    title: "Coordination d'événements",
    icon: "calendar",
    durationMinutes: 60,
    requiresAddress: false,
    isComingSoon: true,
    bookingEnabled: false,
    isFeatured: false,
    shortDescription:
      "Mariages, anniversaires, événements sportifs ou professionnels : coordination et logistique le jour J.",
    description: `Un accompagnement pour la coordination et la logistique de vos événements sera bientôt proposé : mariages, anniversaires, événements sportifs ou professionnels.

Vous avez un projet ? N'hésitez pas à me contacter dès maintenant pour en parler.`,
    ctaLabel: "Me contacter",
    seoTitle: "Coordination d'événements — bientôt disponible",
    seoDescription:
      "Coordination et logistique de mariages, anniversaires et événements : un nouveau service bientôt disponible.",
  },
];

export const seedProcessSteps = [
  {
    title: "Choisissez votre service",
    description:
      "Sélectionnez la prestation qui correspond à votre besoin : état des lieux, conciergerie, assistance… En cas de doute, contactez-moi.",
  },
  {
    title: "Envoyez votre demande",
    description:
      "Choisissez une date et un horaire parmi les créneaux disponibles, puis indiquez l'adresse et les informations utiles.",
  },
  {
    title: "Nous confirmons les détails",
    description:
      "Je reviens vers vous pour valider le rendez-vous et préciser, si besoin, l'accès au logement, les personnes présentes ou les documents nécessaires.",
  },
  {
    title: "Le service est réalisé",
    description: "J'interviens à la date convenue, avec méthode et ponctualité.",
  },
  {
    title: "Vous recevez les documents ou le suivi approprié",
    description:
      "Selon la prestation : état des lieux, compte rendu, suivi administratif… transmis dans les délais convenus.",
  },
];

export const seedFaqs = [
  {
    question: "Êtes-vous une agence immobilière ?",
    answer:
      "Non. J'interviens en tant que prestataire indépendante, pour le compte des agences, des gestionnaires, des propriétaires et des entreprises. Je ne propose ni location, ni vente, ni gestion de biens.",
    showOnHome: true,
  },
  {
    question: "Travaillez-vous avec les agences et les sociétés de gestion locative ?",
    answer:
      "Oui, c'est l'un des cas les plus fréquents. Vous pouvez me confier des états des lieux ponctuellement, lors de pics d'activité, ou de manière régulière. Je m'adapte à vos procédures et à vos modèles de documents.",
    showOnHome: true,
  },
  {
    question: "Comment se déroule un état des lieux ?",
    answer:
      "Je me présente au logement à l'heure convenue, en présence du locataire. Chaque pièce est examinée et décrite, les compteurs sont relevés et les clés inventoriées. Le document est ensuite finalisé et transmis aux parties.",
    showOnHome: true,
  },
  {
    question: "Quels documents recevez-vous après l'intervention ?",
    answer:
      "Pour un état des lieux, vous recevez un document numérique complet : description pièce par pièce, photographies, relevés de compteurs et inventaire des clés. Pour les autres prestations, un compte rendu adapté à la mission vous est transmis.",
    showOnHome: false,
  },
  {
    question: "Combien coûte une prestation ?",
    answer:
      "Le tarif dépend du type de prestation, de la surface du logement et du volume de missions confiées. Un devis vous est communiqué avant toute intervention.",
    showOnHome: true,
  },
  {
    question: "Ma réservation est-elle confirmée immédiatement ?",
    answer:
      "Dès l'envoi de votre demande, vous recevez un e-mail récapitulatif. Selon le service et les disponibilités, le rendez-vous est soit confirmé immédiatement, soit validé personnellement dans les meilleurs délais. Dans tous les cas, vous êtes informé par e-mail.",
    showOnHome: false,
  },
  {
    question: "Puis-je modifier ou annuler un rendez-vous ?",
    answer:
      "Oui. Prévenez-moi dès que possible par téléphone ou par e-mail afin que nous trouvions un autre créneau.",
    showOnHome: false,
  },
  {
    question: "Dans quel secteur intervenez-vous ?",
    answer:
      "Le secteur d'intervention est indiqué sur la page Contact. Pour une mission en dehors de ce secteur, contactez-moi : chaque demande est étudiée.",
    showOnHome: false,
  },
  {
    question: "Proposez-vous des services pour les événements ?",
    answer:
      "Des services de coordination d'événements (mariages, anniversaires, événements sportifs ou professionnels) seront proposés prochainement. Vous pouvez déjà me contacter pour en parler.",
    showOnHome: false,
  },
];

/** Weekly hours. weekday: 1 = lundi … 7 = dimanche. */
export const seedAvailability = [
  { weekday: 1, startTime: "09:00", endTime: "17:00" },
  { weekday: 2, startTime: "09:00", endTime: "17:00" },
  { weekday: 4, startTime: "10:00", endTime: "18:00" },
  { weekday: 5, startTime: "09:00", endTime: "16:00" },
];

const legalPrivacy = `Cette politique explique quelles données personnelles sont collectées sur ce site, pourquoi, pendant combien de temps et quels sont vos droits. Les coordonnées du responsable du traitement figurent en haut de cette page.

## Données collectées
Les seules données collectées sont celles que vous saisissez vous-même dans les formulaires du site :
- Formulaire de réservation : prénom, nom, société (facultatif), adresse e-mail, téléphone, service demandé, date et horaire souhaités, adresse de l'intervention, informations complémentaires.
- Formulaire de contact : prénom, nom, société (facultatif), adresse e-mail, téléphone (facultatif), objet et message.

Aucune donnée n'est collectée à des fins publicitaires et aucun outil de mesure d'audience intrusif n'est utilisé.

## Finalités et bases légales
- Traiter votre demande de rendez-vous et organiser l'intervention : mesures précontractuelles prises à votre demande (article 6.1.b du RGPD).
- Répondre à vos messages : intérêt légitime à répondre aux personnes qui nous sollicitent (article 6.1.f du RGPD).
- Vous envoyer les e-mails liés à votre demande (accusé de réception, confirmation, annulation) : exécution de la demande.

## Destinataires
Vos données sont destinées uniquement à l'éditeur du site. Elles ne sont ni vendues, ni louées, ni cédées. Elles sont hébergées et traitées par des prestataires techniques agissant pour notre compte :
- Vercel Inc. (hébergement du site) ;
- Supabase Inc. (base de données et stockage des fichiers, serveurs situés dans l'Union européenne) ;
- Resend (envoi des e-mails transactionnels).

Lorsque ces prestataires sont susceptibles de traiter des données en dehors de l'Union européenne, ce transfert est encadré par les clauses contractuelles types de la Commission européenne ou par le cadre de protection des données UE–États-Unis.

## Durée de conservation
- Demandes de contact : 3 ans à compter du dernier échange.
- Demandes de rendez-vous : 3 ans à compter de la date du rendez-vous.
Au-delà, les données sont supprimées ou anonymisées automatiquement.

## Vos droits
Conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données.

Pour exercer ces droits, écrivez à l'adresse e-mail indiquée en haut de cette page. Une réponse vous sera apportée dans un délai d'un mois.

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL : https://www.cnil.fr

## Cookies
Ce site n'utilise pas de cookies publicitaires ni de cookies de mesure d'audience. Pour en savoir plus, consultez la politique relative aux cookies.`;

const legalNotice = `## Propriété intellectuelle
L'ensemble des contenus de ce site (textes, photographies, éléments graphiques) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation préalable est interdite.

## Responsabilité
Les informations publiées sur ce site sont fournies à titre indicatif. Malgré le soin apporté à leur rédaction, elles peuvent contenir des inexactitudes ou des omissions. L'éditeur ne saurait être tenu responsable de l'utilisation qui en est faite.

## Liens externes
Ce site peut contenir des liens vers d'autres sites. L'éditeur n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.

## Données personnelles
Le traitement de vos données personnelles est décrit dans la politique de confidentialité.`;

const legalCookies = `Un cookie est un petit fichier déposé sur votre appareil lors de la consultation d'un site.

## Cookies utilisés sur ce site
Ce site ne dépose aucun cookie publicitaire, aucun cookie de réseau social et aucun cookie de mesure d'audience.

Aucun cookie n'est déposé lors de la simple consultation des pages publiques. C'est pourquoi aucun bandeau de consentement ne vous est présenté.

Seul l'espace d'administration, réservé à l'éditeur du site, utilise un cookie de session strictement nécessaire à la connexion sécurisée. Ce cookie est exempté de consentement conformément aux recommandations de la CNIL.

## Évolution
Si des outils nécessitant votre consentement venaient à être ajoutés, un dispositif permettant d'accepter ou de refuser ces cookies serait mis en place au préalable, et cette page serait mise à jour.

## En savoir plus
Pour en savoir plus sur les cookies et la manière de les gérer : https://www.cnil.fr/fr/cookies-et-autres-traceurs`;

export const seedPages: SeedPage[] = [
  {
    key: "accueil",
    path: "/",
    name: "Page d'accueil",
    seoTitle: "",
    seoDescription: "",
    sections: [
      {
        key: "hero",
        eyebrow: "États des lieux · Conciergerie · Assistance",
        heading: "Un appui fiable pour vos biens locatifs et votre activité",
        subheading:
          "Un service indépendant qui prend le relais lorsque votre équipe ne peut pas tout absorber — avec rigueur, réactivité et discrétion.",
        ctaLabel: "Réserver un service",
        ctaHref: "/reservation",
        cta2Label: "Découvrir les services",
        cta2Href: "/services",
      },
      {
        key: "intro",
        eyebrow: "En quelques mots",
        heading: "Une ressource en plus, sans alourdir votre organisation",
        body: `Pics de rotation locative, rendez-vous qui se chevauchent, dossiers en attente : certaines périodes demandent plus de disponibilité que votre équipe n'en a.

Je vous propose d'externaliser une partie de ces missions, ponctuellement ou de façon régulière. Vous gardez la main sur vos dossiers ; je prends en charge l'intervention, avec le même soin que si elle était réalisée en interne.

Je ne suis pas une agence immobilière : j'interviens exclusivement en tant que prestataire, pour le compte des professionnels et des propriétaires qui me confient une mission.`,
      },
      {
        key: "services",
        eyebrow: "Services",
        heading: "Ce que je peux prendre en charge pour vous",
        subheading:
          "Des prestations pensées pour les professionnels de l'immobilier, les propriétaires et les entreprises qui ont besoin d'un relais fiable.",
        ctaLabel: "Voir tous les services",
        ctaHref: "/services",
      },
      {
        key: "process",
        eyebrow: "Comment ça marche",
        heading: "Une demande simple, un suivi clair",
        subheading:
          "De la prise de rendez-vous à la remise des documents, vous savez toujours où en est votre demande.",
        ctaLabel: "En savoir plus",
        ctaHref: "/comment-ca-marche",
      },
      {
        key: "about",
        eyebrow: "À propos",
        heading: "Une interlocutrice unique, disponible et impliquée",
        body: `Lorsque vous me confiez une mission, c'est moi qui vous réponds, qui me déplace et qui assure le suivi. Pas d'intermédiaire, pas de message qui se perd.

J'accorde une grande importance à la précision, à la ponctualité et à la qualité des échanges — avec vous comme avec vos locataires ou vos clients.`,
        ctaLabel: "Découvrir mon parcours",
        ctaHref: "/a-propos",
      },
      {
        key: "why",
        eyebrow: "Pourquoi faire appel à moi",
        heading: "Travailler ensemble, concrètement",
        items: [
          {
            title: "Une capacité en plus, quand vous en avez besoin",
            text: "Vous faites appel à moi ponctuellement ou régulièrement, selon votre charge de travail, sans recrutement ni engagement de volume.",
          },
          {
            title: "Un travail soigné et documenté",
            text: "Chaque intervention est préparée, réalisée avec méthode et accompagnée des documents adaptés.",
          },
          {
            title: "Une communication directe",
            text: "Un seul interlocuteur, des réponses rapides et des informations claires à chaque étape.",
          },
          {
            title: "Indépendance et discrétion",
            text: "J'interviens pour votre compte, dans le respect de vos procédures, de votre image et de la confidentialité de vos dossiers.",
          },
        ],
      },
      {
        key: "faq",
        eyebrow: "Questions fréquentes",
        heading: "Vous vous posez peut-être ces questions",
        ctaLabel: "Toutes les questions",
        ctaHref: "/questions-frequentes",
      },
      {
        key: "final_cta",
        heading: "Besoin d'un renfort pour vos prochains rendez-vous ?",
        subheading:
          "Choisissez votre service et proposez un créneau : je reviens vers vous rapidement pour confirmer les détails.",
        ctaLabel: "Réserver un service",
        ctaHref: "/reservation",
        cta2Label: "Me contacter",
        cta2Href: "/contact",
      },
    ],
  },
  {
    key: "services",
    path: "/services",
    name: "Services",
    seoTitle: "Services — états des lieux, conciergerie, assistance",
    seoDescription:
      "États des lieux d'entrée et de sortie, inspections, conciergerie à la demande, assistance administrative et commerciale : découvrez l'ensemble des services.",
    sections: [
      {
        key: "hero",
        eyebrow: "Services",
        heading: "Des services pour vos biens locatifs et votre activité",
        subheading:
          "Chaque prestation peut être réservée ponctuellement ou organisée de façon régulière. Si votre besoin ne figure pas dans la liste, parlons-en.",
      },
      {
        key: "final_cta",
        heading: "Vous ne trouvez pas exactement ce qu'il vous faut ?",
        subheading: "Décrivez-moi votre besoin : nous verrons ensemble comment y répondre.",
        ctaLabel: "Me contacter",
        ctaHref: "/contact",
        cta2Label: "Réserver un service",
        cta2Href: "/reservation",
      },
    ],
  },
  {
    key: "etats-des-lieux",
    path: "/etats-des-lieux",
    name: "États des lieux",
    seoTitle: "États des lieux d'entrée et de sortie pour professionnels",
    seoDescription:
      "Externalisez vos états des lieux d'entrée et de sortie : un renfort fiable pour les agences, gestionnaires et propriétaires, en location longue durée ou saisonnière.",
    sections: [
      {
        key: "hero",
        eyebrow: "États des lieux",
        heading: "Des états des lieux précis, réalisés pour votre compte",
        subheading:
          "Entrées, sorties, périodes de forte activité : je prends en charge vos états des lieux avec méthode, pour des documents clairs et exploitables.",
        ctaLabel: "Réserver un état des lieux",
        ctaHref: "/reservation",
        cta2Label: "Poser une question",
        cta2Href: "/contact",
      },
      {
        key: "entree",
        heading: "L'état des lieux d'entrée",
        body: `Réalisé à la remise des clés, en présence du locataire, il décrit l'état du logement pièce par pièce : sols, murs, plafonds, menuiseries, équipements, relevés de compteurs et clés remises.

C'est le document de référence pour toute la durée de la location. Il est donc réalisé avec soin, photos à l'appui, pour éviter les zones d'ombre au moment du départ.`,
      },
      {
        key: "sortie",
        heading: "L'état des lieux de sortie",
        body: `À la restitution des clés, le logement est examiné selon la même méthode que lors de l'entrée. Les différences constatées sont décrites de manière factuelle et documentée.

L'objectif : un document objectif, qui facilite les échanges entre le bailleur et le locataire au moment du départ.`,
      },
      {
        key: "professionnels",
        eyebrow: "Agences et gestionnaires",
        heading: "Un relais pour votre service de gestion locative",
        body: "Lorsque les entrées et les sorties se concentrent sur quelques semaines, votre équipe ne peut pas être partout. Vous pouvez me confier tout ou partie de vos états des lieux, ponctuellement ou tout au long de l'année.",
        items: [
          {
            title: "Renfort en période de forte activité",
            text: "Fins de mois, rentrée, été : je vous aide à absorber les pics de rotation sans reporter vos rendez-vous.",
          },
          {
            title: "Respect de vos procédures",
            text: "Je m'adapte à vos consignes, à vos modèles et à votre manière d'échanger avec vos locataires.",
          },
          {
            title: "Transmission rapide",
            text: "Les documents vous sont transmis dans les délais convenus, pour clôturer vos dossiers sans attendre.",
          },
        ],
      },
      {
        key: "locations",
        heading: "Pour quels types de locations ?",
        items: [
          {
            title: "Locations longue durée",
            text: "Logements vides ou meublés, résidences principales : entrées et sorties de locataires.",
          },
          {
            title: "Locations meublées",
            text: "Inventaire du mobilier et des équipements en complément de l'état des lieux.",
          },
          {
            title: "Locations saisonnières",
            text: "Contrôle du logement entre deux séjours, sur demande, en complément des services de conciergerie.",
          },
        ],
      },
      {
        key: "documents",
        heading: "Les documents remis",
        body: `À l'issue de l'intervention, vous recevez un état des lieux complet au format numérique : description détaillée de chaque pièce, photographies, relevés de compteurs et inventaire des clés.

Le document est établi à l'aide d'un logiciel spécialisé, pour un rendu clair, homogène et facile à archiver.`,
      },
      {
        key: "final_cta",
        heading: "Planifier un état des lieux",
        subheading: "Indiquez le type d'intervention, l'adresse du logement et le créneau souhaité.",
        ctaLabel: "Réserver un état des lieux",
        ctaHref: "/reservation",
        cta2Label: "Me contacter",
        cta2Href: "/contact",
      },
    ],
  },
  {
    key: "a-propos",
    path: "/a-propos",
    name: "À propos",
    seoTitle: "À propos",
    seoDescription:
      "Une prestataire indépendante au service des professionnels de l'immobilier et des entreprises : découvrez ma façon de travailler.",
    sections: [
      {
        key: "hero",
        eyebrow: "À propos",
        heading: "Bonjour, et bienvenue",
        subheading:
          "J'ai créé cette activité pour offrir aux professionnels de l'immobilier, aux propriétaires et aux entreprises un appui fiable, humain et réactif.",
      },
      {
        key: "biography",
        heading: "Pourquoi cette activité",
        body: `Dans l'immobilier comme ailleurs, les périodes chargées mettent les équipes sous pression. Les rendez-vous se multiplient, les dossiers attendent, et la qualité finit parfois par en pâtir.

J'ai voulu proposer une réponse simple : une personne de confiance, disponible, qui intervient pour votre compte et s'intègre à votre façon de travailler.`,
      },
      { key: "experience", heading: "Mon expérience", body: "" },
      { key: "qualifications", heading: "Formations et qualifications", body: "" },
      {
        key: "philosophy",
        heading: "Ma façon de travailler",
        body: "Chaque mission mérite la même attention, qu'il s'agisse d'un studio ou d'une grande maison, d'une intervention ponctuelle ou d'une collaboration au long cours.",
        items: [
          { title: "Rigueur", text: "Des interventions préparées, des constats précis, des documents soignés." },
          { title: "Écoute", text: "Comprendre vos attentes et vos contraintes avant d'intervenir." },
          { title: "Fiabilité", text: "Être à l'heure, tenir les délais annoncés, vous tenir informé." },
          { title: "Discrétion", text: "Respecter la confidentialité de vos dossiers et de vos clients." },
        ],
      },
      { key: "gallery", heading: "En images", items: [] },
      {
        key: "final_cta",
        heading: "Faisons connaissance",
        subheading: "Un projet, une question ou un besoin ponctuel ? Je vous réponds personnellement.",
        ctaLabel: "Me contacter",
        ctaHref: "/contact",
        cta2Label: "Réserver un service",
        cta2Href: "/reservation",
      },
    ],
  },
  {
    key: "comment-ca-marche",
    path: "/comment-ca-marche",
    name: "Comment ça marche",
    seoTitle: "Comment ça marche",
    seoDescription:
      "De la demande de rendez-vous à la remise des documents : découvrez comment se déroule une intervention, étape par étape.",
    sections: [
      {
        key: "hero",
        eyebrow: "Comment ça marche",
        heading: "Simple, de la demande au suivi",
        subheading: "Voici comment se déroule une intervention, étape par étape.",
      },
      {
        key: "details",
        heading: "Bon à savoir",
        items: [
          {
            title: "Délais",
            text: "Les créneaux proposés en ligne tiennent compte d'un délai minimum de prévenance. Pour une demande urgente, appelez-moi directement.",
          },
          {
            title: "Modification ou annulation",
            text: "Un imprévu ? Prévenez-moi dès que possible pour déplacer ou annuler le rendez-vous.",
          },
          {
            title: "Tarifs",
            text: "Un devis vous est communiqué avant toute intervention, en fonction de la prestation et de vos besoins.",
          },
        ],
      },
      {
        key: "final_cta",
        heading: "Prêt à planifier votre intervention ?",
        subheading: "Choisissez un service et un créneau en quelques clics.",
        ctaLabel: "Réserver un service",
        ctaHref: "/reservation",
        cta2Label: "Me contacter",
        cta2Href: "/contact",
      },
    ],
  },
  {
    key: "questions-frequentes",
    path: "/questions-frequentes",
    name: "Questions fréquentes",
    seoTitle: "Questions fréquentes",
    seoDescription:
      "Réponses aux questions les plus courantes : déroulement des états des lieux, documents remis, tarifs, réservation et annulation.",
    sections: [
      {
        key: "hero",
        eyebrow: "FAQ",
        heading: "Questions fréquentes",
        subheading:
          "Les réponses aux questions les plus courantes. Vous ne trouvez pas la vôtre ? Écrivez-moi.",
      },
      {
        key: "final_cta",
        heading: "Une autre question ?",
        subheading: "Je vous réponds dans les meilleurs délais.",
        ctaLabel: "Me contacter",
        ctaHref: "/contact",
      },
    ],
  },
  {
    key: "contact",
    path: "/contact",
    name: "Contact",
    seoTitle: "Contact",
    seoDescription:
      "Une question, une demande de devis ou un projet de collaboration ? Contactez-moi via le formulaire, par e-mail ou par téléphone.",
    sections: [
      {
        key: "hero",
        eyebrow: "Contact",
        heading: "Parlons de votre besoin",
        subheading:
          "Une question, une demande de devis ou un projet de collaboration régulière ? Écrivez-moi, je vous réponds rapidement.",
      },
      {
        key: "booking_cta",
        heading: "Vous savez déjà ce qu'il vous faut ?",
        body: "Réservez directement un créneau en ligne : c'est plus rapide.",
        ctaLabel: "Réserver un service",
        ctaHref: "/reservation",
      },
    ],
  },
  {
    key: "reservation",
    path: "/reservation",
    name: "Réservation",
    seoTitle: "Réserver un service",
    seoDescription:
      "Réservez en ligne un état des lieux, une inspection, une intervention de conciergerie ou un rendez-vous d'assistance.",
    sections: [
      {
        key: "hero",
        eyebrow: "Réservation",
        heading: "Réserver un service",
        subheading: "Choisissez une prestation, une date et un horaire. Cela ne prend que quelques minutes.",
      },
      {
        key: "confirmation_request",
        heading: "Votre demande a bien été envoyée",
        body: `Merci ! Votre demande de rendez-vous est enregistrée. Je la vérifie et reviens vers vous rapidement pour la confirmer.

Un e-mail récapitulatif vient de vous être envoyé.`,
      },
      {
        key: "confirmation_instant",
        heading: "Votre rendez-vous est confirmé",
        body: `Merci ! Votre rendez-vous est réservé. Un e-mail de confirmation vient de vous être envoyé.

Si vous devez modifier ou annuler ce rendez-vous, contactez-moi dès que possible.`,
      },
      {
        key: "unavailable",
        heading: "La réservation en ligne est momentanément indisponible",
        body: "Vous pouvez néanmoins me contacter par téléphone ou via le formulaire de contact : je vous proposerai un créneau.",
      },
    ],
  },
  {
    key: "mentions-legales",
    path: "/mentions-legales",
    name: "Mentions légales",
    seoTitle: "Mentions légales",
    seoDescription: "Mentions légales du site : éditeur, hébergeur, propriété intellectuelle.",
    sections: [{ key: "content", heading: "Mentions légales", body: legalNotice }],
  },
  {
    key: "politique-de-confidentialite",
    path: "/politique-de-confidentialite",
    name: "Politique de confidentialité",
    seoTitle: "Politique de confidentialité",
    seoDescription:
      "Comment vos données personnelles sont collectées, utilisées et protégées, et comment exercer vos droits.",
    sections: [{ key: "content", heading: "Politique de confidentialité", body: legalPrivacy }],
  },
  {
    key: "politique-cookies",
    path: "/politique-cookies",
    name: "Politique relative aux cookies",
    seoTitle: "Politique relative aux cookies",
    seoDescription: "Information sur les cookies utilisés par ce site.",
    sections: [{ key: "content", heading: "Politique relative aux cookies", body: legalCookies }],
  },
];

/**
 * Photos bundled with the code in /public/images (optional).
 * When `npm run db:seed` finds one of these files, it registers it in the media library
 * and uses it for the listed places — only where no image has been chosen yet.
 * Accepted extensions: .jpg, .jpeg, .webp, .png, .avif
 */
export type SeedImageTarget =
  | { page: string; section: string }
  | { service: string }
  | { ogDefault: true };

export const seedImages: { name: string; alt: string; targets: SeedImageTarget[] }[] = [
  {
    name: "accueil",
    alt: "Intérieur d'un appartement lumineux",
    targets: [{ page: "accueil", section: "hero" }, { ogDefault: true }],
  },
  {
    name: "etats-des-lieux",
    alt: "Réalisation d'un état des lieux dans un logement",
    targets: [{ page: "etats-des-lieux", section: "hero" }],
  },
  {
    name: "portrait",
    alt: "Portrait de la fondatrice",
    targets: [{ page: "a-propos", section: "hero" }, { page: "accueil", section: "about" }],
  },
  { name: "service-etat-des-lieux-entree", alt: "Remise des clés d'un logement", targets: [{ service: "etat-des-lieux-entree" }] },
  { name: "service-etat-des-lieux-sortie", alt: "Logement vide prêt pour l'état des lieux de sortie", targets: [{ service: "etat-des-lieux-sortie" }] },
  { name: "service-inspection-constat-logement", alt: "Contrôle de l'état d'un logement", targets: [{ service: "inspection-constat-logement" }] },
  { name: "service-conciergerie-a-la-demande", alt: "Accueil dans un logement meublé", targets: [{ service: "conciergerie-a-la-demande" }] },
  { name: "service-assistance-administrative", alt: "Bureau et documents administratifs", targets: [{ service: "assistance-administrative" }] },
  { name: "service-assistance-commerciale", alt: "Rendez-vous professionnel", targets: [{ service: "assistance-commerciale" }] },
  { name: "service-coordination-evenementielle", alt: "Préparation d'un événement", targets: [{ service: "coordination-evenementielle" }] },
];
