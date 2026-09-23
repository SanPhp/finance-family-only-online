// O output "standalone" do Next.js não inclui `public/` nem `.next/static/` por padrão —
// isso é intencional (eles não passam pelo tree-shaking de dependências), mas o servidor
// standalone precisa deles do lado para servir os assets. Copiamos depois de cada build.
// Script em Node puro (não `cp -r`) para funcionar igual no Windows (dev local) e Linux (deploy).
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const copies = [
  [join(root, "public"), join(root, ".next", "standalone", "public")],
  [join(root, ".next", "static"), join(root, ".next", "standalone", ".next", "static")],
];

for (const [from, to] of copies) {
  if (!existsSync(from)) continue;
  cpSync(from, to, { recursive: true });
}
