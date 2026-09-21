export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      almacenes_sedes: {
        Row: {
          actualizado_en: string | null
          ciudad: string | null
          codigo: string
          creado_en: string | null
          direccion: string | null
          es_activo: boolean | null
          id: string
          nombre: string
          pais: string | null
          tipo: string | null
        }
        Insert: {
          actualizado_en?: string | null
          ciudad?: string | null
          codigo: string
          creado_en?: string | null
          direccion?: string | null
          es_activo?: boolean | null
          id?: string
          nombre: string
          pais?: string | null
          tipo?: string | null
        }
        Update: {
          actualizado_en?: string | null
          ciudad?: string | null
          codigo?: string
          creado_en?: string | null
          direccion?: string | null
          es_activo?: boolean | null
          id?: string
          nombre?: string
          pais?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      boletas_shalom: {
        Row: {
          actualizado_en: string | null
          archivo_nombre_original: string | null
          cantidad: number | null
          codigo: string | null
          creado_en: string | null
          creado_por: string | null
          descripcion: string | null
          destinatario_dni: string | null
          destinatario_nombre: string
          destinatario_telefono: string | null
          destino: string
          estado_envio: string | null
          fecha_emision: string
          fecha_traslado: string | null
          forma_pago: string | null
          hora_emision: string | null
          id: string
          metadatos_ocr: Json | null
          moneda: string | null
          monto_total: number | null
          nro_orden: string | null
          observaciones: string | null
          origen: string | null
          pdf_url: string
          peso: number | null
          r2_key: string
          remitente_dni: string | null
          remitente_nombre: string | null
          remitente_telefono: string | null
          tipo_entrega: string | null
          unidad_medida: string | null
        }
        Insert: {
          actualizado_en?: string | null
          archivo_nombre_original?: string | null
          cantidad?: number | null
          codigo?: string | null
          creado_en?: string | null
          creado_por?: string | null
          descripcion?: string | null
          destinatario_dni?: string | null
          destinatario_nombre: string
          destinatario_telefono?: string | null
          destino: string
          estado_envio?: string | null
          fecha_emision: string
          fecha_traslado?: string | null
          forma_pago?: string | null
          hora_emision?: string | null
          id?: string
          metadatos_ocr?: Json | null
          moneda?: string | null
          monto_total?: number | null
          nro_orden?: string | null
          observaciones?: string | null
          origen?: string | null
          pdf_url: string
          peso?: number | null
          r2_key: string
          remitente_dni?: string | null
          remitente_nombre?: string | null
          remitente_telefono?: string | null
          tipo_entrega?: string | null
          unidad_medida?: string | null
        }
        Update: {
          actualizado_en?: string | null
          archivo_nombre_original?: string | null
          cantidad?: number | null
          codigo?: string | null
          creado_en?: string | null
          creado_por?: string | null
          descripcion?: string | null
          destinatario_dni?: string | null
          destinatario_nombre?: string
          destinatario_telefono?: string | null
          destino?: string
          estado_envio?: string | null
          fecha_emision?: string
          fecha_traslado?: string | null
          forma_pago?: string | null
          hora_emision?: string | null
          id?: string
          metadatos_ocr?: Json | null
          moneda?: string | null
          monto_total?: number | null
          nro_orden?: string | null
          observaciones?: string | null
          origen?: string | null
          pdf_url?: string
          peso?: number | null
          r2_key?: string
          remitente_dni?: string | null
          remitente_nombre?: string | null
          remitente_telefono?: string | null
          tipo_entrega?: string | null
          unidad_medida?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          actualizado_en: string | null
          apellido: string | null
          creado_en: string | null
          departamento: string | null
          direccion_entrega: string | null
          distrito: string | null
          documento_identidad: string
          email: string | null
          id: string
          nombre: string
          provincia: string | null
          telefono: string | null
        }
        Insert: {
          actualizado_en?: string | null
          apellido?: string | null
          creado_en?: string | null
          departamento?: string | null
          direccion_entrega?: string | null
          distrito?: string | null
          documento_identidad: string
          email?: string | null
          id?: string
          nombre: string
          provincia?: string | null
          telefono?: string | null
        }
        Update: {
          actualizado_en?: string | null
          apellido?: string | null
          creado_en?: string | null
          departamento?: string | null
          direccion_entrega?: string | null
          distrito?: string | null
          documento_identidad?: string
          email?: string | null
          id?: string
          nombre?: string
          provincia?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      cobros_vouchers: {
        Row: {
          cliente_id: string | null
          cliente_nombre: string
          cliente_telefono: string | null
          codigo_cobro: string
          creado_en: string
          estado: string
          fecha_operacion: string | null
          id: string
          metodo_pago: string
          moneda: string
          monto: number
          notas: string | null
          numero_operacion: string | null
          paquetes_wrs: Json
          registrado_por: string
          validado_en: string | null
          validado_por: string | null
          voucher_key: string | null
          voucher_url: string
        }
        Insert: {
          cliente_id?: string | null
          cliente_nombre: string
          cliente_telefono?: string | null
          codigo_cobro: string
          creado_en?: string
          estado?: string
          fecha_operacion?: string | null
          id?: string
          metodo_pago?: string
          moneda?: string
          monto?: number
          notas?: string | null
          numero_operacion?: string | null
          paquetes_wrs?: Json
          registrado_por?: string
          validado_en?: string | null
          validado_por?: string | null
          voucher_key?: string | null
          voucher_url: string
        }
        Update: {
          cliente_id?: string | null
          cliente_nombre?: string
          cliente_telefono?: string | null
          codigo_cobro?: string
          creado_en?: string
          estado?: string
          fecha_operacion?: string | null
          id?: string
          metodo_pago?: string
          moneda?: string
          monto?: number
          notas?: string | null
          numero_operacion?: string | null
          paquetes_wrs?: Json
          registrado_por?: string
          validado_en?: string | null
          validado_por?: string | null
          voucher_key?: string | null
          voucher_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobros_vouchers_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas_ordenes: {
        Row: {
          cliente_documento: string | null
          cliente_id: string | null
          cliente_nombre: string
          codigo_entrega: string
          creado_en: string
          creado_por: string
          entregado_en: string | null
          estado: string
          fotos_evidencia: Json
          id: string
          notas: string | null
          operador_asignado: string
          paquetes_data: Json
          receptor_documento: string | null
          receptor_nombre: string | null
          receptor_parentesco: string | null
          tipo_entrega: string
          total_paquetes: number
        }
        Insert: {
          cliente_documento?: string | null
          cliente_id?: string | null
          cliente_nombre: string
          codigo_entrega: string
          creado_en?: string
          creado_por?: string
          entregado_en?: string | null
          estado?: string
          fotos_evidencia?: Json
          id?: string
          notas?: string | null
          operador_asignado?: string
          paquetes_data?: Json
          receptor_documento?: string | null
          receptor_nombre?: string | null
          receptor_parentesco?: string | null
          tipo_entrega?: string
          total_paquetes?: number
        }
        Update: {
          cliente_documento?: string | null
          cliente_id?: string | null
          cliente_nombre?: string
          codigo_entrega?: string
          creado_en?: string
          creado_por?: string
          entregado_en?: string | null
          estado?: string
          fotos_evidencia?: Json
          id?: string
          notas?: string | null
          operador_asignado?: string
          paquetes_data?: Json
          receptor_documento?: string | null
          receptor_nombre?: string | null
          receptor_parentesco?: string | null
          tipo_entrega?: string
          total_paquetes?: number
        }
        Relationships: [
          {
            foreignKeyName: "entregas_ordenes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      escaneos_log: {
        Row: {
          codigo: string
          creado_en: string | null
          formato: string | null
          id: string
          modo_workflow: string | null
          operador: string | null
          paquete_id: string | null
          ubicacion: string | null
        }
        Insert: {
          codigo: string
          creado_en?: string | null
          formato?: string | null
          id?: string
          modo_workflow?: string | null
          operador?: string | null
          paquete_id?: string | null
          ubicacion?: string | null
        }
        Update: {
          codigo?: string
          creado_en?: string | null
          formato?: string | null
          id?: string
          modo_workflow?: string | null
          operador?: string | null
          paquete_id?: string | null
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escaneos_log_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "paquetes"
            referencedColumns: ["id"]
          },
        ]
      }
      estanterias_posiciones: {
        Row: {
          actualizado_en: string | null
          almacen_id: string | null
          capacidad_max_paquetes: number | null
          codigo_estante: string
          codigo_posicion: string
          creado_en: string | null
          descripcion: string | null
          id: string
          nivel_piso: string
          peso_max_kg: number | null
          zona_tipo: string | null
        }
        Insert: {
          actualizado_en?: string | null
          almacen_id?: string | null
          capacidad_max_paquetes?: number | null
          codigo_estante: string
          codigo_posicion: string
          creado_en?: string | null
          descripcion?: string | null
          id?: string
          nivel_piso: string
          peso_max_kg?: number | null
          zona_tipo?: string | null
        }
        Update: {
          actualizado_en?: string | null
          almacen_id?: string | null
          capacidad_max_paquetes?: number | null
          codigo_estante?: string
          codigo_posicion?: string
          creado_en?: string | null
          descripcion?: string | null
          id?: string
          nivel_piso?: string
          peso_max_kg?: number | null
          zona_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estanterias_posiciones_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes_sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_trazabilidad: {
        Row: {
          descripcion_evento: string
          fecha_hora: string | null
          id: string
          paquete_id: string | null
          ubicacion: string
          usuario_operador: string | null
        }
        Insert: {
          descripcion_evento: string
          fecha_hora?: string | null
          id?: string
          paquete_id?: string | null
          ubicacion: string
          usuario_operador?: string | null
        }
        Update: {
          descripcion_evento?: string
          fecha_hora?: string | null
          id?: string
          paquete_id?: string | null
          ubicacion?: string
          usuario_operador?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_trazabilidad_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "paquetes"
            referencedColumns: ["id"]
          },
        ]
      }
      hojas_cotejo: {
        Row: {
          actualizado_en: string | null
          creado_en: string | null
          creado_por: string | null
          descripcion: string | null
          escaneados_count: number | null
          estado: string | null
          id: string
          libro_id: string | null
          no_listados_count: number | null
          nombre_hoja: string | null
          tipo_proceso: string | null
          titulo: string
          total_items: number | null
        }
        Insert: {
          actualizado_en?: string | null
          creado_en?: string | null
          creado_por?: string | null
          descripcion?: string | null
          escaneados_count?: number | null
          estado?: string | null
          id?: string
          libro_id?: string | null
          no_listados_count?: number | null
          nombre_hoja?: string | null
          tipo_proceso?: string | null
          titulo: string
          total_items?: number | null
        }
        Update: {
          actualizado_en?: string | null
          creado_en?: string | null
          creado_por?: string | null
          descripcion?: string | null
          escaneados_count?: number | null
          estado?: string | null
          id?: string
          libro_id?: string | null
          no_listados_count?: number | null
          nombre_hoja?: string | null
          tipo_proceso?: string | null
          titulo?: string
          total_items?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hojas_cotejo_libro_id_fkey"
            columns: ["libro_id"]
            isOneToOne: false
            referencedRelation: "hojas_cotejo"
            referencedColumns: ["id"]
          },
        ]
      }
      hojas_cotejo_items: {
        Row: {
          actualizado_en: string | null
          casillero: string | null
          codigo_wr: string
          consignatario: string | null
          creado_en: string | null
          escaneado_en: string | null
          escaneado_por: string | null
          estado: string | null
          hoja_id: string | null
          id: string
          notas: string | null
          orden: number | null
          peso_kg: number | null
          posicion_estante: string | null
          tracking_usa: string | null
          veces_escaneado: number | null
        }
        Insert: {
          actualizado_en?: string | null
          casillero?: string | null
          codigo_wr: string
          consignatario?: string | null
          creado_en?: string | null
          escaneado_en?: string | null
          escaneado_por?: string | null
          estado?: string | null
          hoja_id?: string | null
          id?: string
          notas?: string | null
          orden?: number | null
          peso_kg?: number | null
          posicion_estante?: string | null
          tracking_usa?: string | null
          veces_escaneado?: number | null
        }
        Update: {
          actualizado_en?: string | null
          casillero?: string | null
          codigo_wr?: string
          consignatario?: string | null
          creado_en?: string | null
          escaneado_en?: string | null
          escaneado_por?: string | null
          estado?: string | null
          hoja_id?: string | null
          id?: string
          notas?: string | null
          orden?: number | null
          peso_kg?: number | null
          posicion_estante?: string | null
          tracking_usa?: string | null
          veces_escaneado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hojas_cotejo_items_hoja_id_fkey"
            columns: ["hoja_id"]
            isOneToOne: false
            referencedRelation: "hojas_cotejo"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_kardex: {
        Row: {
          codigo_paquete: string
          consignatario: string | null
          creado_en: string | null
          destino_descripcion: string
          id: string
          motivo: string | null
          origen_descripcion: string
          paquete_id: string | null
          tipo_movimiento: string
          usuario_operador: string | null
        }
        Insert: {
          codigo_paquete: string
          consignatario?: string | null
          creado_en?: string | null
          destino_descripcion: string
          id?: string
          motivo?: string | null
          origen_descripcion: string
          paquete_id?: string | null
          tipo_movimiento: string
          usuario_operador?: string | null
        }
        Update: {
          codigo_paquete?: string
          consignatario?: string | null
          creado_en?: string | null
          destino_descripcion?: string
          id?: string
          motivo?: string | null
          origen_descripcion?: string
          paquete_id?: string | null
          tipo_movimiento?: string
          usuario_operador?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_kardex_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "paquetes"
            referencedColumns: ["id"]
          },
        ]
      }
      paquetes: {
        Row: {
          actualizado_en: string | null
          anaquel: string | null
          cliente_id: string | null
          codigo_casillero: string | null
          creado_en: string | null
          descripcion: string | null
          dni_consignatario: string | null
          estado_entrega: string | null
          factura_pdf_url: string | null
          id: string
          metodo_entrega: string | null
          nombre_consignatario: string | null
          numero_factura: string | null
          numero_recibo_bodega: string
          peso_kg: number | null
          piso: string | null
          posicion_estante: string | null
          tipo_empaque: string | null
          tracking_usa: string
          ubicacion_actual: string | null
          valor_declarado_usd: number | null
        }
        Insert: {
          actualizado_en?: string | null
          anaquel?: string | null
          cliente_id?: string | null
          codigo_casillero?: string | null
          creado_en?: string | null
          descripcion?: string | null
          dni_consignatario?: string | null
          estado_entrega?: string | null
          factura_pdf_url?: string | null
          id?: string
          metodo_entrega?: string | null
          nombre_consignatario?: string | null
          numero_factura?: string | null
          numero_recibo_bodega: string
          peso_kg?: number | null
          piso?: string | null
          posicion_estante?: string | null
          tipo_empaque?: string | null
          tracking_usa: string
          ubicacion_actual?: string | null
          valor_declarado_usd?: number | null
        }
        Update: {
          actualizado_en?: string | null
          anaquel?: string | null
          cliente_id?: string | null
          codigo_casillero?: string | null
          creado_en?: string | null
          descripcion?: string | null
          dni_consignatario?: string | null
          estado_entrega?: string | null
          factura_pdf_url?: string | null
          id?: string
          metodo_entrega?: string | null
          nombre_consignatario?: string | null
          numero_factura?: string | null
          numero_recibo_bodega?: string
          peso_kg?: number | null
          piso?: string | null
          posicion_estante?: string | null
          tipo_empaque?: string | null
          tracking_usa?: string
          ubicacion_actual?: string | null
          valor_declarado_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paquetes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
