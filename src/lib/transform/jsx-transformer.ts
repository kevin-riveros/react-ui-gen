import * as Babel from "@babel/standalone";
import { sourceMappingPlugin, getSelectionScript } from "@/lib/inspect";
import { resolveRelativePath } from "@/lib/path-utils";
import {
  getDsImportMap,
  getGoogleFontsUrl,
  getThemeClass,
  hasComponentCss,
  shouldLoadTailwind,
} from "@/lib/config/client";

/**
 * CDN used to resolve any bare import specifier the preview encounters that
 * isn't already in the DS import map or the pinned React entries. Centralized
 * so switching the CDN (or pinning a proxy in front of esm.sh) is one edit.
 */
const ESM_SH_BASE = "https://esm.sh";

/**
 * React runtime entries always present in the preview's import map. The
 * preview iframe has no bundler — React/ReactDOM have to come from a CDN, and
 * the host app pins them here. Bump the `@19` suffix when upgrading React so
 * preview-side React stays in sync with the version declared in
 * `package.json`.
 */
const CORE_IMPORTS: Readonly<Record<string, string>> = {
  react: `${ESM_SH_BASE}/react@19`,
  "react-dom": `${ESM_SH_BASE}/react-dom@19`,
  "react-dom/client": `${ESM_SH_BASE}/react-dom@19/client`,
  "react/jsx-runtime": `${ESM_SH_BASE}/react@19/jsx-runtime`,
  "react/jsx-dev-runtime": `${ESM_SH_BASE}/react@19/jsx-dev-runtime`,
};

/**
 * Every import-map key a VFS file should be registered under. The preview
 * iframe's import map resolves imports by exact-match, so a file at
 * `/components/Button.tsx` must answer to every shape the user's code
 * might write:
 *
 *   /components/Button.tsx  — absolute, as-is
 *   components/Button.tsx   — leading slash dropped (bare specifier)
 *   @/components/Button.tsx — `@/` TS/Next convention
 *   plus the extension-less variant of each (`/components/Button`, ...).
 *
 * Centralized so adding a new shape is one edit instead of sprinkling
 * `imports[...] = blobUrl` lines through `createImportMap`.
 */
export function getImportMapAliases(path: string): string[] {
  const aliases = [path];

  if (path.startsWith("/")) {
    const noSlash = path.substring(1);
    aliases.push(noSlash, `@/${noSlash}`);
  }

  const withoutExt = path.replace(/\.(jsx?|tsx?)$/, "");
  if (withoutExt !== path) {
    aliases.push(withoutExt);
    if (path.startsWith("/")) {
      const noSlashNoExt = withoutExt.substring(1);
      aliases.push(noSlashNoExt, `@/${noSlashNoExt}`);
    }
  }

  return aliases;
}

export interface TransformResult {
  code: string;
  error?: string;
  missingImports?: Set<string>;
  cssImports?: Set<string>;
}

// Helper to create a placeholder module
function createPlaceholderModule(componentName: string): string {
  return `
import React from 'react';
const ${componentName} = function() {
  return React.createElement('div', {}, null);
}
export default ${componentName};
export { ${componentName} };
`;
}


export function transformJSX(
  code: string,
  filename: string
): TransformResult {
  try {
    const isTypeScript = filename.endsWith(".ts") || filename.endsWith(".tsx");

    // Pre-process imports to handle missing files
    let processedCode = code;
    const importRegex =
      /import\s+(?:{[^}]+}|[^,\s]+)?\s*(?:,\s*{[^}]+})?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = new Set<string>();
    const cssImports = new Set<string>();

    // Detect side-effect CSS imports (`import "./styles.css"`) and strip
    // them in one pass — they're handled by the preview's CSS collector, not
    // emitted as ES modules. Default-import CSS (`import x from "a.css"`) is
    // caught by the `endsWith('.css')` guard further below.
    const cssImportRegex = /import\s+['"]([^'"]+\.css)['"]/g;
    processedCode = processedCode.replace(cssImportRegex, (_match, path) => {
      cssImports.add(path);
      return "";
    });

    // Rewrite relative imports (./x, ../x) to *bare specifiers* matching the
    // entries created in `createImportMap()`. Example: `./components/Footer`
    // inside /App.tsx → `components/Footer`. Emitting a leading-slash path
    // like `/components/Footer` would make the browser try to resolve it as
    // a URL against the blob-URL base of the importing module — blob URLs
    // aren't hierarchical, so that throws `Invalid relative url`. Bare
    // specifiers hit the import map by exact-match and work reliably.
    const fileDir = filename.substring(0, filename.lastIndexOf("/")) || "/";
    processedCode = processedCode.replace(
      /(import\s+(?:{[^}]+}|[^,\s]+)?\s*(?:,\s*{[^}]+})?\s+from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
      (_full, prefix: string, relPath: string, suffix: string) => {
        const resolved = resolveRelativePath(fileDir, relPath); // "/components/Footer"
        const bare = resolved.replace(/^\/+/, ""); // "components/Footer"
        return `${prefix}${bare}${suffix}`;
      }
    );

    let match;
    while ((match = importRegex.exec(processedCode)) !== null) {
      // Skip CSS files from regular imports
      if (!match[1].endsWith('.css')) {
        imports.add(match[1]);
      }
    }

    const result = Babel.transform(processedCode, {
      filename,
      presets: [
        ["react", { runtime: "automatic" }],
        ...(isTypeScript ? ["typescript"] : []),
      ],
      plugins: [sourceMappingPlugin],
    });

    return {
      code: result.code || "",
      missingImports: imports,
      cssImports: cssImports,
    };
  } catch (error) {
    return {
      code: "",
      error: error instanceof Error ? error.message : "Unknown transform error",
    };
  }
}

export function createBlobURL(
  code: string,
  mimeType: string = "application/javascript"
): string {
  const blob = new Blob([code], { type: mimeType });
  return URL.createObjectURL(blob);
}

export interface ImportMapResult {
  importMap: string;
  styles: string;
  errors: Array<{ path: string; error: string }>;
  /**
   * Every `blob:` URL that was allocated while building this import map.
   * Callers MUST call `URL.revokeObjectURL()` on these once the iframe
   * finishes loading them (or when a new preview is about to be built),
   * otherwise the browser holds the underlying Blob in memory indefinitely.
   */
  blobUrls: string[];
}

export function createImportMap(files: Map<string, string>): ImportMapResult {
  const blobUrls: string[] = [];
  const trackBlobURL = (code: string, mimeType?: string): string => {
    const url = createBlobURL(code, mimeType);
    blobUrls.push(url);
    return url;
  };
  const imports: Record<string, string> = {
    ...CORE_IMPORTS,
    ...getDsImportMap(),
  };

  // Transform each file and create blob URLs
  const transformedFiles = new Map<string, string>();
  const allImports = new Set<string>();
  const allCssImports = new Set<{ from: string; cssPath: string }>();
  let collectedStyles = "";
  const errors: Array<{ path: string; error: string }> = [];

  // First pass: transform all files and collect imports
  for (const [path, content] of files) {
    if (
      path.endsWith(".js") ||
      path.endsWith(".jsx") ||
      path.endsWith(".ts") ||
      path.endsWith(".tsx")
    ) {
      const { code, error, missingImports, cssImports } = transformJSX(
        content,
        path
      );
      
      if (error) {
        // Track error for this file
        errors.push({ path, error });
        // Skip processing this file entirely
        continue;
      }
      
      // Normal successful transform
      const blobUrl = trackBlobURL(code);
      transformedFiles.set(path, blobUrl);

      // Collect all imports
      if (missingImports) {
        missingImports.forEach((imp) => {
          // Check if this is a third-party package
          const isPackage = !imp.startsWith(".") && 
                            !imp.startsWith("/") && 
                            !imp.startsWith("@/");
          
          if (isPackage) {
            // Only add to esm.sh if not already mapped (e.g. private packages)
            if (!imports[imp]) {
              imports[imp] = `${ESM_SH_BASE}/${imp}`;
            }
          } else {
            // Add local imports to be processed later
            allImports.add(imp);
          }
        });
      }

      // Collect CSS imports
      if (cssImports) {
        cssImports.forEach((cssImport) => {
          allCssImports.add({ from: path, cssPath: cssImport });
        });
      }

      // Register the file under every shape user code might import it as.
      for (const alias of getImportMapAliases(path)) {
        imports[alias] = blobUrl;
      }
    } else if (path.endsWith(".css")) {
      // Collect CSS file content
      collectedStyles += `/* ${path} */\n${content}\n\n`;
    }
  }

  // Process CSS imports
  for (const { from, cssPath } of allCssImports) {
    // Resolve CSS path relative to the importing file
    let resolvedPath = cssPath;
    
    if (cssPath.startsWith("@/")) {
      // @/ alias points to root
      resolvedPath = cssPath.replace("@/", "/");
    } else if (cssPath.startsWith("./") || cssPath.startsWith("../")) {
      // Relative path
      const fromDir = from.substring(0, from.lastIndexOf("/"));
      resolvedPath = resolveRelativePath(fromDir, cssPath);
    }

    // Check if CSS file exists
    if (files.has(resolvedPath)) {
      // Already processed in the loop above
    } else {
      // CSS file not found
      collectedStyles += `/* ${cssPath} not found */\n`;
    }
  }

  // Second pass: create placeholder modules for missing imports
  for (const importPath of allImports) {
    // Skip if it's a known module or already exists
    if (imports[importPath] || importPath.startsWith("react")) {
      continue;
    }

    // Check if this is a third-party package (no relative path indicators)
    const isPackage = !importPath.startsWith(".") && 
                      !importPath.startsWith("/") && 
                      !importPath.startsWith("@/");

    if (isPackage) {
      // Handle third-party packages from esm.sh
      const packageUrl = `${ESM_SH_BASE}/${importPath}`;
      imports[importPath] = packageUrl;
      continue;
    }

    // Check if the import exists in any form (local files)
    let found = false;
    const variations = [
      importPath,
      importPath + ".jsx",
      importPath + ".tsx",
      importPath + ".js",
      importPath + ".ts",
      importPath.replace("@/", "/"),
      importPath.replace("@/", "/") + ".jsx",
      importPath.replace("@/", "/") + ".tsx",
    ];

    for (const variant of variations) {
      if (imports[variant] || files.has(variant)) {
        found = true;
        break;
      }
    }

    if (!found) {
      // Extract component name from path
      const match = importPath.match(/\/([^\/]+)$/);
      const componentName = match
        ? match[1]
        : importPath.replace(/[^a-zA-Z0-9]/g, "");

      // Create placeholder module
      const placeholderCode = createPlaceholderModule(componentName);
      const placeholderUrl = trackBlobURL(placeholderCode);

      // Add all possible import variations
      imports[importPath] = placeholderUrl;
      if (importPath.startsWith("@/")) {
        imports[importPath.replace("@/", "/")] = placeholderUrl;
        imports[importPath.replace("@/", "")] = placeholderUrl;
      }
    }
  }

  return {
    importMap: JSON.stringify({ imports }, null, 2),
    styles: collectedStyles,
    errors,
    blobUrls,
  };
}

/**
 * Strip Tailwind v4 config directives (`@import`, `@plugin`, `@source`) from
 * user CSS before inlining into the preview iframe. These directives are
 * meaningful to the Tailwind browser runtime but, if left in a plain
 * `<style>` block, the browser treats them as real CSS `@import` URLs and
 * fetches them against the document base URL — showing up as spurious
 * `/chat/tailwindcss` 307s / 404s in the server log. Also escape any
 * inline `</style>` so the block itself can't be terminated early.
 */
function sanitizePreviewCss(css: string): string {
  return css
    .replace(/@import\s+["'][^"']*["'];?/g, "")
    .replace(/@plugin\s+["'][^"']*["'];?/g, "")
    .replace(/@source\s+["'][^"']*["'];?/g, "")
    .replace(/<\/style>/g, "<\\/style>");
}

export function createPreviewHTML(
  entryPoint: string,
  importMap: string,
  styles: string = "",
  errors: Array<{ path: string; error: string }> = [],
  compiledCss: string = "",
  userCss: string = "",
  dsTailwindConfig: string = ""
): string {
  // Parse the import map to get the blob URL for the entry point
  let entryPointUrl = entryPoint;
  try {
    const importMapObj = JSON.parse(importMap);
    if (importMapObj.imports && importMapObj.imports[entryPoint]) {
      entryPointUrl = importMapObj.imports[entryPoint];
    }
  } catch (e) {
    console.error("Failed to parse import map:", e);
  }

  const fontsUrl = getGoogleFontsUrl();
  const fontsTag = fontsUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsUrl}" rel="stylesheet">`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  ${fontsTag}
  ${hasComponentCss() ? `<link rel="stylesheet" href="/packages/styles-bundle.css">` : ""}
  ${compiledCss ? `<style id="tailwind-compiled">\n${compiledCss}\n</style>` : ''}
  ${
    shouldLoadTailwind()
      ? `
  <!--
    Tailwind v4 browser runtime reads this style tag's textContent. We
    populate it from JS rather than inline HTML so the browser preload
    scanner never sees the raw @import directive and skips the spurious
    /chat/tailwindcss fetch that used to show up as a 307 in the server log.
  -->
  <style id="uigen-tw-input" type="text/tailwindcss"></style>
  <script>
    (function(){
      var el = document.getElementById("uigen-tw-input");
      el.textContent = ${JSON.stringify(
        `@import "tailwindcss";\n${dsTailwindConfig}\n${sanitizePreviewCss(userCss)}`
      )};
    })();
  </script>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>`
      : userCss
        ? `<style>${sanitizePreviewCss(userCss)}</style>`
        : ""
  }
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    #root {
      width: 100%;
      min-height: 100vh;
    }
    .error-boundary {
      color: red;
      padding: 1rem;
      border: 2px solid red;
      margin: 1rem;
      border-radius: 4px;
      background: #fee;
    }
    .syntax-errors {
      background: #fef5f5;
      border: 2px solid #ff6b6b;
      border-radius: 12px;
      padding: 32px;
      margin: 24px;
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .syntax-errors h3 {
      color: #dc2626;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .syntax-errors .error-item {
      margin: 16px 0;
      padding: 16px;
      background: #fff;
      border-radius: 8px;
      border-left: 4px solid #ff6b6b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .syntax-errors .error-path {
      font-weight: 600;
      color: #991b1b;
      font-size: 15px;
      margin-bottom: 8px;
    }
    .syntax-errors .error-message {
      color: #7c2d12;
      margin-top: 8px;
      white-space: pre-wrap;
      line-height: 1.5;
      font-size: 13px;
    }
    .syntax-errors .error-location {
      display: inline-block;
      background: #fee0e0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 8px;
      color: #991b1b;
    }
  </style>
  ${styles ? `<style>\n${sanitizePreviewCss(styles)}</style>` : ''}
  <script type="importmap">
    ${importMap}
  </script>
</head>
<body class="${getThemeClass()}">
  <script>document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(a){e.preventDefault();e.stopPropagation();}},true);</script>
  ${errors.length > 0 ? `
    <script>
      try {
        window.parent.postMessage({
          type: 'uigen-preview-error',
          message: ${JSON.stringify(
            errors
              .map((e) => `${e.path}: ${e.error}`)
              .join("\n")
          )},
          stack: null,
        }, '*');
      } catch (_) {}
    </script>
    <div class="syntax-errors">
      <h3>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0;">
          <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15h-2v-2h2v2zm0-4h-2V5h2v6z" fill="#dc2626"/>
        </svg>
        Syntax Error${errors.length > 1 ? 's' : ''} (${errors.length})
      </h3>
      ${errors.map(e => {
        const locationMatch = e.error.match(/\((\d+:\d+)\)/);
        const location = locationMatch ? locationMatch[1] : '';
        const cleanError = e.error.replace(/\(\d+:\d+\)/, '').trim();
        
        return `
        <div class="error-item">
          <div class="error-path">
            ${e.path}
            ${location ? `<span class="error-location">${location}</span>` : ''}
          </div>
          <div class="error-message">${cleanError.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      `;
      }).join('')}
    </div>
  ` : ''}
  <div id="root"></div>
  ${errors.length === 0 ? `<script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        try {
          window.parent.postMessage({
            type: 'uigen-preview-error',
            message: (error && error.message) ? error.message : String(error),
            stack: (error && error.stack) ? String(error.stack) : null,
          }, '*');
        } catch (_) {}
      }

      render() {
        if (this.state.hasError) {
          return React.createElement('div', { className: 'error-boundary' },
            React.createElement('h2', null, 'Something went wrong'),
            React.createElement('pre', null, this.state.error?.toString())
          );
        }

        return this.props.children;
      }
    }

    async function loadApp() {
      try {
        const module = await import('${entryPointUrl}');
        const App = module.default || module.App;
        
        if (!App) {
          throw new Error('No default export or App export found in ${entryPoint}');
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
          React.createElement(ErrorBoundary, null,
            React.createElement(App)
          )
        );
      } catch (error) {
        console.error('Failed to load app:', error);
        const importMapParsed = ${JSON.stringify(importMap)};
        console.error('Import map:', importMapParsed);
        const detail = error.stack || error.toString();
        document.getElementById('root').innerHTML =
          '<div style="font-family:monospace;padding:24px;color:#dc2626;">' +
          '<h2 style="margin:0 0 12px">Failed to load app</h2>' +
          '<pre style="white-space:pre-wrap;font-size:13px;background:#fef2f2;padding:16px;border-radius:8px;border:1px solid #fecaca;">' +
          detail.replace(/</g,'&lt;') + '</pre>' +
          '</div>';
        // Notify the parent frame so the Fix-with-agent button can appear.
        try {
          window.parent.postMessage({
            type: 'uigen-preview-error',
            message: (error && error.message) ? error.message : String(error),
            stack: error && error.stack ? String(error.stack) : null,
          }, '*');
        } catch (_) { /* cross-origin or detached iframe — best-effort */ }
      }
    }

    loadApp();
  </script>` : ''}
  ${getSelectionScript()}
</body>
</html>`;
}
