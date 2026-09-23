import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build "enxuto": só o necessário pra rodar entra na imagem final (sem devDependencies,
  // sem o node_modules inteiro) — sem isso a imagem Docker fica bem maior do que precisa.
  output: "standalone",
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
