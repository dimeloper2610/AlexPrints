# AlexPrints

Website and shop for Alex's prints and paintings. Plain HTML, CSS and JavaScript: no build step, hosted on GitHub Pages.

## Adding real works

Everything the site shows lives in [`assets/js/data.js`](assets/js/data.js):

- `AP_CONFIG`: artist name, contact email, currency, framing price, optional form endpoint. Set `previewNotice: false` once the real works are in.
- `AP_WORKS`: one entry per work. Put photos in `assets/img/works/` and set `image: "assets/img/works/<file>.jpg"`. While `image` is `null`, a generated placeholder is drawn per technique.
- For editioned prints set `edition: { size, available }`. For unique works (paintings, monotypes, proofs) use `edition: null` and `available: true/false`.
- `price: null` shows "Price on request" and an enquiry button instead of add to cart.

Photos of prints work best shot flat, showing the full sheet with its margins.

## How ordering works

The cart is stored in the visitor's browser. "Request order" sends the selection and shipping address to the artist (by email, or to `formEndpoint` if one is set, e.g. Formspree). The artist replies with shipping and a payment link. No payment is taken on the site.

## Run locally

```bash
ruby -run -e httpd . -p 4322
```

## Scripts

- `assets/js/app.js`: header, footer, cart, shop and work pages
- `assets/js/studio.js`: printmaking modules (block-to-print scroll scene, ink cross-sections, tool marks, edition fan)
- `assets/js/ink.js`: WebGL hero, the featured woodblock that visitors ink and print themselves
- `assets/js/motion.js`: smooth scroll (Lenis, from jsDelivr), follower cursor, rolling labels, page transitions

All motion turns off when the visitor's device asks for reduced motion.

## Shop setup checklist

**Stock and prices.** Every work has a fixed `price`. For editions, `edition.available` is the stock (capped at `maxStock`, 10). Lower it by hand in `data.js` when something sells.

**Shipping.** Edit `AP_CONFIG.shipping` in `data.js`: price for the first work and each extra work per region, plus a framed surcharge. The cart adds it automatically.

**Order form by email service (recommended).** Create a free form at formspree.io, then set `AP_CONFIG.formEndpoint` to its URL (`https://formspree.io/f/xxxxxxx`). Orders and contact messages then arrive by email without opening the visitor's mail app. A hidden `_gotcha` field filters bots.

**Direct card payments (optional).** In Stripe, create a Payment Link per work (collect shipping address, limit the number of payments to the stock) and paste it into the work's `paymentLink`. The work page then shows "Buy now".

**Legal pages.** `shipping.html`, `terms.html`, `privacy.html` are drafts. Fill in everything highlighted before opening the shop.
