// Testes dos esquemas das telas de acesso. Equivalem a testes de Form Request no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  cadastroSchema,
  loginSchema,
  novaSenhaSchema,
  recuperarSenhaSchema,
} from "@/lib/validacao/acesso";

const cadastroValido = {
  nome: "Ana Souza",
  email: "ana@empresa.com.br",
  senha: "senha-longa-1",
  confirmacao: "senha-longa-1",
  aceite: true,
};

function mensagens(resultado: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return Object.fromEntries(
    (resultado.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("loginSchema", () => {
  it("aceita e-mail e senha preenchidos e tira espaços do e-mail", () => {
    const resultado = loginSchema.safeParse({ email: "  ana@empresa.com.br ", senha: "x" });
    expect(resultado.success).toBe(true);
    expect(resultado.data?.email).toBe("ana@empresa.com.br");
  });

  it("não exige tamanho mínimo de senha no login", () => {
    expect(loginSchema.safeParse({ email: "ana@empresa.com.br", senha: "curta" }).success).toBe(true);
  });

  it("recusa e-mail vazio, e-mail malformado e senha vazia", () => {
    expect(mensagens(loginSchema.safeParse({ email: "", senha: "" }))).toEqual({
      email: "Informe seu e-mail.",
      senha: "Informe sua senha.",
    });
    expect(mensagens(loginSchema.safeParse({ email: "ana@", senha: "x" }))).toEqual({
      email: "E-mail inválido. Confira o endereço.",
    });
  });
});

describe("cadastroSchema", () => {
  it("aceita um cadastro completo", () => {
    expect(cadastroSchema.safeParse(cadastroValido).success).toBe(true);
  });

  it("exige senha de pelo menos 10 caracteres", () => {
    const nove = "123456789";
    const dez = "1234567890";
    expect(
      mensagens(cadastroSchema.safeParse({ ...cadastroValido, senha: nove, confirmacao: nove })),
    ).toEqual({ senha: "A senha precisa ter pelo menos 10 caracteres." });
    expect(
      cadastroSchema.safeParse({ ...cadastroValido, senha: dez, confirmacao: dez }).success,
    ).toBe(true);
  });

  it("recusa senha acima de 72 caracteres", () => {
    const longa = "a".repeat(73);
    const resultado = cadastroSchema.safeParse({ ...cadastroValido, senha: longa, confirmacao: longa });
    expect(mensagens(resultado)).toHaveProperty("senha");
  });

  it("recusa confirmação diferente da senha e aponta o campo de confirmação", () => {
    const resultado = cadastroSchema.safeParse({ ...cadastroValido, confirmacao: "outra-senha-1" });
    expect(mensagens(resultado)).toEqual({
      confirmacao: "As senhas não são iguais. Digite a mesma senha nos dois campos.",
    });
  });

  it("exige o aceite dos termos", () => {
    const resultado = cadastroSchema.safeParse({ ...cadastroValido, aceite: false });
    expect(mensagens(resultado)).toHaveProperty("aceite");
  });

  it("recusa nome vazio ou só com espaços", () => {
    expect(mensagens(cadastroSchema.safeParse({ ...cadastroValido, nome: "   " }))).toEqual({
      nome: "Informe seu nome.",
    });
  });
});

describe("recuperarSenhaSchema", () => {
  it("valida só o e-mail", () => {
    expect(recuperarSenhaSchema.safeParse({ email: "ana@empresa.com.br" }).success).toBe(true);
    expect(recuperarSenhaSchema.safeParse({ email: "ana" }).success).toBe(false);
  });
});

describe("novaSenhaSchema", () => {
  it("aceita senha de 10 caracteres confirmada", () => {
    expect(
      novaSenhaSchema.safeParse({ senha: "1234567890", confirmacao: "1234567890" }).success,
    ).toBe(true);
  });

  it("recusa senha curta e confirmação diferente", () => {
    expect(novaSenhaSchema.safeParse({ senha: "curta", confirmacao: "curta" }).success).toBe(false);
    expect(
      novaSenhaSchema.safeParse({ senha: "1234567890", confirmacao: "0987654321" }).success,
    ).toBe(false);
  });
});
