/**
 * Display helpers — centralises all human-readable label logic.
 */

export function roleLabel(role: string): string {
  switch (role) {
    case "super_admin":   return "Super Admin";
    case "admin":         return "Admin";
    case "store_admin":   return "Store Admin";
    case "pro_member":    return "Pro Member";
    case "affiliate":     return "Affiliate";
    case "customer":      return "Member";      // Customers are always displayed as "Member"
    default:              return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
}

export function commissionTypeLabel(type: string): string {
  switch (type) {
    case "referral":           return "Referral Commission";
    case "sales":              return "Sales Commission";
    case "level":              return "Level Commission";
    case "power_squad_bonus":  return "Power Squad Bonus";
    default:                   return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
}

export function commissionTypeBadgeClass(type: string): string {
  switch (type) {
    case "referral":           return "bg-blue-100 text-blue-800 border-blue-200";
    case "sales":              return "bg-green-100 text-green-800 border-green-200";
    case "level":              return "bg-amber-100 text-amber-800 border-amber-200";
    case "power_squad_bonus":  return "bg-purple-100 text-purple-800 border-purple-200";
    default:                   return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function commissionStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved": return "default";
    case "pending":  return "secondary";
    case "rejected": return "destructive";
    default:         return "outline";
  }
}
