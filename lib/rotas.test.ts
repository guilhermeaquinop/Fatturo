// Testes das regras de acesso às rotas. Equivalem a testes de middleware 'auth'/'guest' no Pest.
import { describe, expect, it } from "vitest";
import { redirecionamento } from "@/lib/rotas";

describe("redirecionamento", () => {
  it("manda a raiz para o login ou para o app", () => {
    expect(redirecionamento("/", false)).toBe("/login");
    expect(redirecionamento("/", true)).toBe("/painel");
  });

  it("deixa o visitante nas telas de acesso", () => {
    for (const rota of ["/login", "/cadastro", "/cadastro/confirmar", "/recuperar-senha"]) {
      expect(redirecionamento(rota, false)).toBeNull();
    }
  });

  it("tira o usuário logado das telas de acesso", () => {
    for (const rota of ["/login", "/cadastro", "/cadastro/confirmar", "/recuperar-senha"]) {
      expect(redirecionamento(rota, true)).toBe("/painel");
    }
  });

  it("exige login nas rotas do app, inclusive na de nova senha", () => {
    for (const rota of ["/configuracao", "/nova-senha", "/painel", "/qualquer/coisa"]) {
      expect(redirecionamento(rota, false)).toBe("/login");
      expect(redirecionamento(rota, true)).toBeNull();
    }
  });

  it("mantém abertas para todos a confirmação por e-mail e os documentos legais", () => {
    for (const rota of ["/auth/confirm", "/termos", "/privacidade"]) {
      expect(redirecionamento(rota, false)).toBeNull();
      expect(redirecionamento(rota, true)).toBeNull();
    }
  });

  it("não trata como pública uma rota que só começa com o mesmo texto", () => {
    expect(redirecionamento("/login-falso", false)).toBe("/login");
    expect(redirecionamento("/termos-internos", false)).toBe("/login");
  });
});
