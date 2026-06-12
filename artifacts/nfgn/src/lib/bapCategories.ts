export const BAP_MAIN_CATEGORIES = [
  {
    key: "health-wellness",
    label: "Health & Wellness",
    description: "For providers offering wellness, healthcare, fitness, nutrition, mental health, naturopathic, primary care, and personal wellness services.",
    purpose: "Connect members with healthcare and wellness professionals to support physical, mental, and holistic health.",
    forWhom: "Primary care patients, mental health clients, fitness enthusiasts, and anyone seeking holistic wellness support.",
  },
  {
    key: "cosmetology",
    label: "Cosmetology",
    description: "For beauty, grooming, spa, hair, nails, skincare, massage, and personal care providers.",
    purpose: "Provide access to licensed beauty and grooming professionals for personal care and self-confidence.",
    forWhom: "Anyone seeking hair, skin, nail, or grooming services from licensed cosmetology professionals.",
  },
  {
    key: "restaurants",
    label: "Restaurants & Food",
    description: "For restaurants, food trucks, meal services, catering, and food-related vendors.",
    purpose: "Connect members with local dining, catering, and food service options in their community.",
    forWhom: "Food lovers, event planners, and anyone needing catering or dining experiences.",
  },
  {
    key: "professional-services",
    label: "Professional Services",
    description: "For skilled trades, repair services, event locations, business services, and professional service providers.",
    purpose: "Provide access to skilled professionals for home, auto, events, and business needs.",
    forWhom: "Homeowners, business owners, event coordinators, and anyone needing skilled trade services.",
  },
  {
    key: "consultant-services",
    label: "Consultant Services",
    description: "For business coaches, MLM consultants, spiritual consultants, life coaches, counselors, and professional advisors.",
    purpose: "Help members grow personally and professionally through expert consulting and coaching.",
    forWhom: "Entrepreneurs, professionals, and individuals seeking personal development and business guidance.",
  },
  {
    key: "education",
    label: "Education",
    description: "For tutors, instructors, trainers, educational coaches, and learning support providers.",
    purpose: "Connect learners with qualified educators for academic, skills, and personal development.",
    forWhom: "Students, parents, adult learners, and anyone seeking educational support or skill development.",
  },
  {
    key: "marketing",
    label: "Marketing & Advertising",
    description: "For marketing specialists, branding experts, advertising providers, content creators, and promotional service providers.",
    purpose: "Help members and businesses grow their brand, reach their audience, and generate revenue.",
    forWhom: "Business owners, entrepreneurs, and professionals looking to expand their market presence.",
  },
  {
    key: "general-services",
    label: "General Services",
    description: "For everyday service providers such as ride share, lawn care, home services, mechanics, painters, carpenters, and other local service providers.",
    purpose: "Provide access to reliable everyday services to support members in their daily lives.",
    forWhom: "Homeowners, renters, and anyone needing dependable local service providers.",
  },
  {
    key: "nfgn-sports",
    label: "NFGN Sports",
    description: "For sports coaches, trainers, teams, camps, player development, private lessons, and athletic services.",
    purpose: "Support athletic development, team sports, and fitness through NFGN-affiliated sports professionals.",
    forWhom: "Athletes of all ages, parents seeking coaching for children, and sports enthusiasts.",
  },
] as const;

export type BapCategoryKey = typeof BAP_MAIN_CATEGORIES[number]["key"];

export const BAP_SUBCATEGORIES: Record<string, string[]> = {
  "health-wellness": [
    "Mental Health Doctors",
    "Primary Care Providers",
    "Physical Trainers",
    "Massage Therapists",
    "Counselors",
    "Wellness Coaches",
    "Life Coaches",
    "Naturopathic Practitioners",
    "Nutritionists",
  ],
  "cosmetology": [
    "Barbers",
    "Cosmetologists",
    "Aestheticians",
    "Nail Techs",
    "Barbershops",
    "Hair Salons",
    "Spas",
    "Massage Therapists",
  ],
  "restaurants": [
    "Restaurants",
    "Food Trucks",
    "Catering Services",
    "Private Chefs",
    "Meal Prep Services",
  ],
  "professional-services": [
    "Mechanics",
    "Carpenters",
    "Painters",
    "Event Locations",
    "Business Service Providers",
    "Electricians",
    "Plumbers",
  ],
  "consultant-services": [
    "MLM Consultants",
    "Spiritual Consultants",
    "Business Coaches",
    "Life Coaches",
    "Counselors",
    "Executive Coaches",
  ],
  "education": [
    "Tutoring",
    "Educational Coaches",
    "Instructors",
    "Academic Coaches",
  ],
  "marketing": [
    "Marketing Consultants",
    "Advertising Consultants",
    "Branding Specialists",
    "Content Creators",
    "Promotional Services",
    "Social Media Managers",
  ],
  "general-services": [
    "Landscaping / Lawn Care",
    "Rideshare",
    "Home Services",
    "Local Service Providers",
    "Cleaning Services",
    "Moving Services",
  ],
  "nfgn-sports": [
    "Sports Coaches",
    "Physical Trainers",
    "Team Coaches",
    "Private Lessons",
    "Skills Trainers",
    "Sports Camps",
    "Athletic Performance Coaches",
  ],
};

export function getCategoryLabel(key: string): string {
  return BAP_MAIN_CATEGORIES.find(c => c.key === key)?.label ?? key;
}

export function getCategoryInfo(key: string) {
  return BAP_MAIN_CATEGORIES.find(c => c.key === key) ?? null;
}

// Legacy export kept for backward compatibility
export const BAP_CATEGORIES: Record<string, string[]> = {
  "NFGN SPORTS Professionals": [
    "Personal Trainer", "Guest Speaker", "Coach", "Ast Coach",
    "Medical Sports Professional", "Skills Camp Trainer",
    "Athletic Performance Coach", "Sports Nutritionist",
    "Youth Sports Director", "Tournament Coordinator",
    "Strength & Conditioning Coach", "Sports Therapist / Rehab",
  ],
  "Beauty & Hair": ["Braiding", "Locs", "Shampoo & Style", "Color & Highlights", "Cut & Style", "Natural Hair Care", "Weaves & Extensions", "Relaxers", "Protective Styles"],
  "Barbering": ["Cuts & Fades", "Beard Grooming", "Line Ups", "Kids Cuts", "Hot Towel Shave", "Hair Color"],
  "Mental Health": ["Life Coaching", "Licensed Counseling", "Stress Management", "Mindfulness Coaching", "Grief Support", "Addiction Coaching"],
  "Physical Fitness": ["Personal Training", "Group Fitness Classes", "Nutrition Coaching", "Yoga Instruction", "Sports Performance", "Weight Loss Coaching"],
  "Naturopathic Services": ["Herbal Consultations", "Holistic Nutrition", "Detox Programs", "Wellness Assessments", "Iridology", "Homeopathy"],
  "Coaching": ["Business Coaching", "Career Coaching", "Relationship Coaching", "Executive Coaching", "Sports Coaching", "Academic Tutoring"],
  "Automotive": ["General Repair", "Diagnostics", "Oil & Maintenance", "Detailing & Cleaning", "Tire Services", "Electrical Repair"],
  "Carpentry": ["Custom Furniture", "Home Repairs", "Finish Carpentry", "Framing", "Cabinet Making", "Deck Building"],
  "Food & Restaurant": ["Catering", "Private Chef", "Meal Prep Services", "Pop-Up Events", "Desserts & Baking", "Nutrition Meal Plans"],
  "Photography & Media": ["Portrait Photography", "Event Photography", "Videography", "Content Creation", "Editing & Retouching", "Product Photography"],
  "Other Services": ["Consulting", "Virtual Assistance", "Event Planning", "Interior Design", "Notary Services", "Translation Services"],
};

export const SPORTS_CATEGORY_KEY = "NFGN SPORTS Professionals";
