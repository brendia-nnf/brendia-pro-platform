import type { Product } from "@/lib/types/webshop";

// Unsplash image helper - creates optimized image URLs
const unsplash = (photoId: string, width = 600, height = 600) =>
  `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&q=80`;

export const mockProducts: Product[] = [
  // Hair Extensions (6)
  {
    id: "ext-tape-brown",
    name: "Tape-In Ekstenzije - Smeđa",
    slug: "tape-in-ekstenzije-smeda",
    description:
      "Premium tape-in ekstenzije od 100% prirodne kose. Jednostavna aplikacija i dugotrajnost. Idealne za dodavanje volumena i dužine. Boja: Prirodna smeđa (#4).",
    price: 189.99,
    originalPrice: 229.99,
    category: "extensions",
    images: [
      unsplash("photo-1522337360788-8b13dee7a37e"),
      unsplash("photo-1519699047748-de8e457a634e"),
    ],
    inStock: true,
    stockQuantity: 25,
    specifications: {
      Dužina: "50 cm",
      Težina: "50 g (20 traka)",
      Materijal: "100% prirodna kosa",
      Boja: "#4 Prirodna smeđa",
    },
    featured: true,
  },
  {
    id: "ext-tape-blonde",
    name: "Tape-In Ekstenzije - Plava",
    slug: "tape-in-ekstenzije-plava",
    description:
      "Premium tape-in ekstenzije od 100% prirodne kose. Savršene za svjetlije tonove kose. Boja: Pepeljasto plava (#18).",
    price: 199.99,
    category: "extensions",
    images: [
      unsplash("photo-1527799820374-dcf8d9d4a388"),
      unsplash("photo-1580618672591-eb180b1a973f"),
    ],
    inStock: true,
    stockQuantity: 18,
    specifications: {
      Dužina: "50 cm",
      Težina: "50 g (20 traka)",
      Materijal: "100% prirodna kosa",
      Boja: "#18 Pepeljasto plava",
    },
    featured: true,
  },
  {
    id: "ext-tape-black",
    name: "Tape-In Ekstenzije - Crna",
    slug: "tape-in-ekstenzije-crna",
    description:
      "Premium tape-in ekstenzije od 100% prirodne kose. Duboka prirodna crna boja za dramatičan izgled. Boja: Jet crna (#1).",
    price: 189.99,
    category: "extensions",
    images: [
      unsplash("photo-1492106087820-71f1a00d2b11"),
      unsplash("photo-1517841905240-472988babdf9"),
    ],
    inStock: true,
    stockQuantity: 22,
    specifications: {
      Dužina: "50 cm",
      Težina: "50 g (20 traka)",
      Materijal: "100% prirodna kosa",
      Boja: "#1 Jet crna",
    },
  },
  {
    id: "ext-clip-50cm",
    name: "Clip-In Ekstenzije - 50 cm",
    slug: "clip-in-ekstenzije-50cm",
    description:
      "Set clip-in ekstenzija za brzu i jednostavnu primjenu. Idealne za posebne prilike ili svakodnevno nošenje. Set uključuje 7 dijelova različitih širina.",
    price: 149.99,
    originalPrice: 179.99,
    category: "extensions",
    images: [
      unsplash("photo-1595959183082-7b570b7e08e2"),
      unsplash("photo-1554519934-e32b1629d9ee"),
    ],
    inStock: true,
    stockQuantity: 30,
    specifications: {
      Dužina: "50 cm",
      Težina: "120 g (7 dijelova)",
      Materijal: "100% prirodna kosa",
      Boja: "Više boja dostupno",
    },
    featured: true,
  },
  {
    id: "ext-clip-60cm",
    name: "Clip-In Ekstenzije - 60 cm",
    slug: "clip-in-ekstenzije-60cm",
    description:
      "Duže clip-in ekstenzije za dramatičan efekt. Set uključuje 7 dijelova s pojačanim clipovima za sigurno držanje tijekom cijelog dana.",
    price: 179.99,
    category: "extensions",
    images: [
      unsplash("photo-1519735777090-ec97162dc266"),
      unsplash("photo-1534528741775-53994a69daeb"),
    ],
    inStock: true,
    stockQuantity: 15,
    specifications: {
      Dužina: "60 cm",
      Težina: "140 g (7 dijelova)",
      Materijal: "100% prirodna kosa",
      Boja: "Više boja dostupno",
    },
  },
  {
    id: "ext-keratin",
    name: "Keratin Bond Ekstenzije",
    slug: "keratin-bond-ekstenzije",
    description:
      "Profesionalne keratin bond ekstenzije za dugotrajnu primjenu. Zahtijevaju profesionalnu aplikaciju. Pakiranje od 25 pramenova.",
    price: 249.99,
    category: "extensions",
    images: [
      unsplash("photo-1605497788044-5a32c7078486"),
      unsplash("photo-1526047932273-341f2a7631f9"),
    ],
    inStock: true,
    stockQuantity: 12,
    specifications: {
      Dužina: "55 cm",
      Količina: "25 pramenova",
      Materijal: "100% prirodna kosa",
      Tip: "Keratin I-tip",
    },
  },

  // Tools (5)
  {
    id: "tool-scissors",
    name: "Profesionalne Škare za Ekstenzije",
    slug: "profesionalne-skare",
    description:
      "Visokokvalitetne škare od japanskog čelika dizajnirane posebno za rad s ekstenzijama. Ergonomski dizajn za udobnost tijekom dugih radnih sati.",
    price: 89.99,
    category: "tools",
    images: [
      unsplash("photo-1585747860715-2ba37e788b70"),
      unsplash("photo-1621607512214-68297480165e"),
    ],
    inStock: true,
    stockQuantity: 20,
    specifications: {
      Materijal: "Japanski čelik",
      Dužina: "15 cm",
      Tip: "Ravne škare",
    },
    featured: true,
  },
  {
    id: "tool-heat-applicator",
    name: "Toplinski Aplikator",
    slug: "toplinski-aplikator",
    description:
      "Profesionalni toplinski aplikator za keratin i tape-in ekstenzije. Podesiva temperatura i brzo zagrijavanje. Uključuje zaštitnu podlogu.",
    price: 149.99,
    originalPrice: 179.99,
    category: "tools",
    images: [
      unsplash("photo-1522338140262-f46f5913618a"),
      unsplash("photo-1560066984-138dadb4c035"),
    ],
    inStock: true,
    stockQuantity: 8,
    specifications: {
      Temperatura: "100-220°C",
      Zagrijavanje: "30 sekundi",
      Napajanje: "220V",
    },
  },
  {
    id: "tool-removal",
    name: "Set za Uklanjanje Ekstenzija",
    slug: "set-za-uklanjanje",
    description:
      "Kompletan set za sigurno uklanjanje tape-in i keratin ekstenzija. Uključuje otapalo, pincetu i češalj za odvajanje.",
    price: 49.99,
    category: "tools",
    images: [
      unsplash("photo-1522337360788-8b13dee7a37e"),
      unsplash("photo-1562322140-8baeececf3df"),
    ],
    inStock: true,
    stockQuantity: 35,
    specifications: {
      Sadržaj: "Otapalo 100ml, pinceta, češalj",
      Primjena: "Tape-in i keratin",
    },
  },
  {
    id: "tool-clips",
    name: "Set Profesionalnih Kopči",
    slug: "profesionalne-kopce",
    description:
      "Set od 12 profesionalnih kopči za sekcije prilikom aplikacije ekstenzija. Čvrste i izdržljive, ne oštećuju kosu.",
    price: 19.99,
    category: "tools",
    images: [
      unsplash("photo-1527799820374-dcf8d9d4a388"),
      unsplash("photo-1599351431202-1e0f0137899a"),
    ],
    inStock: true,
    stockQuantity: 50,
    specifications: {
      Količina: "12 komada",
      Materijal: "ABS plastika",
      Boja: "Crna",
    },
  },
  {
    id: "tool-comb-set",
    name: "Set Češljeva za Ekstenzije",
    slug: "set-cesljeva",
    description:
      "Profesionalni set od 3 češlja dizajnirana za rad s ekstenzijama. Uključuje rat tail češalj, široki češalj i četku za odvajanje.",
    price: 34.99,
    category: "tools",
    images: [
      unsplash("photo-1522337094846-8a818192de1f"),
      unsplash("photo-1503951914875-452162b0f3f1"),
    ],
    inStock: true,
    stockQuantity: 28,
    specifications: {
      Količina: "3 komada",
      Materijal: "Karbonska vlakna",
      Uključuje: "Rat tail, široki, četka",
    },
  },

  // Care Products (4)
  {
    id: "care-shampoo",
    name: "Šampon bez Sulfata",
    slug: "sampon-bez-sulfata",
    description:
      "Blagi šampon bez sulfata posebno formuliran za njegu ekstenzija. Čisti bez oštećivanja ljepila ili keratinskih spojeva. Obogaćen arganovim uljem.",
    price: 24.99,
    category: "care",
    images: [
      unsplash("photo-1556227702-d1e4e7b5c232"),
      unsplash("photo-1608248543803-ba4f8c70ae0b"),
    ],
    inStock: true,
    stockQuantity: 45,
    specifications: {
      Volumen: "300 ml",
      "Bez sulfata": "Da",
      Sastojci: "Arganovo ulje, keratin",
    },
    featured: true,
  },
  {
    id: "care-conditioner",
    name: "Hidratantni Regenerator",
    slug: "hidratantni-regenerator",
    description:
      "Duboko hidratantni regenerator za ekstenzije i prirodnu kosu. Vraća sjaj i mekoću bez opterećivanja kose.",
    price: 26.99,
    category: "care",
    images: [
      unsplash("photo-1570194065650-d99fb4b38b15"),
      unsplash("photo-1556228578-0d85b1a4d571"),
    ],
    inStock: true,
    stockQuantity: 40,
    specifications: {
      Volumen: "300 ml",
      "Bez parabena": "Da",
      Sastojci: "Keratin, provitamin B5",
    },
  },
  {
    id: "care-serum",
    name: "Serum za Kosu",
    slug: "serum-za-kosu",
    description:
      "Lagani serum koji štiti ekstenzije od topline i vanjskih utjecaja. Dodaje sjaj bez masnog osjećaja. Siguran za sve vrste ekstenzija.",
    price: 29.99,
    category: "care",
    images: [
      unsplash("photo-1617897903246-719242758050"),
      unsplash("photo-1598440947619-2c35fc9aa908"),
    ],
    inStock: true,
    stockQuantity: 32,
    specifications: {
      Volumen: "100 ml",
      "Toplinska zaštita": "Do 230°C",
      Tip: "Bezmasni",
    },
  },
  {
    id: "care-brush",
    name: "Četka za Ekstenzije",
    slug: "cetka-za-ekstenzije",
    description:
      "Specijalna četka s fleksibilnim čekinjama dizajnirana da nježno raščešljava ekstenzije bez izvlačenja ili oštećivanja spojeva.",
    price: 22.99,
    category: "care",
    images: [
      unsplash("photo-1590159763121-7c9fd312190d"),
      unsplash("photo-1522338140262-f46f5913618a"),
    ],
    inStock: true,
    stockQuantity: 38,
    specifications: {
      Materijal: "Bambus drška, najlon čekinje",
      Tip: "Loop četka",
      Primjena: "Sve vrste ekstenzija",
    },
  },
];

// Helper functions
export function getProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === "all") return mockProducts;
  return mockProducts.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return mockProducts.filter((p) => p.featured);
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
  );
}
