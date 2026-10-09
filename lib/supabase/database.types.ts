
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "empresa": {
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
                           }
          }
          Enums: {
            "anexo_simples": "I"|"II"|"III"|"IV"|"V"|"nao_sei","atividade": "comercio"|"servico"|"ambos","porte": "MEI"|"ME","regime": "SIMPLES"
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
            "anexo_simples": ["I", "II", "III", "IV", "V", "nao_sei"],"atividade": ["comercio", "servico", "ambos"],"porte": ["MEI", "ME"],"regime": ["SIMPLES"]
          }
        }
} as const
