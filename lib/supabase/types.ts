export type Role = 'PROPRIETAIRE' | 'AGENT'
export type TypeTransaction = 'RETRAIT' | 'DEPOT'
export type TypeNotification = 'UV_FAIBLE' | 'INFO' | 'ALERTE'

export interface Database {
  public: {
    Tables: {
      profils: {
        Row: {
          id: string
          nom_complet: string
          telephone: string | null
          role: Role
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nom_complet: string
          telephone?: string | null
          role?: Role
          created_at?: string
          updated_at?: string
        }
        Update: {
          nom_complet?: string
          telephone?: string | null
          role?: Role
          updated_at?: string
        }
      }
      reseaux: {
        Row: {
          id: string
          nom: string
          couleur: string
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          couleur: string
          created_at?: string
        }
        Update: {
          nom?: string
          couleur?: string
        }
      }
      points_de_vente: {
        Row: {
          id: string
          nom: string
          adresse: string | null
          telephone: string | null
          proprietaire_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom: string
          adresse?: string | null
          telephone?: string | null
          proprietaire_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          nom?: string
          adresse?: string | null
          telephone?: string | null
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string | null
          nom_complet: string
          telephone: string | null
          email: string | null
          point_de_vente_id: string
          actif: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nom_complet: string
          telephone?: string | null
          email?: string | null
          point_de_vente_id: string
          actif?: boolean
          created_at?: string
        }
        Update: {
          nom_complet?: string
          telephone?: string | null
          email?: string | null
          actif?: boolean
        }
      }
      uv: {
        Row: {
          id: string
          point_de_vente_id: string
          reseau_id: string
          montant: number
          seuil_alerte: number
          updated_at: string
        }
        Insert: {
          id?: string
          point_de_vente_id: string
          reseau_id: string
          montant?: number
          seuil_alerte?: number
          updated_at?: string
        }
        Update: {
          montant?: number
          seuil_alerte?: number
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          type: TypeTransaction
          montant: number
          reseau_id: string
          point_de_vente_id: string
          agent_id: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: TypeTransaction
          montant: number
          reseau_id: string
          point_de_vente_id: string
          agent_id?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          note?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          destinataire_id: string
          expediteur_id: string | null
          message: string
          type: TypeNotification
          lu: boolean
          point_de_vente_id: string | null
          reseau_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          destinataire_id: string
          expediteur_id?: string | null
          message: string
          type?: TypeNotification
          lu?: boolean
          point_de_vente_id?: string | null
          reseau_id?: string | null
          created_at?: string
        }
        Update: {
          lu?: boolean
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      role: Role
      type_transaction: TypeTransaction
      type_notification: TypeNotification
    }
  }
}

// Convenience types
export type Profil = Database['public']['Tables']['profils']['Row']
export type Reseau = Database['public']['Tables']['reseaux']['Row']
export type PointDeVente = Database['public']['Tables']['points_de_vente']['Row']
export type Agent = Database['public']['Tables']['agents']['Row']
export type UV = Database['public']['Tables']['uv']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
