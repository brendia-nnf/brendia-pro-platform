// One-off script: uploads product images from the external drive to
// Supabase storage and creates webshop products.
// Run from brendia-pro-platform/: node scripts/add-products.mjs
// Prices/stock are draft values - adjust in /admin/proizvodi.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SRC = "/Volumes/ninefold/Client_BRENDIA PRO/proizvodi-edited";

// Load env from .env.local
const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const weft = (slug, shade, files, colorHr, colorEn, price = 18900, featured = false) => ({
  slug: `weft-${slug}`,
  name: `Weft ekstenzije – ${shade}`,
  name_en: `Weft Extensions – ${shade}`,
  description: `Premium weft ekstenzije u nijansi ${shade} – ${colorHr}. Brendia Pro® kvaliteta, pogodne za profesionalnu primjenu weft tehnikom.`,
  description_en: `Premium weft extensions in shade ${shade} – ${colorEn}. Brendia Pro® quality, made for professional weft application.`,
  price,
  category: "extensions",
  files,
  featured,
});

const thread = (slug, material, materialHr, colorSlugHr, colorHr, colorEn, file, price) => ({
  slug: `${material}-konac-${slug}`,
  name: `${material === "cotton" ? "Cotton" : "Nylon"} konac za šivanje – ${colorHr} (1200 m)`,
  name_en: `${material === "cotton" ? "Cotton" : "Nylon"} Hair Extension Thread – ${colorEn} (1200 m)`,
  description: `Profesionalni ${materialHr} konac za šivanje weft ekstenzija, 1200 metara. Nijansa: ${colorHr}.`,
  description_en: `Professional ${material} thread for sewing weft extensions, 1200 meters. Shade: ${colorEn}.`,
  price,
  category: "tools",
  files: [file],
  specifications: { duljina: "1200 m", materijal: materialHr },
});

const products = [
  // ===== WEFT EXTENSIONS =====
  weft("jet-black-1", "Jet Black #1", ["black(1)-1.png", "black(1)-2.png", "black(1)-3.png"],
    "duboka gavran crna, ravna tekstura", "deep raven black, straight texture"),
  weft("2a", "2A", ["2a.png", "2a-1.png", "2a-2.png"],
    "tamna čokoladno smeđa, ravna tekstura", "dark chocolate brown, straight texture"),
  weft("dark-brown", "Dark Brown", ["dark-brown.png", "dark-brown-1.png", "dark-brown-2.png"],
    "bogata tamnosmeđa, ravna tekstura", "rich dark brown, straight texture"),
  weft("dark-mocha", "Dark Mocha", ["dark-mocha.png", "dark-mocha-1.png", "dark-mocha-2.png"],
    "duboka mocha smeđa, ravna tekstura", "deep mocha brown, straight texture", 18900, true),
  weft("shadow", "Shadow", ["shadow.png", "shadow-1.png", "shadow-2.png"],
    "tamnosmeđa s diskretnim karamel pramenovima", "dark brown with subtle caramel strands"),
  weft("toffee", "Toffee", ["toffee.png", "toffee-1.png"],
    "topla karamel smeđa", "warm caramel brown"),
  weft("biscuit", "Biscuit", ["biscuit.png", "biscuit-1.png", "biscuit-2.png"],
    "zlatna balayage plava s prirodno tamnijim korijenom", "golden balayage blonde with a naturally darker root", 19900, true),
  weft("ivory", "Ivory", ["ivory-1.png", "ivory-2.png", "ivory-1ext.png"],
    "zlatno medena plava, ravna tekstura", "golden honey blonde, straight texture", 19900),
  weft("linen", "Linen", ["linen.png", "linen-1.png", "linen-2.png"],
    "ombre s tamnijim korijenom koji prelazi u pješčano plavu", "ombre with a darker root melting into sandy blonde", 19900),
  weft("copper-4", "Copper #4", ["copper(4)-1.png", "copper(4)-2.png", "copper(4)-3.png"],
    "topla bakrena, ravna tekstura", "warm copper, straight texture"),
  weft("m27-had-8", "M27/HAD-8", ["m27-had-8.png", "m27-had-8-1.png", "m27-had-8-2.png"],
    "bakreno riđa, duboki val", "copper ginger, deep wave", 19900),
  weft("t2-p2-6", "T2/P2-6", ["t2-p2-6.png", "t2-p2-6-1.png", "t2-p2-6-2.png"],
    "balayage body-wave s tamnim korijenom i karamel dužinama", "balayage body wave with a dark root and caramel lengths", 19900),
  weft("red-curly", "Red Curly", ["red-curly.png", "red-curly-1.png", "red-curly-2.png"],
    "intenzivno crvena, kovrčava tekstura", "vivid red, curly texture", 19900),
  weft("red-straight", "Red Straight", ["red-straight.png", "red-straight-1.png", "red-straight-2.png"],
    "intenzivno crvena, ravna tekstura", "vivid red, straight texture"),

  // ===== THREADS =====
  thread("crni", "cotton", "pamučni", "crni", "crni", "black", "black-cotton.png", 990),
  thread("tamnoplavi", "cotton", "pamučni", "tamnoplavi", "tamnoplavi", "dark blonde", "d-blonde-cotton2.png", 990),
  thread("tamnosmedi", "cotton", "pamučni", "tamnosmedi", "tamnosmeđi", "dark brown", "d-brown-cotton.png", 990),
  thread("zlatnoplavi", "cotton", "pamučni", "zlatnoplavi", "zlatnoplavi", "golden blonde", "g-blonde-cotton.png", 990),
  thread("svijetloplavi", "cotton", "pamučni", "svijetloplavi", "svijetloplavi", "white blonde", "w-blonde-cotton.png", 990),
  thread("plavi", "nylon", "najlonski", "plavi", "plavi", "blonde", "blonde-nylon.png", 890),
  thread("hladno-smedi", "nylon", "najlonski", "hladno-smedi", "hladno smeđi", "cool brown", "cool-brown-nylon.png", 890),
  thread("crni", "nylon", "najlonski", "crni", "crni", "jet black", "jet-black-nylon.png", 890),

  // ===== TOOLS =====
  {
    slug: "silikonske-perlice-smede",
    name: "Silikonske perlice – smeđe",
    name_en: "Silicone Beads – Brown",
    description: "Silikonske perlice za weft tehniku u smeđoj nijansi. Nježne prema kosi, čvrsto drže.",
    description_en: "Silicone-lined beads for the weft technique in brown. Gentle on hair with a secure hold.",
    price: 690, category: "tools", files: ["beads-brown.png"],
  },
  {
    slug: "brendia-cetka-za-ekstenzije",
    name: "Brendia Pro® četka za ekstenzije",
    name_en: "Brendia Pro® Extension Brush",
    description: "Profesionalna četka s kombiniranim vlaknima, dizajnirana za svakodnevno raščešljavanje ekstenzija bez povlačenja.",
    description_en: "Professional mixed-bristle brush designed for daily detangling of extensions without pulling.",
    price: 2490, category: "tools", files: ["brush.png", "brush-2.png"],
  },
  {
    slug: "cetka-velika",
    name: "Četka za raščešljavanje – velika",
    name_en: "Detangling Brush – Large",
    description: "Velika četka za lako raščešljavanje gušće kose i ekstenzija.",
    description_en: "Large brush for easy detangling of thicker hair and extensions.",
    price: 1990, category: "tools", files: ["brush-large.png"],
  },
  {
    slug: "cetka-mala",
    name: "Četka za raščešljavanje – mala",
    name_en: "Detangling Brush – Small",
    description: "Mala, praktična četka za torbicu – njega ekstenzija u pokretu.",
    description_en: "Small, handy brush for your bag – extension care on the go.",
    price: 1490, category: "tools", files: ["brush-small.png"],
  },
  {
    slug: "profesionalni-cesalj",
    name: "Profesionalni češalj",
    name_en: "Professional Comb",
    description: "Precizan češalj za odvajanje sekcija i uredne redove pri postavljanju weftova.",
    description_en: "Precise comb for clean sectioning and neat rows during weft installation.",
    price: 990, category: "tools", files: ["brush-comb.png"],
  },
  {
    slug: "profesionalna-klijesta",
    name: "Brendia Pro® profesionalna kliješta",
    name_en: "Brendia Pro® Professional Pliers",
    description: "Ergonomska kliješta za zatvaranje i otvaranje perlica pri postavljanju i skidanju weftova.",
    description_en: "Ergonomic pliers for closing and opening beads during weft installation and removal.",
    price: 2990, category: "tools", files: ["clamp-1.png", "clamp-2.png", "clamp3.png"],
  },
  {
    slug: "stipaljke-za-kosu",
    name: "Štipaljke za odvajanje kose",
    name_en: "Sectioning Clips",
    description: "Čvrste štipaljke za uredno odvajanje sekcija tijekom rada.",
    description_en: "Sturdy clips for clean sectioning while you work.",
    price: 990, category: "tools", files: ["clips.png", "clips1.png", "clips-2.png"],
  },
  {
    slug: "skarice-za-konac",
    name: "Škarice za konac",
    name_en: "Thread Scissors",
    description: "Male, oštre škarice za precizno rezanje konca.",
    description_en: "Small, sharp scissors for precise thread cutting.",
    price: 1290, category: "tools", files: ["little-scissors.png"],
  },
  {
    slug: "loop-provlakac-set-5",
    name: "Loop provlakač – set od 5",
    name_en: "Loop Threader – Set of 5",
    description: "Set od 5 loop provlakača za brzo provlačenje kose kroz perlice.",
    description_en: "Set of 5 loop threaders for quickly pulling hair through beads.",
    price: 1290, category: "tools", files: ["loop-threaderx5.png"],
  },
  {
    slug: "provlakac-s-perlicama",
    name: "Provlakač s perlicama",
    name_en: "Bead Threader",
    description: "Provlakač s ergonomskom drškom i perlicama spremnima za rad.",
    description_en: "Threader with an ergonomic handle and beads loaded, ready to work.",
    price: 990, category: "tools", files: ["threader.png"],
  },
  {
    slug: "zdjelica-za-mijesanje",
    name: "Zdjelica za miješanje",
    name_en: "Mixing Bowl",
    description: "Praktična zdjelica za pripremu i miješanje preparata.",
    description_en: "Handy bowl for preparing and mixing products.",
    price: 490, category: "tools", files: ["mixing-bowl.png"],
  },
  {
    slug: "rasprsivac-za-vodu",
    name: "Raspršivač za vodu",
    name_en: "Water Sprayer",
    description: "Fini raspršivač za vlaženje kose tijekom rada i stiliziranja.",
    description_en: "Fine-mist sprayer for dampening hair while working and styling.",
    price: 790, category: "tools", files: ["sprayer.png"],
  },
  {
    slug: "brendia-frizerski-ogrtac",
    name: "Brendia Pro® frizerski ogrtač",
    name_en: "Brendia Pro® Salon Cape",
    description: "Elegantni crni frizerski ogrtač s Brendia Pro® potpisom – za profesionalan dojam u salonu.",
    description_en: "Elegant black salon cape with the Brendia Pro® signature – a professional look for your salon.",
    price: 3990, category: "tools", files: ["gown.png", "gown-2.png", "gown-3.png"],
  },
  {
    slug: "velcro-trake-ravne",
    name: "Velcro trake za kosu – ravne (2 kom)",
    name_en: "Velcro Hair Grippers – Straight (2 pcs)",
    description: "Brendia Pro® velcro trake koje drže kosu na mjestu bez štipaljki. Ravni oblik, 2 komada.",
    description_en: "Brendia Pro® velcro grippers that hold hair in place without clips. Straight shape, 2 pieces.",
    price: 690, category: "tools", files: ["velco-straight.png"],
  },
  {
    slug: "velcro-trake-zakrivljene",
    name: "Velcro trake za kosu – zakrivljene (2 kom)",
    name_en: "Velcro Hair Grippers – Curved (2 pcs)",
    description: "Brendia Pro® velcro trake koje drže kosu na mjestu bez štipaljki. Zakrivljeni oblik, 2 komada.",
    description_en: "Brendia Pro® velcro grippers that hold hair in place without clips. Curved shape, 2 pieces.",
    price: 690, category: "tools", files: ["velcro-curved.png"],
  },
  {
    slug: "brendia-starter-kit",
    name: "Brendia Pro® Starter Kit",
    name_en: "Brendia Pro® Starter Kit",
    description: "Kompletan set alata za weft tehniku u elegantnoj Brendia Pro® torbici – sve što vam treba za početak rada.",
    description_en: "Complete weft technique tool set in an elegant Brendia Pro® case – everything you need to get started.",
    price: 14900, category: "tools", featured: true,
    files: ["starter-kit.png", "starter-kit-box.png", "starter-kit2.png", "starter-kit3.png", "starter-kit4.png", "starter-kit5.png"],
  },
];

let sortOrder = 10;

for (const product of products) {
  const urls = [];
  for (let i = 0; i < product.files.length; i++) {
    const file = product.files[i];
    const buffer = readFileSync(join(SRC, file));
    const path = `products/${product.slug}-${i + 1}.png`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, buffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error(`UPLOAD FAILED ${file}:`, uploadError.message);
      process.exit(1);
    }

    const { data } = supabase.storage.from("images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  const { error: insertError } = await supabase.from("products").upsert(
    {
      slug: product.slug,
      name: product.name,
      name_en: product.name_en,
      description: product.description,
      description_en: product.description_en,
      price: product.price,
      currency: "eur",
      category: product.category,
      images: urls,
      in_stock: true,
      stock_quantity: 20,
      track_inventory: true,
      specifications: product.specifications || {},
      featured: product.featured || false,
      sort_order: sortOrder,
      is_published: true,
    },
    { onConflict: "slug" }
  );

  if (insertError) {
    console.error(`INSERT FAILED ${product.slug}:`, insertError.message);
    process.exit(1);
  }

  sortOrder += 10;
  console.log(`OK ${product.slug} (${urls.length} images)`);
}

// Unpublish the placeholder seed products
const { error: unpublishError } = await supabase
  .from("products")
  .update({ is_published: false })
  .in("slug", ["brendia-pro-weft-set", "professional-needles", "brendia-care-serum"]);

console.log(
  unpublishError
    ? `Unpublish placeholders failed: ${unpublishError.message}`
    : "Placeholder seed products unpublished"
);

console.log(`\nDone: ${products.length} products created/updated.`);
