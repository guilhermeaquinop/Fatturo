// Sobe o Supabase local e desliga o reinício automático dos contêineres.
// Equivale a um comando Artisan customizado (php artisan ...), chamado por `npm run db:start`.
//
// O Supabase CLI cria os contêineres com a política "unless-stopped", que os religa
// sempre que o Docker abre. Aqui ela vira "no": eles só sobem com este comando e
// ficam no ar até `npm run db:stop`, como num `docker-compose up -d` comum.
import { execFileSync, spawnSync } from "node:child_process";

// Mesmo valor de project_id em supabase/config.toml; o CLI o usa no nome dos contêineres.
const PROJETO = "Fatturo";

// Argumentos extras são repassados ao CLI: npm run db:start -- -x studio
const comando = ["npx", "supabase", "start", ...process.argv.slice(2)].join(" ");
const inicio = spawnSync(comando, { stdio: "inherit", shell: true });
if (inicio.status !== 0) process.exit(inicio.status ?? 1);

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
