
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "arquivo_importado": {
                  Row: {
                    "duplicados": number,"empresa_id": string,"erros": number,"hash_sha256": string,"id": string,"importado_em": string,"lidos": number,"nome": string,"novos": number,"tipo": Database["public"]['Enums']["tipo_arquivo"]
                  }
                  ComputedFields: never
                  Insert: {
                    "duplicados"?: number,"empresa_id": string,"erros"?: number,"hash_sha256": string,"id"?: string,"importado_em"?: string,"lidos"?: number,"nome": string,"novos"?: number,"tipo": Database["public"]['Enums']["tipo_arquivo"]
                  }
                  Update: {
                    "duplicados"?: number,"empresa_id"?: string,"erros"?: number,"hash_sha256"?: string,"id"?: string,"importado_em"?: string,"lidos"?: number,"nome"?: string,"novos"?: number,"tipo"?: Database["public"]['Enums']["tipo_arquivo"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "arquivo_importado_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresa"
      referencedColumns: ["id"]
    }
                  ]
                },"empresa": {
                  Row: {
                    "atividade": Database["public"]['Enums']["atividade"],"cnpj": string,"criado_em": string,"data_abertura": string,"id": string,"nome": string,"usuario_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "atividade": Database["public"]['Enums']["atividade"],"cnpj": string,"criado_em"?: string,"data_abertura": string,"id"?: string,"nome": string,"usuario_id": string
                  }
                  Update: {
                    "atividade"?: Database["public"]['Enums']["atividade"],"cnpj"?: string,"criado_em"?: string,"data_abertura"?: string,"id"?: string,"nome"?: string,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "empresa_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: true
      referencedRelation: "usuario"
      referencedColumns: ["id"]
    }
                  ]
                },"enquadramento": {
                  Row: {
                    "anexo": Database["public"]['Enums']["anexo_simples"] | null,"criado_em": string,"empresa_id": string,"fim_em": string | null,"id": string,"inicio_em": string,"porte": Database["public"]['Enums']["porte"],"regime": Database["public"]['Enums']["regime"]
                  }
                  ComputedFields: never
                  Insert: {
                    "anexo"?: Database["public"]['Enums']["anexo_simples"] | null,"criado_em"?: string,"empresa_id": string,"fim_em"?: string | null,"id"?: string,"inicio_em": string,"porte": Database["public"]['Enums']["porte"],"regime": Database["public"]['Enums']["regime"]
                  }
                  Update: {
                    "anexo"?: Database["public"]['Enums']["anexo_simples"] | null,"criado_em"?: string,"empresa_id"?: string,"fim_em"?: string | null,"id"?: string,"inicio_em"?: string,"porte"?: Database["public"]['Enums']["porte"],"regime"?: Database["public"]['Enums']["regime"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquadramento_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresa"
      referencedColumns: ["id"]
    }
                  ]
                },"lancamento": {
                  Row: {
                    "arquivo_id": string | null,"categoria": Database["public"]['Enums']["categoria_lancamento"] | null,"contraparte_doc": string | null,"contraparte_nome": string | null,"criado_em": string,"data": string,"descricao": string,"empresa_id": string,"id": string,"id_externo": string | null,"origem": Database["public"]['Enums']["origem_lancamento"],"sentido": Database["public"]['Enums']["sentido_lancamento"],"valor_centavos": number
                  }
                  ComputedFields: never
                  Insert: {
                    "arquivo_id"?: string | null,"categoria"?: Database["public"]['Enums']["categoria_lancamento"] | null,"contraparte_doc"?: string | null,"contraparte_nome"?: string | null,"criado_em"?: string,"data": string,"descricao": string,"empresa_id": string,"id"?: string,"id_externo"?: string | null,"origem": Database["public"]['Enums']["origem_lancamento"],"sentido": Database["public"]['Enums']["sentido_lancamento"],"valor_centavos": number
                  }
                  Update: {
                    "arquivo_id"?: string | null,"categoria"?: Database["public"]['Enums']["categoria_lancamento"] | null,"contraparte_doc"?: string | null,"contraparte_nome"?: string | null,"criado_em"?: string,"data"?: string,"descricao"?: string,"empresa_id"?: string,"id"?: string,"id_externo"?: string | null,"origem"?: Database["public"]['Enums']["origem_lancamento"],"sentido"?: Database["public"]['Enums']["sentido_lancamento"],"valor_centavos"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lancamento_arquivo_id_fkey"
      columns: ["arquivo_id"]
isOneToOne: false
      referencedRelation: "arquivo_importado"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamento_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresa"
      referencedColumns: ["id"]
    }
                  ]
                },"mapeamento_csv": {
                  Row: {
                    "assinatura": string,"coluna_credito": number | null,"coluna_data": number,"coluna_debito": number | null,"coluna_descricao": number,"coluna_valor": number | null,"criado_em": string,"empresa_id": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assinatura": string,"coluna_credito"?: number | null,"coluna_data": number,"coluna_debito"?: number | null,"coluna_descricao": number,"coluna_valor"?: number | null,"criado_em"?: string,"empresa_id": string,"id"?: string
                  }
                  Update: {
                    "assinatura"?: string,"coluna_credito"?: number | null,"coluna_data"?: number,"coluna_debito"?: number | null,"coluna_descricao"?: number,"coluna_valor"?: number | null,"criado_em"?: string,"empresa_id"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mapeamento_csv_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresa"
      referencedColumns: ["id"]
    }
                  ]
                },"nota_fiscal": {
                  Row: {
                    "arquivo_id": string | null,"chave_acesso": string,"criado_em": string,"data_competencia": string,"data_emissao": string,"empresa_id": string,"id": string,"numero": string,"situacao": Database["public"]['Enums']["situacao_nota"],"tomador_doc": string | null,"tomador_nome": string | null,"valor_centavos": number
                  }
                  ComputedFields: never
                  Insert: {
                    "arquivo_id"?: string | null,"chave_acesso": string,"criado_em"?: string,"data_competencia": string,"data_emissao": string,"empresa_id": string,"id"?: string,"numero": string,"situacao"?: Database["public"]['Enums']["situacao_nota"],"tomador_doc"?: string | null,"tomador_nome"?: string | null,"valor_centavos": number
                  }
                  Update: {
                    "arquivo_id"?: string | null,"chave_acesso"?: string,"criado_em"?: string,"data_competencia"?: string,"data_emissao"?: string,"empresa_id"?: string,"id"?: string,"numero"?: string,"situacao"?: Database["public"]['Enums']["situacao_nota"],"tomador_doc"?: string | null,"tomador_nome"?: string | null,"valor_centavos"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "nota_fiscal_arquivo_id_fkey"
      columns: ["arquivo_id"]
isOneToOne: false
      referencedRelation: "arquivo_importado"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "nota_fiscal_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresa"
      referencedColumns: ["id"]
    }
                  ]
                },"parametro": {
                  Row: {
                    "a_confirmar": boolean,"chave": string,"descricao": string,"id": number,"valor": number,"vigencia_fim": string | null,"vigencia_inicio": string
                  }
                  ComputedFields: never
                  Insert: {
                    "a_confirmar"?: boolean,"chave": string,"descricao": string,"id"?: never,"valor": number,"vigencia_fim"?: string | null,"vigencia_inicio": string
                  }
                  Update: {
                    "a_confirmar"?: boolean,"chave"?: string,"descricao"?: string,"id"?: never,"valor"?: number,"vigencia_fim"?: string | null,"vigencia_inicio"?: string
                  }
                  Relationships: [
                    
                  ]
                },"usuario": {
                  Row: {
                    "criado_em": string,"id": string,"nome": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"id": string,"nome": string
                  }
                  Update: {
                    "criado_em"?: string,"id"?: string,"nome"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "configurar_empresa":
{ Args: { "p_anexo"?: Database["public"]['Enums']["anexo_simples"],"p_atividade": Database["public"]['Enums']["atividade"],"p_cnpj": string,"p_data_abertura": string,"p_nome": string,"p_porte": Database["public"]['Enums']["porte"],"p_regime": Database["public"]['Enums']["regime"] }; Returns: string
                           },
"importar_extrato":
{ Args: { "p_erros"?: number,"p_hash": string,"p_lancamentos": Json,"p_nome": string,"p_tipo": Database["public"]['Enums']["tipo_arquivo"] }; Returns: Json
                           },
"importar_nfse":
{ Args: { "p_cancelamentos": Json,"p_erros"?: number,"p_hash": string,"p_nome": string,"p_notas": Json }; Returns: Json
                           }
          }
          Enums: {
            "anexo_simples": "I"|"II"|"III"|"IV"|"V"|"nao_sei","atividade": "comercio"|"servico"|"ambos","categoria_lancamento": "receita"|"despesa"|"pessoal"|"transferencia"|"imposto","origem_lancamento": "arquivo"|"manual","porte": "MEI"|"ME","regime": "SIMPLES","sentido_lancamento": "entrada"|"saida","situacao_nota": "emitida"|"cancelada","tipo_arquivo": "XML_NFSE"|"OFX"|"CSV"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "anexo_simples": ["I", "II", "III", "IV", "V", "nao_sei"],"atividade": ["comercio", "servico", "ambos"],"categoria_lancamento": ["receita", "despesa", "pessoal", "transferencia", "imposto"],"origem_lancamento": ["arquivo", "manual"],"porte": ["MEI", "ME"],"regime": ["SIMPLES"],"sentido_lancamento": ["entrada", "saida"],"situacao_nota": ["emitida", "cancelada"],"tipo_arquivo": ["XML_NFSE", "OFX", "CSV"]
          }
        }
} as const
