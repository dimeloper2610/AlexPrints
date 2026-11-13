/*
  AlexPrints content file.
  Everything the site shows (works, prices, editions, texts) lives here.
  Replace the sample entries with the real works. To use a photo, put it in
  assets/img/works/ and set `image: "assets/img/works/<file>.jpg"`.
  While `image` is null, a generated placeholder is drawn instead.
*/

window.AP_CONFIG = {
  siteName: "AlexPrints",
  artist: "Alex Fragoulis",
  email: "hello@alexprints.example", // TODO: real address
  instagram: "https://www.instagram.com/alexfragoulis_prints/",
  currency: "EUR",
  locale: "en-IE",
  // Optional: a Formspree / Getform endpoint. When empty, the order form opens an email instead.
  formEndpoint: "",
  framingPrice: 90, // TODO: confirm with Alex
  maxStock: 10, // stock per work is capped at this for now

  // Shipping, per order: price for the first work + each extra work, plus a surcharge per framed work.
  // TODO: replace the example numbers with Alex's real rates.
  shipping: {
    zones: [
      { id: "se", name: "Sweden", first: 12, extra: 4 },
      { id: "eu", name: "European Union", first: 18, extra: 5 },
      { id: "world", name: "Rest of the world", first: 30, extra: 8 }
    ],
    framedSurcharge: 15
  },
  previewNotice: true // shows "sample content" banner until real works are in
};

window.AP_TECHNIQUES = {
  etching: {
    name: "Etching",
    family: "Intaglio",
    short: "Lines bitten into a copper or zinc plate with acid, inked into the grooves and printed under heavy pressure.",
    look: "Fine, crisp lines and a raised plate mark around the image."
  },
  drypoint: {
    name: "Drypoint",
    family: "Intaglio",
    short: "Lines scratched directly into a metal or plexiglass plate with a steel needle. The raised burr holds ink and gives a soft, velvety line.",
    look: "Warm, slightly blurred lines. Editions are small because the burr wears down."
  },
  aquatint: {
    name: "Aquatint",
    family: "Intaglio",
    short: "Rosin dust is fused to the plate and etched, creating areas of tone rather than line.",
    look: "Grainy, watercolour-like tonal fields."
  },
  linocut: {
    name: "Linocut",
    family: "Relief",
    short: "The image is carved into linoleum. Ink sits on the uncut surface and is pressed onto paper.",
    look: "Bold contrast, visible gouge marks, flat areas of colour."
  },
  woodcut: {
    name: "Woodcut",
    family: "Relief",
    short: "Carved along the plank of a wood block. The grain of the wood often prints with the image.",
    look: "Strong shapes with the texture of the grain."
  },
  monotype: {
    name: "Monotype",
    family: "Planographic",
    short: "Ink is painted onto a smooth plate and transferred once. Every monotype is unique.",
    look: "Painterly, soft edges. One impression only."
  },
  oil: { name: "Oil", family: "Painting", short: "Oil on canvas or board.", look: "" },
  acrylic: { name: "Acrylic", family: "Painting", short: "Acrylic on canvas or paper.", look: "" },
  watercolour: { name: "Watercolour", family: "Painting", short: "Watercolour on paper.", look: "" }
};

window.AP_CATEGORIES = {
  print: { name: "Prints", singular: "Print" },
  painting: { name: "Paintings", singular: "Painting" },
  proof: { name: "Proofs & studies", singular: "Proof" }
};

/*
  Fields
  - category: print | painting | proof
  - technique: key from AP_TECHNIQUES
  - imageSize / sheetSize: [width, height] in cm (sheet = full paper, prints only)
  - edition: { size, available } for editioned prints; `available` is the stock you can sell
    right now (capped at AP_CONFIG.maxStock). Lower it by hand when something sells.
    null for unique works
  - available: for unique works (paintings, monotypes, proofs)
  - price: in AP_CONFIG.currency (fixed price); null = price on request
  - paymentLink: optional Stripe Payment Link (https://buy.stripe.com/...) for a direct "Buy now"
  - frameable: offer the framing option
  - art: placeholder settings, ignored once `image` is set
*/
window.AP_WORKS = [
  {
    id: "old-town",
    title: "Old town",
    category: "print",
    technique: "woodcut",
    year: 2025,
    imageSize: null, // TODO: image size in cm
    sheetSize: null, // TODO: sheet size in cm
    paper: null, // TODO
    edition: { size: 10, available: 10 }, // TODO: confirm how many are left
    price: null, // TODO: fixed price from Alex (until then it shows "Price on request")
    paymentLink: "", // TODO: Stripe Payment Link, optional
    frameable: false,
    featured: true,
    image: null,
    // From Instagram, posted as three parts of one panorama. Replace with a full-resolution photo of the print.
    images: ["assets/img/works/old-town-1.jpg", "assets/img/works/old-town-2.jpg", "assets/img/works/old-town-3.jpg"],
    ratio: 1440 / 640,
    heroTrim: [17 / 1440, 74 / 640, 1435 / 1440, 569 / 640], // the carved image inside the photos, without the paper margins
    description: "Neoclassical houses of the old town of Patras under a dark, cloudy sky. Carved in wood and printed by hand, in a limited edition of 10."
  },
  {
    id: "untitled-i",
    title: "Untitled I",
    category: "print",
    technique: "etching",
    year: 2026,
    imageSize: [20, 28],
    sheetSize: [35, 45],
    paper: "Hahnemühle Copperplate, 300 gsm",
    edition: { size: 20, available: 13 },
    price: 180,
    frameable: true,
    featured: true,
    image: null,
    art: { seed: 11, palette: "black" },
    description: "Sample description. Replace with a few lines about the work: the subject, where the idea came from, how the plate was made."
  },
  {
    id: "untitled-ii",
    title: "Untitled II",
    category: "print",
    technique: "linocut",
    year: 2026,
    imageSize: [30, 30],
    sheetSize: [42, 46],
    paper: "Japanese kozo, 60 gsm",
    edition: { size: 15, available: 4 },
    price: 150,
    frameable: true,
    featured: true,
    image: null,
    art: { seed: 23, palette: "black" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "untitled-iii",
    title: "Untitled III",
    category: "print",
    technique: "aquatint",
    year: 2025,
    imageSize: [24, 18],
    sheetSize: [38, 32],
    paper: "Somerset Satin, 300 gsm",
    edition: { size: 12, available: 7 },
    price: 220,
    frameable: true,
    featured: true,
    image: null,
    art: { seed: 37, palette: "sepia" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "untitled-iv",
    title: "Untitled IV",
    category: "print",
    technique: "woodcut",
    year: 2025,
    imageSize: [40, 55],
    sheetSize: [56, 72],
    paper: "Awagami Bunkoshi",
    edition: { size: 10, available: 0 },
    price: 340,
    frameable: false,
    featured: false,
    image: null,
    art: { seed: 41, palette: "black" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "untitled-v",
    title: "Untitled V",
    category: "print",
    technique: "drypoint",
    year: 2025,
    imageSize: [15, 20],
    sheetSize: [28, 35],
    paper: "Fabriano Rosaspina, 285 gsm",
    edition: { size: 8, available: 5 },
    price: 140,
    frameable: true,
    featured: true,
    image: null,
    art: { seed: 53, palette: "black" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "untitled-vi",
    title: "Untitled VI",
    category: "print",
    technique: "linocut",
    year: 2024,
    imageSize: [21, 29.7],
    sheetSize: [30, 40],
    paper: "Zerkall, 145 gsm",
    edition: { size: 25, available: 18 },
    price: 95,
    frameable: true,
    featured: false,
    image: null,
    art: { seed: 67, palette: "red" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "untitled-vii",
    title: "Untitled VII",
    category: "print",
    technique: "monotype",
    year: 2026,
    imageSize: [30, 40],
    sheetSize: [40, 50],
    paper: "Hahnemühle Copperplate, 300 gsm",
    edition: null,
    available: true,
    price: 260,
    frameable: true,
    featured: false,
    image: null,
    art: { seed: 71, palette: "blue" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "untitled-viii",
    title: "Untitled VIII",
    category: "print",
    technique: "etching",
    year: 2024,
    imageSize: [30, 22],
    sheetSize: [45, 38],
    paper: "Somerset Satin, 300 gsm",
    edition: { size: 18, available: 9 },
    price: 200,
    frameable: true,
    featured: false,
    image: null,
    art: { seed: 83, palette: "sepia" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "study-i",
    title: "Study I (trial proof)",
    category: "proof",
    technique: "etching",
    year: 2026,
    imageSize: [20, 28],
    sheetSize: [32, 40],
    paper: "Proofing paper",
    edition: null,
    available: true,
    price: 90,
    frameable: true,
    featured: false,
    image: null,
    art: { seed: 12, palette: "sepia" },
    description: "A trial proof pulled while the plate was still being worked. It shows an earlier state of Untitled I."
  },
  {
    id: "study-ii",
    title: "Study II (artist's proof)",
    category: "proof",
    technique: "linocut",
    year: 2026,
    imageSize: [30, 30],
    sheetSize: [40, 42],
    paper: "Japanese kozo, 60 gsm",
    edition: null,
    available: true,
    price: 120,
    frameable: true,
    featured: false,
    image: null,
    art: { seed: 24, palette: "red" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "painting-i",
    title: "Painting I",
    category: "painting",
    technique: "oil",
    year: 2026,
    imageSize: [60, 80],
    sheetSize: null,
    paper: "Linen canvas",
    edition: null,
    available: true,
    price: 1200,
    frameable: false,
    featured: true,
    image: null,
    art: { seed: 91, palette: "earth" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "painting-ii",
    title: "Painting II",
    category: "painting",
    technique: "acrylic",
    year: 2025,
    imageSize: [50, 50],
    sheetSize: null,
    paper: "Cotton canvas",
    edition: null,
    available: false,
    price: 850,
    frameable: false,
    featured: false,
    image: null,
    art: { seed: 97, palette: "sea" },
    description: "Sample description. Replace with the real text."
  },
  {
    id: "painting-iii",
    title: "Painting III",
    category: "painting",
    technique: "watercolour",
    year: 2025,
    imageSize: [36, 26],
    sheetSize: null,
    paper: "Arches cold press, 300 gsm",
    edition: null,
    available: true,
    price: null,
    frameable: true,
    featured: false,
    image: null,
    art: { seed: 103, palette: "sea" },
    description: "Sample description. Replace with the real text."
  }
];
