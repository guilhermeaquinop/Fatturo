// Testes do helper cn(). Equivalem a um teste unitário de helper no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("mantém tamanho de fonte e cor do design system juntos", () => {
    expect(cn("text-label text-ink")).toBe("text-label text-ink");
    expect(cn("font-semibold text-link", "text-label")).toBe("font-semibold text-link text-label");
  });

  it("deixa o último tamanho de fonte e a última cor vencerem", () => {
    expect(cn("text-body", "text-caption")).toBe("text-caption");
    expect(cn("text-ink", "text-ink-muted")).toBe("text-ink-muted");
  });

  it("ignora valores falsos", () => {
    expect(cn("px-5", false, undefined, null, "h-control-sm")).toBe("px-5 h-control-sm");
  });
});
