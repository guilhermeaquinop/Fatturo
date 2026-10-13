// Avatar do usuário: dois desenhos prontos, nas cores dos tokens. Não há envio de foto.
// Equivale a um componente Blade <x-avatar>. A opção escolhida fica em usuario.avatar.
import { cn } from "@/lib/utils";

export const AVATARES = [1, 2] as const;
export type OpcaoDeAvatar = (typeof AVATARES)[number];

export const ROTULO_AVATAR: Record<OpcaoDeAvatar, string> = {
  1: "Avatar claro",
  2: "Avatar escuro",
};

/** Qualquer valor fora das opções vira a primeira. */
export function opcaoDeAvatar(valor: unknown): OpcaoDeAvatar {
  return valor === 2 ? 2 : 1;
}

type AvatarProps = {
  opcao: OpcaoDeAvatar;
  /** O tamanho vem da classe (ex.: size-10). */
  className?: string;
};

export function Avatar({ opcao, className }: AvatarProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      aria-hidden="true"
      // rounded-pill + overflow-hidden recortam o desenho num círculo.
      className={cn("size-10 flex-none overflow-hidden rounded-pill", className)}
    >
      {opcao === 1 ? (
        <>
          <rect width="48" height="48" className="fill-surface-tint-strong" />
          {/* Ombros, cabeça e cabelo curto. */}
          <path d="M7 48c0-10.5 7.5-17 17-17s17 6.5 17 17Z" className="fill-ink" />
          <circle cx="24" cy="19" r="8.5" className="fill-surface" />
          <path d="M15.2 18.6C15.6 13 19.3 9.5 24 9.5s8.4 3.5 8.8 9.1c-2.6-2.7-5.5-4-8.8-4s-6.2 1.3-8.8 4Z" className="fill-brand-deep" />
        </>
      ) : (
        <>
          <rect width="48" height="48" className="fill-ink" />
          {/* Cabelo comprido atrás, ombros e cabeça. */}
          <path d="M12.5 21C12.5 13.8 17.6 9 24 9s11.5 4.8 11.5 12v13h-23Z" className="fill-accent-strong" />
          <path d="M7 48c0-10.5 7.5-17 17-17s17 6.5 17 17Z" className="fill-accent" />
          <circle cx="24" cy="20" r="8" className="fill-on-ink" />
        </>
      )}
    </svg>
  );
}
