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
