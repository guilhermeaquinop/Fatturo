// Página /configuracoes: dados da empresa, enquadramento, alertas, senha, exportação e conta.
// Equivale à rota GET /settings de um SettingsController com uma view Blade em seções.
// Não confundir com /configuracao (singular), a configuração inicial feita uma única vez.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { textLinkClassName } from "@/components/ui/text-link";
import { mascararCnpj } from "@/lib/cnpj";
import { formatarDataBr } from "@/lib/datas";
import { empresaAtual, type EnquadramentoDaEmpresa } from "@/lib/empresa";
import { ROTA_CONFIGURACAO, ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import { ROTULO_ANEXO, ROTULO_PORTE, ROTULO_REGIME } from "@/lib/validacao/empresa";
import {
  AlertasForm,
  EmpresaForm,
  EnquadramentoForm,
  ExcluirContaForm,
  InativarContaForm,
  SenhaForm,
} from "./configuracoes-forms";
import { EXPORTACOES } from "./exportar/tabelas";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return (
    <AppShell ativa="configuracoes">
      <div>
        <h1 className="text-page-title">Configurações</h1>
        <div className="text-ink-muted">Sua empresa, os alertas e a sua conta.</div>
      </div>
      {/* Tudo aqui depende do usuário logado, lido na requisição. */}
      <Suspense fallback={<div className="text-ink-muted">Carregando as configurações…</div>}>
        <Configuracoes />
      </Suspense>
    </AppShell>
  );
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <Card aria-label={titulo} className="w-full max-w-[720px]">
      <div>
        <CardTitle>{titulo}</CardTitle>
        <div className="text-ink-muted">{descricao}</div>
      </div>
      {children}
    </Card>
  );
}

function periodo(item: EnquadramentoDaEmpresa): string {
  const inicio = formatarDataBr(item.inicioEm);
  return item.fimEm ? `${inicio} a ${formatarDataBr(item.fimEm)}` : `Desde ${inicio}`;
}

async function Configuracoes() {
  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();
  const emailDeLogin = sessao?.claims?.email;
  if (typeof emailDeLogin !== "string") redirect(ROTA_LOGIN);

  const atual = empresa.enquadramento;
  // Do período mais recente para o mais antigo.
  const historico = [...empresa.enquadramentos].reverse();

  return (
    <>
      <Secao titulo="Empresa" descricao="O nome aparece no menu e nos e-mails de alerta.">
        <dl className="flex flex-wrap gap-x-12 gap-y-3">
          <div>
            <dt className="text-caption text-ink-muted">CNPJ</dt>
            <dd className="font-semibold tabular-nums">{mascararCnpj(empresa.cnpj)}</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-muted">Data de abertura</dt>
            <dd className="font-semibold tabular-nums">{formatarDataBr(empresa.dataAbertura)}</dd>
          </div>
        </dl>
        <EmpresaForm
          // A key recria o formulário quando os dados salvos mudam.
          key={`${empresa.nome}|${empresa.atividade}`}
          nome={empresa.nome}
          atividade={empresa.atividade}
        />
      </Secao>

      <Secao
        titulo="Enquadramento"
        descricao="O porte define o limite de faturamento do painel e o tipo de DAS de cada mês."
      >
        <ul className="flex flex-col">
          {historico.map((item) => (
            <li
              key={item.inicioEm}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-divider py-3 last:border-b-0"
            >
              <div>
                <div className="font-semibold">
                  {ROTULO_PORTE[item.porte]} · {ROTULO_REGIME[item.regime]}
                  {item.anexo ? ` · ${ROTULO_ANEXO[item.anexo]}` : ""}
                </div>
                <div className="text-caption text-ink-muted tabular-nums">{periodo(item)}</div>
              </div>
              {item.fimEm === null ? <Badge>Em vigor</Badge> : null}
            </li>
          ))}
        </ul>
        {/* Sem key: o formulário continua montado depois de salvar, para a mensagem de
            sucesso não sumir quando a lista acima é atualizada. */}
        <EnquadramentoForm
          porteAtual={atual.porte}
          anexoAtual={atual.anexo}
          podeDesfazer={historico.length > 1}
        />
      </Secao>

      <Secao
        titulo="Alertas"
        descricao="Os percentuais do limite de faturamento em que você quer ser avisado. A primeira faixa também muda a cor do indicador no painel."
      >
        <AlertasForm
          key={`${empresa.alertaFaixas.join(",")}|${empresa.alertaEmail}`}
          faixas={empresa.alertaFaixas}
          email={empresa.alertaEmail}
          emailDeLogin={emailDeLogin}
        />
      </Secao>

      <Secao titulo="Senha" descricao="Trocar a senha encerra as sessões abertas em outros aparelhos.">
        <SenhaForm />
      </Secao>

      <Secao
        titulo="Seus dados"
        descricao="Baixe tudo o que o Fatturo guarda sobre a sua empresa, em arquivos CSV que abrem no Excel."
      >
        <ul className="flex flex-col">
          {EXPORTACOES.map((item) => (
            <li
              key={item.tabela}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-divider py-3 last:border-b-0"
            >
              <div>
                <div className="font-semibold">{item.titulo}</div>
                <div className="text-caption text-ink-muted">{item.descricao}</div>
              </div>
              {/* <a> comum, e não <Link>: é um download, não uma página. */}
              <a
                href={`/configuracoes/exportar/${item.tabela}`}
                download
                className={`text-label ${textLinkClassName}`}
                aria-label={`Baixar ${item.titulo} em CSV`}
              >
                Baixar CSV
              </a>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao
        titulo="Inativar a conta"
        descricao="Pausa a conta sem apagar nada: o Fatturo fica bloqueado e nenhum alerta é enviado. Você reativa quando quiser, entrando com o seu e-mail e a sua senha."
      >
        <InativarContaForm />
      </Secao>

      <Secao
        titulo="Excluir a conta"
        descricao="Apaga a conta e todos os dados de forma definitiva. Se estiver em dúvida, prefira inativar."
      >
        <ExcluirContaForm />
      </Secao>
    </>
  );
}
