// cn(): junta classes do Tailwind e resolve conflitos (a última vence, ex.: "px-2 px-4" vira "px-4").
// Equivale ao helper @class do Blade, com a resolução de conflitos a mais.
import { createCn } from "cn/config";

// Os tamanhos de fonte do design system (app/globals.css) precisam ser declarados aqui.
// Sem isso, "text-label" seria confundido com uma cor e apagado por "text-ink".
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "hero",
            "page-title",
            "metric",
            "wordmark-lg",
            "wordmark",
            "section-title",
            "lead",
            "body",
            "label",
            "caption",
          ],
        },
      ],
    },
  },
});
