// Lista do que pode ser exportado em CSV, usada pela tela de Configurações e pela rota de
// download. Equivale a um arquivo de config (config/exportacoes.php) no Laravel.

export const EXPORTACOES = [
  {
    tabela: "empresa",
    titulo: "Empresa e enquadramento",
    descricao: "Os dados da empresa e o histórico de porte e anexo.",
  },
  {
    tabela: "notas",
    titulo: "Notas fiscais",
    descricao: "Todas as NFS-e importadas, com tomador, valor e situação.",
  },
  {
    tabela: "das",
    titulo: "Guias do DAS",
    descricao: "Competência, vencimento, valor e data de pagamento de cada guia.",
  },
  {
    tabela: "lancamentos",
    titulo: "Lançamentos",
    descricao: "Entradas e saídas importadas dos extratos ou digitadas.",
  },
] as const;

export type TabelaExportada = (typeof EXPORTACOES)[number]["tabela"];

export function tabelaExportada(valor: string): TabelaExportada | null {
  return EXPORTACOES.find((item) => item.tabela === valor)?.tabela ?? null;
}
