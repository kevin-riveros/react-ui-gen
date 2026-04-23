# 🖼️ Browser preview engine

The preview you see on the right side of UI Gen is not running on a server. It's an iframe in your browser — and that's the whole trick.

---

## 🎯 The goal

Render real React code — with real components from your real design system — without provisioning a container per user, without a CDN, without a build server.

---

## 🧱 The stack inside the iframe

Every preview is a single `iframe` with a `srcdoc` attribute. Inside that srcdoc:

### 1. **Babel Standalone**

The agent writes JSX like `<Button color="primary">Click</Button>`. Browsers don't run JSX natively, so [`@babel/standalone`](https://babeljs.io/docs/babel-standalone) transforms it to plain JS at runtime.

### 2. **Tailwind in the browser**

[`@tailwindcss/browser`](https://tailwindcss.com) scans the rendered HTML at runtime and generates only the CSS you actually use. No build step. No PostCSS. No config file the preview has to know about.

### 3. **ESM import maps**

When Claude writes `import { Button } from "@heroui/react"`, the iframe needs to resolve that import somewhere. The preview ships an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap):

```html
<script type="importmap">
{
  "imports": {
    "@heroui/react": "/packages/heroui-react.js",
    "framer-motion": "/packages/framer-motion.js"
  }
}
</script>
```

Those files are **pre-bundled** by esbuild at `pnpm prebuild` and live in `public/packages/`. The browser loads them directly.

### 4. **The virtual filesystem → srcdoc**

Every file Claude wrote gets concatenated into the iframe's HTML. The entry file becomes a `<script type="module">`. React takes over. Your UI renders.

---

## ⚡ Why this scales

| Other tools | UI Gen |
|---|---|
| Spin up a WebContainer per user (~50MB RAM) | One iframe per tab |
| Boot a sandbox VM | A `srcdoc` string |
| Run a build server | Babel + Tailwind in-browser |
| CDN the DS | `public/packages/*.js` served by Next.js |

There's nothing to provision. One host can serve thousands of concurrent previews because the work happens in each visitor's browser.

---

## 🎨 How themes apply

- **Fonts:** `<link>` tags to Google Fonts are injected at the top of the srcdoc.
- **CSS variables:** Tailwind v4's `@theme` block from your config gets inlined so brand colors, spacing, and radii are available as custom properties.
- **Precompiled CSS:** If your DS ships a styles bundle (e.g. HeroUI's), it's concatenated into `public/packages/styles-bundle.css` and `<link>`ed.
- **Theme class:** `ds.themeClass` gets applied to `<body>` so scoped theming works.

---

## 🛡️ Isolation

The iframe is sandboxed. Even though it runs in your browser, it can't touch the parent app's DOM or cookies. Useful if you're ever pasting in code you don't fully trust.

---

## 📖 Related

- [How it works](./how-it-works.md) — the whole pipeline.
- [The AI agent](./ai-agent.md) — what happens *before* the preview renders.
- [Prototype with your design system](./prototype-with-your-design-system.md) — how `ds.packages` becomes `public/packages/*.js`.
