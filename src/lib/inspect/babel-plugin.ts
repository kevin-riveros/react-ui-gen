/**
 * Babel plugin that injects data-source-* attributes onto JSX elements
 * during transformation. These attributes exist only in the preview iframe DOM,
 * never in the source code shown in the editor.
 *
 * Adds:
 *   data-source-file="/App.jsx"
 *   data-source-line="24"
 *   data-source-component="Hero"
 */

// Babel's AST types aren't worth pulling in — this plugin runs inside the
// browser Babel standalone build and we only touch a handful of node shapes.
interface BabelIdentifier {
  type: string;
  name?: string;
  object?: BabelIdentifier;
  property?: BabelIdentifier;
}
interface BabelNode {
  type: string;
  name?: BabelIdentifier;
  attributes?: BabelAttribute[];
  loc?: { start?: { line?: number } };
  id?: { name?: string };
  declaration?: { id?: { name?: string } };
}
interface BabelAttribute {
  type: string;
  name?: { type: string; name?: string };
  value?: { type: string; value?: string };
}
interface BabelPath {
  node: BabelNode;
  parentPath?: BabelPath | null;
}

export function sourceMappingPlugin() {
  return {
    visitor: {
      JSXOpeningElement(
        path: BabelPath,
        state: { filename?: string }
      ) {
        const node = path.node;
        if (!node.name) return;

        // Skip fragments (<> ... </>)
        if (
          node.name.type === "JSXIdentifier" &&
          node.name.name === "Fragment"
        ) {
          return;
        }
        if (node.name.type === "JSXMemberExpression") {
          const obj = node.name.object;
          const prop = node.name.property;
          if (obj?.name === "React" && prop?.name === "Fragment") {
            return;
          }
        }

        // Skip if already has data-source attributes
        const hasAttr = (node.attributes ?? []).some(
          (attr) =>
            attr.type === "JSXAttribute" &&
            typeof attr.name?.name === "string" &&
            attr.name.name.startsWith("data-source-")
        );
        if (hasAttr) return;

        const filename = state.filename || "unknown";
        const line = node.loc?.start?.line?.toString() || "0";
        const componentName = findEnclosingComponentName(path);

        // Helper to create a JSX string attribute
        const makeAttr = (name: string, value: string) => ({
          type: "JSXAttribute",
          name: { type: "JSXIdentifier", name },
          value: { type: "StringLiteral", value },
        });

        (node.attributes ??= []).push(
          makeAttr("data-source-file", filename),
          makeAttr("data-source-line", line)
        );

        if (componentName) {
          node.attributes.push(
            makeAttr("data-source-component", componentName)
          );
        }
      },
    },
  };
}

/**
 * Walk up the AST to find the enclosing component name.
 * Looks for function declarations, arrow functions assigned to variables,
 * or export default function patterns.
 */
function findEnclosingComponentName(path: BabelPath): string | null {
  let current = path.parentPath;
  while (current) {
    const node = current.node;

    // function Hero() { ... }
    if (
      node.type === "FunctionDeclaration" &&
      node.id?.name
    ) {
      return node.id.name;
    }

    // const Hero = () => { ... }  or  const Hero = function() { ... }
    if (node.type === "VariableDeclarator" && node.id?.name) {
      return node.id.name;
    }

    // export default function Hero() { ... }
    if (
      node.type === "ExportDefaultDeclaration" &&
      node.declaration?.id?.name
    ) {
      return node.declaration.id.name;
    }

    current = current.parentPath;
  }
  return null;
}
