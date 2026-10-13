-- Migration: avatar do usuário.
-- Equivale a uma migration do Laravel que acrescenta uma coluna (Schema::table).
-- Não há envio de foto: o usuário escolhe entre dois avatares desenhados, e aqui fica só
-- o número da opção. Os desenhos estão em components/avatar.tsx.

alter table public.usuario
  add column avatar smallint not null default 1 check (avatar in (1, 2));

grant update (avatar) on public.usuario to authenticated;
