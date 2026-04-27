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
    case "customer":
    case "member":        return "Member";
    default:              return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
}

/** Human-readable label for memberTier values */
export function tierLabel(tier: string): string {
  switch (tier) {
    case "retail_member":              return "Retail Member";
    case "referring_retail_member":    return "Referring Retail Member";
    case "retail_community_builder":   return "Retail Community Builder";
    case "associate_pro_member":       return "Associate Pro Member";
    case "pro_member":                 return "Pro Member";
    default:                           return tier.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
}

/** Short abbreviation for member tiers */
export function tierAbbr(tier: string): string {
  switch (tier) {
    case "retail_member":              return "RM";
    case "referring_retail_member":    return "RRM";
    case "retail_community_builder":   return "RCB";
    case "associate_pro_member":       return "APM";
    case "pro_member":                 return "PM";
    default:                           return tier.toUpperCase().slice(0, 3);
  }
}

export function commissionTypeLabel(type: string): string {
  switch (type) {
    case "referral":           return "Referral Commission";
    case "sales":              return "Product Sales Commission (PSC)";
    case "level":              return "Pro Member Registration Commission (PMRC)";
    case "power_squad_bonus":  return "Pro Member Bonus (CLB/MCB)";
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
