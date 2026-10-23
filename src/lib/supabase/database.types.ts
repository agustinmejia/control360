
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "branches": {
                  Row: {
                    "address": string | null,"city": string | null,"created_at": string | null,"created_by": string | null,"deactivated_at": string | null,"deactivated_by": string | null,"deactivation_reason": string | null,"id": string,"is_active": boolean,"name": string,"phone": string | null,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"city"?: string | null,"created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivated_by"?: string | null,"deactivation_reason"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"phone"?: string | null,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"city"?: string | null,"created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivated_by"?: string | null,"deactivation_reason"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"phone"?: string | null,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"company_settings": {
                  Row: {
                    "address": string | null,"backdate_limit_days": number,"created_at": string | null,"created_by": string | null,"currency": string,"id": boolean,"legal_name": string | null,"name": string,"phone": string | null,"tax_id": string | null,"timezone": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"backdate_limit_days"?: number,"created_at"?: string | null,"created_by"?: string | null,"currency"?: string,"id"?: boolean,"legal_name"?: string | null,"name"?: string,"phone"?: string | null,"tax_id"?: string | null,"timezone"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"backdate_limit_days"?: number,"created_at"?: string | null,"created_by"?: string | null,"currency"?: string,"id"?: boolean,"legal_name"?: string | null,"name"?: string,"phone"?: string | null,"tax_id"?: string | null,"timezone"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"inventories": {
                  Row: {
                    "branch_id": string,"created_at": string | null,"created_by": string | null,"deactivated_at": string | null,"deactivation_reason": string | null,"description": string | null,"id": string,"is_active": boolean,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "branch_id": string,"created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivation_reason"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "branch_id"?: string,"created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivation_reason"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventories_branch_id_fkey"
      columns: ["branch_id"]
isOneToOne: false
      referencedRelation: "branches"
      referencedColumns: ["id"]
    }
                  ]
                },"inventory_documents": {
                  Row: {
                    "client_request_id": string | null,"conversion_loss_base": number | null,"created_at": string,"created_by": string | null,"document_date": string,"document_type": Database["public"]['Enums']["inv_document_type"],"id": string,"inventory_id": string,"notes": string | null,"number": number,"reason_id": string | null,"reverses_document_id": string | null,"source_id": string | null,"source_type": string | null,"status": string,"target_inventory_id": string | null,"void_reason": string | null,"voided_at": string | null,"voided_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_request_id"?: string | null,"conversion_loss_base"?: number | null,"created_at"?: string,"created_by"?: string | null,"document_date": string,"document_type": Database["public"]['Enums']["inv_document_type"],"id"?: string,"inventory_id": string,"notes"?: string | null,"number": number,"reason_id"?: string | null,"reverses_document_id"?: string | null,"source_id"?: string | null,"source_type"?: string | null,"status"?: string,"target_inventory_id"?: string | null,"void_reason"?: string | null,"voided_at"?: string | null,"voided_by"?: string | null
                  }
                  Update: {
                    "client_request_id"?: string | null,"conversion_loss_base"?: number | null,"created_at"?: string,"created_by"?: string | null,"document_date"?: string,"document_type"?: Database["public"]['Enums']["inv_document_type"],"id"?: string,"inventory_id"?: string,"notes"?: string | null,"number"?: number,"reason_id"?: string | null,"reverses_document_id"?: string | null,"source_id"?: string | null,"source_type"?: string | null,"status"?: string,"target_inventory_id"?: string | null,"void_reason"?: string | null,"voided_at"?: string | null,"voided_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_documents_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_documents_reason_id_fkey"
      columns: ["reason_id"]
isOneToOne: false
      referencedRelation: "movement_reasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_documents_reverses_document_id_fkey"
      columns: ["reverses_document_id"]
isOneToOne: true
      referencedRelation: "inventory_documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_documents_reverses_document_id_fkey"
      columns: ["reverses_document_id"]
isOneToOne: true
      referencedRelation: "v_inventory_documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_documents_reverses_document_id_fkey"
      columns: ["reverses_document_id"]
isOneToOne: true
      referencedRelation: "v_kardex"
      referencedColumns: ["document_id"]
    },{
      foreignKeyName: "inventory_documents_target_inventory_id_fkey"
      columns: ["target_inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    }
                  ]
                },"inventory_movements": {
                  Row: {
                    "created_at": string,"created_by": string | null,"direction": number,"document_id": string,"id": number,"inventory_id": string,"movement_date": string,"quantity": number,"reverses_movement_id": number | null,"unit_cost": number | null,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"direction": number,"document_id": string,"id"?: never,"inventory_id": string,"movement_date": string,"quantity": number,"reverses_movement_id"?: number | null,"unit_cost"?: number | null,"variant_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"direction"?: number,"document_id"?: string,"id"?: never,"inventory_id"?: string,"movement_date"?: string,"quantity"?: number,"reverses_movement_id"?: number | null,"unit_cost"?: number | null,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_movements_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "inventory_documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "v_inventory_documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "v_kardex"
      referencedColumns: ["document_id"]
    },{
      foreignKeyName: "inventory_movements_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_reverses_movement_id_fkey"
      columns: ["reverses_movement_id"]
isOneToOne: true
      referencedRelation: "inventory_movements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_reverses_movement_id_fkey"
      columns: ["reverses_movement_id"]
isOneToOne: true
      referencedRelation: "v_kardex"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["variant_id"]
    },{
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_stock"
      referencedColumns: ["variant_id"]
    }
                  ]
                },"inventory_prices": {
                  Row: {
                    "created_at": string | null,"created_by": string | null,"id": string,"inventory_id": string,"price": number | null,"updated_at": string | null,"updated_by": string | null,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"created_by"?: string | null,"id"?: string,"inventory_id": string,"price"?: number | null,"updated_at"?: string | null,"updated_by"?: string | null,"variant_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"created_by"?: string | null,"id"?: string,"inventory_id"?: string,"price"?: number | null,"updated_at"?: string | null,"updated_by"?: string | null,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_prices_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_prices_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_prices_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["variant_id"]
    },{
      foreignKeyName: "inventory_prices_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_stock"
      referencedColumns: ["variant_id"]
    }
                  ]
                },"movement_reasons": {
                  Row: {
                    "code": string,"created_at": string | null,"created_by": string | null,"document_type": Database["public"]['Enums']["inv_document_type"],"id": string,"is_active": boolean,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string | null,"created_by"?: string | null,"document_type": Database["public"]['Enums']["inv_document_type"],"id"?: string,"is_active"?: boolean,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "code"?: string,"created_at"?: string | null,"created_by"?: string | null,"document_type"?: Database["public"]['Enums']["inv_document_type"],"id"?: string,"is_active"?: boolean,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"price_changes": {
                  Row: {
                    "changed_at": string,"changed_by": string | null,"id": number,"inventory_id": string | null,"new_price": number | null,"old_price": number | null,"reason": string | null,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_at"?: string,"changed_by"?: string | null,"id"?: never,"inventory_id"?: string | null,"new_price"?: number | null,"old_price"?: number | null,"reason"?: string | null,"variant_id": string
                  }
                  Update: {
                    "changed_at"?: string,"changed_by"?: string | null,"id"?: never,"inventory_id"?: string | null,"new_price"?: number | null,"old_price"?: number | null,"reason"?: string | null,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "price_changes_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "price_changes_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "price_changes_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["variant_id"]
    },{
      foreignKeyName: "price_changes_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_stock"
      referencedColumns: ["variant_id"]
    }
                  ]
                },"product_categories": {
                  Row: {
                    "created_at": string | null,"created_by": string | null,"id": string,"is_active": boolean,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"created_by"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"created_by"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"product_variants": {
                  Row: {
                    "base_price": number,"created_at": string | null,"created_by": string | null,"deactivated_at": string | null,"deactivation_reason": string | null,"factor": number,"id": string,"is_active": boolean,"is_default": boolean,"min_stock": number,"name": string,"product_id": string,"sku": string | null,"unit_id": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "base_price"?: number,"created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivation_reason"?: string | null,"factor": number,"id"?: string,"is_active"?: boolean,"is_default"?: boolean,"min_stock"?: number,"name": string,"product_id": string,"sku"?: string | null,"unit_id": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "base_price"?: number,"created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivation_reason"?: string | null,"factor"?: number,"id"?: string,"is_active"?: boolean,"is_default"?: boolean,"min_stock"?: number,"name"?: string,"product_id"?: string,"sku"?: string | null,"unit_id"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["product_id"]
    },{
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "v_stock"
      referencedColumns: ["product_id"]
    },{
      foreignKeyName: "product_variants_unit_id_fkey"
      columns: ["unit_id"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_variants_unit_id_fkey"
      columns: ["unit_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["base_unit_id"]
    },{
      foreignKeyName: "product_variants_unit_id_fkey"
      columns: ["unit_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["unit_id"]
    }
                  ]
                },"products": {
                  Row: {
                    "base_unit_id": string,"category_id": string | null,"created_at": string | null,"created_by": string | null,"deactivated_at": string | null,"deactivation_reason": string | null,"description": string | null,"id": string,"is_active": boolean,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "base_unit_id": string,"category_id"?: string | null,"created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivation_reason"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "base_unit_id"?: string,"category_id"?: string | null,"created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivation_reason"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_base_unit_id_fkey"
      columns: ["base_unit_id"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_base_unit_id_fkey"
      columns: ["base_unit_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["base_unit_id"]
    },{
      foreignKeyName: "products_base_unit_id_fkey"
      columns: ["base_unit_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["unit_id"]
    },{
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "product_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["category_id"]
    },{
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "v_stock"
      referencedColumns: ["category_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string | null,"created_by": string | null,"deactivated_at": string | null,"deactivated_by": string | null,"deactivation_reason": string | null,"email": string,"full_name": string,"id": string,"is_active": boolean,"phone": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivated_by"?: string | null,"deactivation_reason"?: string | null,"email": string,"full_name"?: string,"id": string,"is_active"?: boolean,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"created_by"?: string | null,"deactivated_at"?: string | null,"deactivated_by"?: string | null,"deactivation_reason"?: string | null,"email"?: string,"full_name"?: string,"id"?: string,"is_active"?: boolean,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"stock_balances": {
                  Row: {
                    "inventory_id": string,"last_unit_cost": number | null,"quantity": number,"updated_at": string,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "inventory_id": string,"last_unit_cost"?: number | null,"quantity"?: number,"updated_at"?: string,"variant_id": string
                  }
                  Update: {
                    "inventory_id"?: string,"last_unit_cost"?: number | null,"quantity"?: number,"updated_at"?: string,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_balances_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_balances_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_balances_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["variant_id"]
    },{
      foreignKeyName: "stock_balances_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_stock"
      referencedColumns: ["variant_id"]
    }
                  ]
                },"units": {
                  Row: {
                    "allows_decimals": boolean,"code": string,"created_at": string | null,"created_by": string | null,"id": string,"is_active": boolean,"name": string,"symbol": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "allows_decimals"?: boolean,"code": string,"created_at"?: string | null,"created_by"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"symbol": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "allows_decimals"?: boolean,"code"?: string,"created_at"?: string | null,"created_by"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"symbol"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"user_branches": {
                  Row: {
                    "branch_id": string,"created_at": string,"created_by": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "branch_id": string,"created_at"?: string,"created_by"?: string | null,"user_id": string
                  }
                  Update: {
                    "branch_id"?: string,"created_at"?: string,"created_by"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_branches_branch_id_fkey"
      columns: ["branch_id"]
isOneToOne: false
      referencedRelation: "branches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_branches_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_catalog": {
                  Row: {
                    "allows_decimals": boolean | null,"base_price": number | null,"base_unit_id": string | null,"base_unit_symbol": string | null,"category_id": string | null,"category_name": string | null,"display_name": string | null,"factor": number | null,"is_active": boolean | null,"is_default": boolean | null,"min_stock": number | null,"product_id": string | null,"product_name": string | null,"sku": string | null,"unit_id": string | null,"unit_symbol": string | null,"variant_id": string | null,"variant_name": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_inventory_documents": {
                  Row: {
                    "conversion_loss_base": number | null,"created_at": string | null,"created_by": string | null,"created_by_name": string | null,"document_date": string | null,"document_type": Database["public"]['Enums']["inv_document_type"] | null,"id": string | null,"inventory_id": string | null,"inventory_name": string | null,"movement_count": number | null,"notes": string | null,"number": number | null,"reason_id": string | null,"reason_name": string | null,"reversed_by_document_id": string | null,"reverses_document_id": string | null,"reverses_document_number": number | null,"source_id": string | null,"source_type": string | null,"status": string | null,"target_inventory_id": string | null,"target_inventory_name": string | null,"void_reason": string | null,"voided_at": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "inventory_documents_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_documents_reason_id_fkey"
      columns: ["reason_id"]
isOneToOne: false
      referencedRelation: "movement_reasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_documents_reverses_document_id_fkey"
      columns: ["reverses_document_id"]
isOneToOne: true
      referencedRelation: "inventory_documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_documents_reverses_document_id_fkey"
      columns: ["reverses_document_id"]
isOneToOne: true
      referencedRelation: "v_inventory_documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_documents_reverses_document_id_fkey"
      columns: ["reverses_document_id"]
isOneToOne: true
      referencedRelation: "v_kardex"
      referencedColumns: ["document_id"]
    },{
      foreignKeyName: "inventory_documents_target_inventory_id_fkey"
      columns: ["target_inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    }
                  ]
                },"v_kardex": {
                  Row: {
                    "balance": number | null,"created_at": string | null,"created_by_name": string | null,"direction": number | null,"display_name": string | null,"document_id": string | null,"document_number": number | null,"document_status": string | null,"document_type": Database["public"]['Enums']["inv_document_type"] | null,"id": number | null,"inventory_id": string | null,"inventory_name": string | null,"movement_date": string | null,"notes": string | null,"quantity": number | null,"reason_name": string | null,"reverses_movement_id": number | null,"signed_quantity": number | null,"source_id": string | null,"source_type": string | null,"unit_cost": number | null,"unit_symbol": string | null,"variant_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "inventory_movements_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_reverses_movement_id_fkey"
      columns: ["reverses_movement_id"]
isOneToOne: true
      referencedRelation: "inventory_movements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_reverses_movement_id_fkey"
      columns: ["reverses_movement_id"]
isOneToOne: true
      referencedRelation: "v_kardex"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_catalog"
      referencedColumns: ["variant_id"]
    },{
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "v_stock"
      referencedColumns: ["variant_id"]
    }
                  ]
                },"v_stock": {
                  Row: {
                    "base_quantity": number | null,"base_unit_symbol": string | null,"below_min": boolean | null,"branch_id": string | null,"branch_name": string | null,"category_id": string | null,"category_name": string | null,"display_name": string | null,"factor": number | null,"inventory_id": string | null,"inventory_name": string | null,"is_active": boolean | null,"last_unit_cost": number | null,"min_stock": number | null,"product_id": string | null,"product_name": string | null,"quantity": number | null,"sku": string | null,"unit_price": number | null,"unit_symbol": string | null,"updated_at": string | null,"value_at_cost": number | null,"value_at_price": number | null,"variant_id": string | null,"variant_name": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "inventories_branch_id_fkey"
      columns: ["branch_id"]
isOneToOne: false
      referencedRelation: "branches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_balances_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventories"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_list_users":
{ Args: Record<PropertyKey, never>; Returns: {
              "branch_ids": (string)[],"created_at": string,"deactivated_at": string,"deactivation_reason": string,"email": string,"full_name": string,"id": string,"invited_at": string,"is_active": boolean,"last_sign_in_at": string,"phone": string,"role": Database["public"]['Enums']["app_role"]
            }[]
                           },
"admin_set_user_active":
{ Args: { "p_active": boolean,"p_reason"?: string,"p_user": string }; Returns: undefined
                           },
"admin_set_user_branches":
{ Args: { "p_branches": (string)[],"p_user": string }; Returns: undefined
                           },
"admin_set_user_role":
{ Args: { "p_reason"?: string,"p_role": Database["public"]['Enums']["app_role"],"p_user": string }; Returns: undefined
                           },
"audit_log_search":
{ Args: { "p_action"?: string,"p_actor"?: string,"p_before_id"?: number,"p_entity_id"?: string,"p_from"?: string,"p_limit"?: number,"p_module"?: string,"p_only_critical"?: boolean,"p_to"?: string }; Returns: {
              "action": string,"actor_id": string,"actor_name": string,"changed_fields": (string)[],"context": Json,"entity": string,"entity_id": string,"id": number,"module": string,"new_data": Json,"occurred_at": string,"old_data": Json,"reason": string,"severity": string
            }[]
                           },
"inv_add_variant":
{ Args: { "p_base_price"?: number,"p_factor": number,"p_min_stock"?: number,"p_name": string,"p_product": string,"p_sku"?: string,"p_unit": string }; Returns: string
                           },
"inv_create_product":
{ Args: { "p_base_price"?: number,"p_base_unit": string,"p_category"?: string,"p_description"?: string,"p_min_stock"?: number,"p_name": string,"p_sku"?: string }; Returns: string
                           },
"inv_post_adjustment":
{ Args: { "p_date": string,"p_inventory": string,"p_lines": Json,"p_notes"?: string,"p_reason": string,"p_request_id"?: string }; Returns: string
                           },
"inv_post_conversion":
{ Args: { "p_date": string,"p_from_qty": number,"p_from_variant": string,"p_inventory": string,"p_notes"?: string,"p_request_id"?: string,"p_to_qty": number,"p_to_variant": string }; Returns: string
                           },
"inv_post_entry":
{ Args: { "p_date": string,"p_inventory": string,"p_lines": Json,"p_notes"?: string,"p_reason": string,"p_request_id"?: string }; Returns: string
                           },
"inv_post_exit":
{ Args: { "p_date": string,"p_inventory": string,"p_lines": Json,"p_notes"?: string,"p_reason": string,"p_request_id"?: string }; Returns: string
                           },
"inv_post_opening":
{ Args: { "p_date": string,"p_inventory": string,"p_lines": Json,"p_notes"?: string,"p_request_id"?: string }; Returns: string
                           },
"inv_post_transfer":
{ Args: { "p_date": string,"p_from": string,"p_lines": Json,"p_notes"?: string,"p_request_id"?: string,"p_to": string }; Returns: string
                           },
"inv_set_active":
{ Args: { "p_active": boolean,"p_entity": string,"p_id": string,"p_reason"?: string }; Returns: undefined
                           },
"inv_set_base_price":
{ Args: { "p_price": number,"p_reason"?: string,"p_variant": string }; Returns: undefined
                           },
"inv_set_inventory_price":
{ Args: { "p_inventory": string,"p_price": number,"p_reason"?: string,"p_variant": string }; Returns: undefined
                           },
"inv_void_document":
{ Args: { "p_document": string,"p_reason": string }; Returns: string
                           },
"log_sign_in":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"public_company_info":
{ Args: Record<PropertyKey, never>; Returns: {
              "name": string
            }[]
                           },
"set_branch_active":
{ Args: { "p_active": boolean,"p_branch": string,"p_reason"?: string }; Returns: undefined
                           }
          }
          Enums: {
            "app_role": "owner"|"admin"|"operator"|"viewer","inv_document_type": "opening"|"entry"|"exit"|"adjustment"|"transfer"|"conversion"|"reversal"
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
            "app_role": ["owner", "admin", "operator", "viewer"],"inv_document_type": ["opening", "entry", "exit", "adjustment", "transfer", "conversion", "reversal"]
          }
        }
} as const
