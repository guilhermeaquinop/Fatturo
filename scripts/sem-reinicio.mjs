// Desliga o reinício automático dos contêineres do Supabase local.
// Equivale a um comando Artisan customizado (php artisan ...), usado por `npm run db:start`
// e `npm run db:reset`; também roda sozinho com `node scripts/sem-reinicio.mjs`.
//
// O Supabase CLI cria os contêineres com a política "unless-stopped", que os religa
// sempre que o Docker abre. Aqui ela vira "no": eles só sobem com `npm run db:start`
// e ficam no ar até `npm run db:stop`, como num `docker-compose up -d` comum.
// O `supabase db reset` recria o contêiner do banco com a política padrão, por isso
// o db:reset também chama este script.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Mesmo valor de project_id em supabase/config.toml; o CLI o usa no nome dos contêineres.
const PROJETO = "Fatturo";

export function desligarReinicio() {
  const ids = execFileSync("docker", ["ps", "-q", "--filter", `name=_${PROJETO}$`], {
    encoding: "utf8",
  })
    .split(/\s+/)
    .filter(Boolean);

  if (ids.length === 0) {
    console.error("Nenhum contêiner do Supabase encontrado para desligar o reinício automático.");
    process.exit(1);
  }

  execFileSync("docker", ["update", "--restart=no", ...ids], { stdio: "ignore" });
  console.log(`Reinício automático desligado em ${ids.length} contêineres.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) desligarReinicio();
