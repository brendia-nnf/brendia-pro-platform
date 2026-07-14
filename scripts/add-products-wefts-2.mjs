// One-off script: uploads the second batch of weft product images
// (proizvodi-edited-new) to Supabase storage and creates the products.
// Run from brendia-pro-platform/: node scripts/add-products-wefts-2.mjs
// Prices/stock are draft values - adjust in /admin/proizvodi.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SRC = "/Volumes/ninefold/Client_BRENDIA PRO/proizvodi-edited-new";

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

const products = [
  weft("3-curly", "#3 Curly", ["#3-1.png", "#3-2.png"],
    "srednje smeđa, duboki val", "medium brown, deep wave", 19900),
  weft("9-curly", "#9 Curly", ["#9-1.png", "#9-2.png"],
    "tamno zlatnoplava, duboki val", "dark golden blonde, deep wave", 19900),
  weft("33", "#33", ["#33-1.png", "#33-2.png"],
    "bakreno kestenjasta, ravna tekstura", "auburn copper, straight texture"),
  weft("2a-curly", "2A Curly", ["2a-1.png", "2a-2.png"],
    "tamna čokoladno smeđa, duboki val", "dark chocolate brown, deep wave", 19900),
  weft("brown-body-wave", "Brown Body Wave", ["brown-body-wave-1.png", "brown-body-wave-2.png"],
    "topla srednje smeđa, body-wave tekstura", "warm medium brown, body wave texture", 19900),
  weft("chocolate", "Chocolate", ["chocolate-1.png", "chocolate-2.png"],
    "topla kestenjasto smeđa, ravna tekstura", "warm chestnut brown, straight texture"),
  weft("golden", "Golden", ["golden-1.png", "golden-2.png"],
    "topla zlatnoplava, ravna tekstura", "warm golden blonde, straight texture"),
  weft("had8", "HAD-8", ["had8-1.png", "had8-2.png"],
    "intenzivno bakreno riđa, ravna tekstura", "vivid copper ginger, straight texture"),
  weft("hazelnut", "Hazelnut", ["hazelnut-1.png", "hazelnut-2.png"],
    "smeđa s toplim karamel pramenovima", "brown with warm caramel highlights", 19900),
  weft("moonlight", "Moonlight", ["moonlight-1.png", "moonlight-2.png"],
    "pješčano bež plava s prirodno tamnijim korijenom", "sandy beige blonde with a naturally darker root", 19900, true),
  weft("nordic", "Nordic", ["nordic-1.png", "nordic-2.png"],
    "svijetla zlatnoplava s tamnijim korijenom", "light golden blonde with a darker root", 19900),
  weft("opal", "Opal", ["opal-1.png", "opal-2.png"],
    "hladnija tamnoplava s prirodnim svjetlijim preljevima", "cool dark blonde with natural lighter tones", 19900),
  weft("p9-22-60", "P9/22/60", ["p9:22:60-1.png", "p9:22:60-2.png"],
    "piano mješavina zlatne i svijetle plave, duboki val", "piano blend of golden and light blonde, deep wave", 19900),
  weft("t8n-p18-60a", "T8N/P18/60A", ["t8n:p18:60a-1.png", "t8n:p18:60a-2.png"],
    "ombre s tamnijim korijenom i piano plavim dužinama, duboki val", "ombre with a darker root and piano blonde lengths, deep wave", 19900),
];

// Slot after the existing wefts (they end at sort_order 140; threads start at 150)
let sortOrder = 141;

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
      specifications: {},
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

  sortOrder += 1;
  console.log(`OK ${product.slug} (${urls.length} images)`);
}

console.log(`\nDone: ${products.length} products created/updated.`);
