import { db, usersTable, categoriesTable, productsTable, professionalsTable, commissionsTable, walletsTable, walletTransactionsTable, orderItemsTable, ordersTable, messagesTable, appSettingsTable, commissionRulesTable, genealogyNodesTable, promoCodesTable, bookingsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

function generateReferralCode(firstName: string, lastName: string, suffix: string) {
  const base = (firstName.charAt(0) + lastName).toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${base}-${suffix}`;
}

async function hashPw(password: string) {
  return bcrypt.hash(password, 12);
}

async function seed() {
  console.log("Seeding NFGN database...");

  // Settings
  const existingSettings = await db.select().from(appSettingsTable).limit(1);
  if (!existingSettings.length) {
    await db.insert(appSettingsTable).values({
      companyName: "New Face Global Network",
      contactEmail: "info@nfgn.com",
      contactPhone: "+1 (800) NFGN-999",
      taxRate: "8.5",
      shippingRate: "9.99",
      freeShippingThreshold: "75",
      paymentMethods: ["card", "paypal", "cashapp", "cod"],
      cashAppHandle: "$NFGN",
      paypalEmail: "payments@nfgn.com",
      registrationPackagePrice: "149.99",
      homePageBanner: "Transform Your Health & Wealth",
      homePageBannerSubtitle: "Premium naturopathic products • Community commerce • Financial freedom",
      demoMode: true,
    });
    console.log("App settings seeded");
  }

  // Commission Rules
  const existingRules = await db.select().from(commissionRulesTable).limit(1);
  if (!existingRules.length) {
    await db.insert(commissionRulesTable).values({
      levels: [
        { level: 1, rate: 10, description: "Direct referral" },
        { level: 2, rate: 20, description: "Power level — 2x commission" },
        { level: 3, rate: 10, description: "Generation 3" },
        { level: 4, rate: 5, description: "Generation 4" },
        { level: 5, rate: 5, description: "Generation 5" },
        { level: 6, rate: 5, description: "Generation 6" },
        { level: 7, rate: 5, description: "Generation 7" },
        { level: 8, rate: 5, description: "Generation 8" },
        { level: 9, rate: 5, description: "Generation 9" },
      ],
      powerBonusAmount: "100",
      powerBonusTrigger: 9,
      powerBonusEnabled: true,
    });
    console.log("Commission rules seeded");
  }

  // Categories
  const catData = [
    { name: "Cleanses", slug: "cleanses", description: "Herbal detox and cleanse products" },
    { name: "Appetite Support", slug: "appetite-support", description: "Natural appetite management" },
    { name: "Herbal Wellness", slug: "herbal-wellness", description: "Holistic herbal wellness products" },
    { name: "Soaps & Body Care", slug: "soaps-body-care", description: "Handmade natural soaps and body care" },
    { name: "Candles & Aromatics", slug: "candles-aromatics", description: "Therapeutic candles and aromatics" },
    { name: "Lotions & Oils", slug: "lotions-oils", description: "Natural skin nourishment" },
    { name: "Books & Education", slug: "books-education", description: "Naturopathic and wellness books" },
    { name: "Services", slug: "services", description: "Professional wellness services" },
    { name: "Membership Packages", slug: "membership-packages", description: "Pro Member access packages" },
  ];

  const existingCats = await db.select().from(categoriesTable);
  const catMap: Record<string, number> = {};
  for (const cat of catData) {
    const existing = existingCats.find(c => c.slug === cat.slug);
    if (!existing) {
      const [created] = await db.insert(categoriesTable).values(cat).returning();
      catMap[cat.slug] = created.id;
    } else {
      catMap[cat.slug] = existing.id;
    }
  }
  console.log("Categories seeded");

  // Products
  const productData = [
    {
      name: "IGNITE Herbal Cleanse",
      slug: "ignite-herbal-cleanse",
      description: "Our flagship 30-day herbal detox program designed to cleanse, restore, and energize your body from the inside out. Formulated with over 17 premium herbs including dandelion root, milk thistle, and burdock. Supports liver function, digestive health, and natural energy levels.",
      price: "79.99",
      comparePrice: "99.99",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80",
      categorySlug: "cleanses",
      stock: 145,
      featured: true,
      isProPackage: false,
      commissionRate: "15",
      ingredients: "Dandelion Root, Milk Thistle, Burdock Root, Senna Leaf, Cascara Sagrada, Ginger Root, Turmeric, Licorice Root, Psyllium Husk, Slippery Elm",
      benefits: "Supports liver detoxification, Improves digestive function, Boosts natural energy, Reduces bloating, Promotes clear skin",
    },
    {
      name: "IGNITE XL Appetite Suppressant",
      slug: "ignite-xl-appetite-suppressant",
      description: "Advanced natural appetite management formula. IGNITE XL combines garcinia cambogia, green tea extract, and African mango to help control cravings and support healthy weight management. No harsh stimulants — just clean, plant-based power.",
      price: "64.99",
      comparePrice: "79.99",
      image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&q=80",
      categorySlug: "appetite-support",
      stock: 98,
      featured: true,
      isProPackage: false,
      commissionRate: "15",
      ingredients: "Garcinia Cambogia Extract, Green Tea Extract, African Mango Seed, Glucomannan, Chromium Picolinate, Apple Cider Vinegar Powder",
      benefits: "Reduces hunger cravings, Supports metabolic function, Promotes healthy weight, Stabilizes blood sugar, Boosts thermogenesis",
    },
    {
      name: "Handmade Herbal Soap",
      slug: "handmade-herbal-soap",
      description: "Artisan cold-process soap infused with calendula, lavender, and shea butter. Free from synthetic fragrances, parabens, and sulfates. Each bar is handcrafted in small batches for maximum potency and freshness.",
      price: "18.99",
      comparePrice: "24.99",
      image: "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=500&q=80",
      categorySlug: "soaps-body-care",
      stock: 300,
      featured: true,
      isProPackage: false,
      commissionRate: "12",
      ingredients: "Shea Butter, Coconut Oil, Olive Oil, Calendula Petals, Lavender Essential Oil, Vitamin E",
      benefits: "Deeply moisturizes skin, Anti-inflammatory properties, Gentle for sensitive skin, Natural antimicrobial",
    },
    {
      name: "Herbal Detox Candle",
      slug: "herbal-detox-candle",
      description: "Soy-based aromatherapy candle infused with eucalyptus, cedar, and sage. Burns cleanly for 60+ hours. Perfect for meditation, yoga, or creating a serene healing environment. Handpoured and blessed.",
      price: "34.99",
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80",
      categorySlug: "candles-aromatics",
      stock: 210,
      featured: false,
      isProPackage: false,
      commissionRate: "12",
      ingredients: "100% Soy Wax, Eucalyptus Essential Oil, Cedar Wood Oil, White Sage, Cotton Wick",
      benefits: "Purifies air naturally, Reduces stress and anxiety, Promotes relaxation, Creates healing atmosphere",
    },
    {
      name: "Naturopathic Wellness Lotion",
      slug: "naturopathic-wellness-lotion",
      description: "Rich, fast-absorbing body lotion formulated with jojoba oil, aloe vera, and a proprietary blend of seven herbs. Nourishes dry, stressed skin and promotes a healthy, radiant glow.",
      price: "42.99",
      comparePrice: "54.99",
      image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80",
      categorySlug: "lotions-oils",
      stock: 180,
      featured: false,
      isProPackage: false,
      commissionRate: "12",
      ingredients: "Aloe Vera Gel, Jojoba Oil, Shea Butter, Chamomile Extract, Rose Hip Oil, Vitamin C, Hyaluronic Acid",
      benefits: "Deep hydration, Reduces inflammation, Brightens complexion, Anti-aging properties, Suitable for all skin types",
    },
    {
      name: "Herbal Healing Book — Dr. A. Freeman",
      slug: "herbal-healing-book",
      description: "Comprehensive guide to naturopathic healing written by renowned herbalist Dr. A. Freeman. Covers 200+ medicinal herbs, preparation methods, dosage guidelines, and clinical case studies. Over 400 pages of actionable wellness wisdom.",
      price: "44.99",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80",
      categorySlug: "books-education",
      stock: 75,
      featured: false,
      isProPackage: false,
      commissionRate: "10",
      benefits: "Learn naturopathic medicine, Comprehensive herb guide, Clinical case studies, Preparation methods",
    },
    {
      name: "Soul Body Spirit Wellness Guide",
      slug: "soul-body-spirit-wellness-guide",
      description: "A transformational wellness guide that bridges physical health, mental clarity, and spiritual alignment. Written by NFGN's founder, this book is the philosophy behind everything we do. Includes 30-day wellness challenge and journal prompts.",
      price: "39.99",
      comparePrice: "49.99",
      image: "https://images.unsplash.com/photo-1629367494173-c78a56567877?w=500&q=80",
      categorySlug: "books-education",
      stock: 120,
      featured: true,
      isProPackage: false,
      commissionRate: "10",
      benefits: "Holistic wellness approach, 30-day transformation plan, Spiritual alignment guidance, Mental clarity practices",
    },
    {
      name: "Immune Boost Herbal Tea Blend",
      slug: "immune-boost-herbal-tea",
      description: "Premium loose-leaf immune support tea blended with elderberry, echinacea, rose hips, and ginger. 60 servings of powerful immune defense. USDA certified organic herbs.",
      price: "29.99",
      image: "https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?w=500&q=80",
      categorySlug: "herbal-wellness",
      stock: 250,
      featured: false,
      isProPackage: false,
      commissionRate: "12",
      ingredients: "Organic Elderberry, Organic Echinacea, Rose Hips, Ginger Root, Licorice Root, Peppermint",
      benefits: "Strengthens immune system, Anti-viral properties, Rich in antioxidants, Reduces cold duration",
    },
    {
      name: "Wellness Consultation — 60 Min",
      slug: "wellness-consultation",
      description: "One-on-one naturopathic wellness consultation with a certified NFGN professional. Receive a personalized health assessment, supplement recommendations, lifestyle guidance, and a custom wellness plan.",
      price: "125.00",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80",
      categorySlug: "services",
      stock: 999,
      featured: false,
      isProPackage: false,
      commissionRate: "10",
      benefits: "Personalized health assessment, Custom wellness plan, Expert supplement guidance, Holistic lifestyle coaching",
    },
    {
      name: "Pro Member Registration Package",
      slug: "pro-member-registration",
      description: "Join the NFGN family as a Commission-Qualified Pro Member. This package unlocks your ability to earn commissions across 9 generations, receive your personal replicated website, access the member back office, and participate in the 2 Down By Infinity Pay Structure. Includes: Pro Member orientation kit, Digital welcome package, Personal referral link, Back office access, Commission qualification.",
      price: "149.99",
      comparePrice: "199.99",
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&q=80",
      categorySlug: "membership-packages",
      stock: 9999,
      featured: true,
      isProPackage: true,
      commissionRate: "20",
      benefits: "Commission qualification across 9 generations, Personal replicated website, Member back office access, Power Bonus eligibility, Business training resources",
    },
  ];

  const existingProducts = await db.select().from(productsTable);
  const productMap: Record<string, number> = {};

  for (const p of productData) {
    const existing = existingProducts.find(ep => ep.slug === p.slug);
    if (!existing) {
      const [created] = await db.insert(productsTable).values({
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        image: p.image,
        categoryId: catMap[p.categorySlug],
        stock: p.stock,
        featured: p.featured,
        isProPackage: p.isProPackage,
        commissionRate: p.commissionRate,
        ingredients: p.ingredients,
        benefits: p.benefits,
        status: "active",
      }).returning();
      productMap[p.slug] = created.id;
    } else {
      productMap[p.slug] = existing.id;
    }
  }

  // Update settings with pro package ID
  const proPackageId = productMap["pro-member-registration"];
  if (proPackageId) {
    await db.update(appSettingsTable).set({ registrationPackageId: proPackageId }).where(eq(appSettingsTable.id, (await db.select().from(appSettingsTable).limit(1))[0]?.id ?? 1));
  }
  console.log("Products seeded");

  // Users
  const userData = [
    { email: "admin@nfgn.com", password: "NFGNAdmin!2026#", firstName: "Super", lastName: "Admin", role: "super_admin", refCode: "admin-SUPER" },
    { email: "storeadmin@nfgn.com", password: "StoreAdmin!2026#", firstName: "Store", lastName: "Manager", role: "store_admin", refCode: "store-ADMIN" },
    { email: "promember@nfgn.com", password: "ProMember!2026#", firstName: "Jordan", lastName: "Rivers", role: "pro_member", refCode: "jrivers-GOLD1" },
    { email: "affiliate@nfgn.com", password: "Affiliate!2026#", firstName: "Alex", lastName: "Chen", role: "affiliate", refCode: "achen-AFFL1" },
    { email: "customer@nfgn.com", password: "Customer!2026#", firstName: "Maya", lastName: "Johnson", role: "customer", refCode: "mjohnson-CUST" },
    { email: "tmiller@nfgn.com", password: "Member2026!", firstName: "Tamara", lastName: "Miller", role: "pro_member", refCode: "tmiller-PRO01" },
    { email: "dwilliams@nfgn.com", password: "Member2026!", firstName: "David", lastName: "Williams", role: "pro_member", refCode: "dwilliams-P02" },
    { email: "sthompson@nfgn.com", password: "Member2026!", firstName: "Sarah", lastName: "Thompson", role: "affiliate", refCode: "sthompson-AFF" },
    { email: "rbrown@nfgn.com", password: "Member2026!", firstName: "Robert", lastName: "Brown", role: "customer", refCode: "rbrown-CUST1" },
    { email: "ljackson@nfgn.com", password: "Member2026!", firstName: "Lisa", lastName: "Jackson", role: "pro_member", refCode: "ljackson-PRO3" },
    { email: "mwilson@nfgn.com", password: "Member2026!", firstName: "Michael", lastName: "Wilson", role: "customer", refCode: "mwilson-CUS02" },
    { email: "kmorris@nfgn.com", password: "Member2026!", firstName: "Kim", lastName: "Morris", role: "affiliate", refCode: "kmorris-AFF02" },
    { email: "jdavis@nfgn.com", password: "Member2026!", firstName: "James", lastName: "Davis", role: "pro_member", refCode: "jdavis-PRO04" },
    { email: "aanderson@nfgn.com", password: "Member2026!", firstName: "Amanda", lastName: "Anderson", role: "customer", refCode: "aanderson-CS" },
    { email: "cmartin@nfgn.com", password: "Member2026!", firstName: "Carlos", lastName: "Martin", role: "pro_member", refCode: "cmartin-PRO05" },
  ];

  const existingUsers = await db.select().from(usersTable);
  const userMap: Record<string, number> = {};

  for (let i = 0; i < userData.length; i++) {
    const u = userData[i];
    const existing = existingUsers.find(eu => eu.email === u.email);
    if (!existing) {
      const passwordHash = await hashPw(u.password);
      const isProMember = ["super_admin", "admin", "store_admin", "pro_member"].includes(u.role);

      let sponsorId: number | undefined;
      if (i === 3) sponsorId = userMap["admin@nfgn.com"];
      if (i === 4) sponsorId = userMap["promember@nfgn.com"];
      if (i === 5) sponsorId = userMap["promember@nfgn.com"];
      if (i === 6) sponsorId = userMap["promember@nfgn.com"];
      if (i === 7) sponsorId = userMap["affiliate@nfgn.com"];
      if (i === 8) sponsorId = userMap["promember@nfgn.com"];
      if (i === 9) sponsorId = userMap["tmiller@nfgn.com"];
      if (i === 10) sponsorId = userMap["tmiller@nfgn.com"];
      if (i === 11) sponsorId = userMap["dwilliams@nfgn.com"];
      if (i === 12) sponsorId = userMap["dwilliams@nfgn.com"];
      if (i === 13) sponsorId = userMap["affiliate@nfgn.com"];
      if (i === 14) sponsorId = userMap["ljackson@nfgn.com"];

      const [created] = await db.insert(usersTable).values({
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        referralCode: u.refCode,
        sponsorId,
        isProMember,
        proMemberSince: isProMember ? new Date("2024-01-15") : undefined,
        status: "active",
      }).returning();

      userMap[u.email] = created.id;
      await db.insert(walletsTable).values({ userId: created.id });
    } else {
      userMap[u.email] = existing.id;
    }
  }
  console.log("Users seeded");

  // Genealogy nodes
  const existingNodes = await db.select().from(genealogyNodesTable);
  const nodeEmails = [
    { email: "admin@nfgn.com", parentEmail: null, gen: 1 },
    { email: "promember@nfgn.com", parentEmail: "admin@nfgn.com", gen: 2 },
    { email: "affiliate@nfgn.com", parentEmail: "admin@nfgn.com", gen: 2 },
    { email: "storeadmin@nfgn.com", parentEmail: "admin@nfgn.com", gen: 2 },
    { email: "tmiller@nfgn.com", parentEmail: "promember@nfgn.com", gen: 3 },
    { email: "dwilliams@nfgn.com", parentEmail: "promember@nfgn.com", gen: 3 },
    { email: "customer@nfgn.com", parentEmail: "promember@nfgn.com", gen: 3 },
    { email: "rbrown@nfgn.com", parentEmail: "promember@nfgn.com", gen: 3 },
    { email: "sthompson@nfgn.com", parentEmail: "affiliate@nfgn.com", gen: 3 },
    { email: "ljackson@nfgn.com", parentEmail: "tmiller@nfgn.com", gen: 4 },
    { email: "mwilson@nfgn.com", parentEmail: "tmiller@nfgn.com", gen: 4 },
    { email: "kmorris@nfgn.com", parentEmail: "dwilliams@nfgn.com", gen: 4 },
    { email: "jdavis@nfgn.com", parentEmail: "dwilliams@nfgn.com", gen: 4 },
    { email: "aanderson@nfgn.com", parentEmail: "affiliate@nfgn.com", gen: 3 },
    { email: "cmartin@nfgn.com", parentEmail: "ljackson@nfgn.com", gen: 5 },
  ];

  const nodeMap: Record<string, number> = {};
  for (const { email, parentEmail, gen } of nodeEmails) {
    const userId = userMap[email];
    if (!userId) continue;
    const existing = existingNodes.find(n => n.userId === userId);
    if (!existing) {
      const parentId = parentEmail ? nodeMap[parentEmail] : undefined;
      const [node] = await db.insert(genealogyNodesTable).values({
        userId,
        parentId,
        generation: gen,
        path: parentId ? `/${parentId}` : "",
      }).returning();
      nodeMap[email] = node.id;
    } else {
      nodeMap[email] = existing.id;
    }
  }
  console.log("Genealogy nodes seeded");

  // Orders
  const existingOrders = await db.select().from(ordersTable);
  if (existingOrders.length < 5) {
    const orderData = [
      { email: "customer@nfgn.com", productSlug: "ignite-herbal-cleanse", qty: 2, method: "card", status: "completed", paymentStatus: "demo_paid" },
      { email: "promember@nfgn.com", productSlug: "pro-member-registration", qty: 1, method: "paypal", status: "completed", paymentStatus: "demo_paid" },
      { email: "tmiller@nfgn.com", productSlug: "pro-member-registration", qty: 1, method: "card", status: "completed", paymentStatus: "demo_paid" },
      { email: "rbrown@nfgn.com", productSlug: "ignite-xl-appetite-suppressant", qty: 1, method: "cashapp", status: "completed", paymentStatus: "demo_paid" },
      { email: "mwilson@nfgn.com", productSlug: "herbal-healing-book", qty: 1, method: "cod", status: "pending", paymentStatus: "pending" },
      { email: "dwilliams@nfgn.com", productSlug: "pro-member-registration", qty: 1, method: "card", status: "completed", paymentStatus: "demo_paid" },
      { email: "customer@nfgn.com", productSlug: "handmade-herbal-soap", qty: 3, method: "card", status: "completed", paymentStatus: "demo_paid" },
      { email: "aanderson@nfgn.com", productSlug: "naturopathic-wellness-lotion", qty: 2, method: "paypal", status: "processing", paymentStatus: "demo_paid" },
      { email: "cmartin@nfgn.com", productSlug: "pro-member-registration", qty: 1, method: "card", status: "completed", paymentStatus: "demo_paid" },
      { email: "ljackson@nfgn.com", productSlug: "immune-boost-herbal-tea", qty: 2, method: "card", status: "completed", paymentStatus: "demo_paid" },
    ];

    for (let i = 0; i < orderData.length; i++) {
      const o = orderData[i];
      const userId = userMap[o.email];
      const productId = productMap[o.productSlug];
      if (!userId || !productId) continue;

      const product = (await db.select().from(productsTable).where(eq(productsTable.id, productId)))[0];
      if (!product) continue;

      const subtotal = parseFloat(product.price) * o.qty;
      const tax = subtotal * 0.085;
      const shipping = subtotal >= 75 ? 0 : 9.99;
      const total = subtotal + tax + shipping;
      const orderNumber = `NFGN-${2026000 + i}`;

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - (30 - i * 2));

      const [order] = await db.insert(ordersTable).values({
        orderNumber,
        userId,
        status: o.status,
        paymentMethod: o.method,
        paymentStatus: o.paymentStatus,
        subtotal: String(subtotal),
        tax: String(tax),
        shipping: String(shipping),
        discount: "0",
        total: String(total),
        shippingAddress: "123 Wellness Way, Atlanta, GA 30303",
      }).returning();

      await db.insert(orderItemsTable).values({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: o.qty,
        total: String(parseFloat(product.price) * o.qty),
      });

      if (product.isProPackage) {
        await db.update(usersTable).set({
          isProMember: true,
          role: "pro_member",
          proMemberSince: new Date(),
        }).where(eq(usersTable.id, userId));
      }
    }
    console.log("Orders seeded");

    // Commissions
    const commissionData = [
      { userId: userMap["admin@nfgn.com"], fromEmail: "customer@nfgn.com", orderIdx: 0, level: 1, rate: 10 },
      { userId: userMap["promember@nfgn.com"], fromEmail: "customer@nfgn.com", orderIdx: 0, level: 2, rate: 20 },
      { userId: userMap["admin@nfgn.com"], fromEmail: "promember@nfgn.com", orderIdx: 1, level: 1, rate: 10 },
      { userId: userMap["promember@nfgn.com"], fromEmail: "tmiller@nfgn.com", orderIdx: 2, level: 1, rate: 10 },
      { userId: userMap["admin@nfgn.com"], fromEmail: "tmiller@nfgn.com", orderIdx: 2, level: 2, rate: 20 },
      { userId: userMap["promember@nfgn.com"], fromEmail: "dwilliams@nfgn.com", orderIdx: 5, level: 1, rate: 10 },
    ];

    const orders = await db.select().from(ordersTable);
    for (const c of commissionData) {
      const fromUserId = userMap[c.fromEmail];
      const order = orders[c.orderIdx];
      if (!fromUserId || !order || !c.userId) continue;

      const saleAmount = parseFloat(order.total);
      const commissionAmount = saleAmount * c.rate / 100;

      await db.insert(commissionsTable).values({
        userId: c.userId,
        fromUserId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        level: c.level,
        rate: String(c.rate),
        saleAmount: String(saleAmount),
        commissionAmount: String(commissionAmount),
        status: Math.random() > 0.5 ? "approved" : "pending",
        type: "sales",
      });

      const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, c.userId));
      if (wallet) {
        await db.update(walletsTable).set({
          totalEarned: String(parseFloat(wallet.totalEarned) + commissionAmount),
          balance: String(parseFloat(wallet.balance) + commissionAmount),
        }).where(eq(walletsTable.userId, c.userId));
      }
    }
    console.log("Commissions seeded");
  }

  // Service Professionals
  const existingPros = await db.select().from(professionalsTable);
  if (!existingPros.length) {
    const prosData = [
      {
        name: "Dr. Amara Osei",
        bio: "Board-certified naturopathic physician with 15 years of experience in integrative medicine and herbal therapeutics. Specializes in hormonal balance and digestive health.",
        specialty: "Naturopathic Medicine",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&q=80",
        rating: "4.9",
        reviewCount: 127,
        hourlyRate: "150",
        services: ["Naturopathic Consultation", "Herb Protocol Design", "Hormone Balancing", "Digestive Health"],
      },
      {
        name: "Minister Grace Williams",
        bio: "Ordained minister and wellness coach with expertise in holistic healing, spiritual counseling, and community business development. Featured speaker at national wellness conferences.",
        specialty: "Ministry & Business Consulting",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
        rating: "5.0",
        reviewCount: 89,
        hourlyRate: "125",
        services: ["Spiritual Counseling", "Ministry Consulting", "Business Development", "Community Leadership"],
      },
      {
        name: "Marcus Thompson, CHC",
        bio: "Certified holistic health coach and wellness entrepreneur. Specializes in transformational lifestyle coaching, weight management, and building sustainable wellness routines.",
        specialty: "Wellness Coaching",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
        rating: "4.8",
        reviewCount: 203,
        hourlyRate: "95",
        services: ["Wellness Coaching", "Weight Management", "Lifestyle Transformation", "Nutritional Guidance"],
      },
      {
        name: "Dr. Priya Patel",
        bio: "Ayurvedic practitioner and integrative wellness consultant. Expert in pulse diagnosis, dosha balancing, and personalized wellness protocols. Author of 'Ancient Wisdom, Modern Healing'.",
        specialty: "Ayurvedic Medicine",
        avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80",
        rating: "4.9",
        reviewCount: 156,
        hourlyRate: "135",
        services: ["Ayurvedic Consultation", "Dosha Assessment", "Herbal Therapy", "Panchakarma"],
      },
      {
        name: "Coach Devon Barnes",
        bio: "Network marketing specialist and MLM business consultant with 10+ years helping wellness entrepreneurs build six-figure businesses. Expert in team building and compensation plan strategy.",
        specialty: "Network Marketing & Business",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
        rating: "4.7",
        reviewCount: 312,
        hourlyRate: "110",
        services: ["MLM Business Consulting", "Team Building Strategy", "Social Media Marketing", "Event Planning"],
      },
    ];

    for (const pro of prosData) {
      await db.insert(professionalsTable).values({
        name: pro.name,
        bio: pro.bio,
        specialty: pro.specialty,
        avatar: pro.avatar,
        rating: pro.rating,
        reviewCount: pro.reviewCount,
        isAvailable: true,
        hourlyRate: pro.hourlyRate,
        services: pro.services,
      });
    }
    console.log("Professionals seeded");

    // Bookings
    const pros = await db.select().from(professionalsTable);
    if (pros.length && userMap["customer@nfgn.com"]) {
      await db.insert(bookingsTable).values({
        userId: userMap["customer@nfgn.com"],
        professionalId: pros[0].id,
        serviceType: "Naturopathic Consultation",
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 60,
        status: "confirmed",
        paymentMethod: "card",
        paymentStatus: "demo_paid",
        amount: "150",
        notes: "First-time consultation for digestive health concerns",
      });

      await db.insert(bookingsTable).values({
        userId: userMap["promember@nfgn.com"],
        professionalId: pros[4].id,
        serviceType: "MLM Business Consulting",
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        duration: 90,
        status: "confirmed",
        paymentMethod: "paypal",
        paymentStatus: "demo_paid",
        amount: "165",
        notes: "Strategy session for growing my downline",
      });
      console.log("Bookings seeded");
    }
  }

  // Messages
  const existingMsgs = await db.select().from(messagesTable);
  if (!existingMsgs.length && userMap["admin@nfgn.com"]) {
    await db.insert(messagesTable).values({
      fromUserId: userMap["admin@nfgn.com"],
      subject: "Welcome to NFGN!",
      body: "Welcome to the New Face Global Network family! We are thrilled to have you join our community of wellness entrepreneurs. Your journey to health and wealth starts now. Explore the member resources, connect with your sponsor, and don't hesitate to reach out if you need any support.",
      isBroadcast: true,
      isRead: false,
    });

    if (userMap["promember@nfgn.com"]) {
      await db.insert(messagesTable).values({
        fromUserId: userMap["promember@nfgn.com"],
        toUserId: userMap["admin@nfgn.com"],
        subject: "Question about Power Bonus",
        body: "Hi Admin, I have a question about the Power Bonus. I have enrolled 7 new Pro Members in my downline. Do I need exactly 9 within a specific generation to trigger the bonus, or is it cumulative?",
        isBroadcast: false,
        isRead: false,
      });
    }

    await db.insert(messagesTable).values({
      fromUserId: userMap["admin@nfgn.com"],
      subject: "New Product Launch — IGNITE Premium Coming Soon!",
      body: "Exciting news! We are preparing to launch our most powerful formula yet. IGNITE Premium will feature 25 premium herbs and botanicals with enhanced bioavailability. Pro Members will have exclusive early access and a special launch commission rate. Stay tuned for more details!",
      isBroadcast: true,
      isRead: false,
    });
    console.log("Messages seeded");
  }

  // Promo codes
  const existingPromos = await db.select().from(promoCodesTable);
  if (!existingPromos.length) {
    await db.insert(promoCodesTable).values([
      {
        code: "WELCOME20",
        discountType: "percentage",
        discountValue: "20",
        minOrderAmount: "0",
        maxUses: 500,
        isActive: true,
      },
      {
        code: "FREESHIP",
        discountType: "flat",
        discountValue: "9.99",
        minOrderAmount: "50",
        isActive: true,
      },
      {
        code: "NFGN2026",
        discountType: "percentage",
        discountValue: "15",
        minOrderAmount: "75",
        maxUses: 200,
        isActive: true,
      },
    ]);
    console.log("Promo codes seeded");
  }

  console.log("\n=== NFGN Demo Credentials ===");
  console.log("Super Admin:  admin@nfgn.com          / NFGNAdmin!2026#");
  console.log("Store Admin:  storeadmin@nfgn.com     / StoreAdmin!2026#");
  console.log("Pro Member:   promember@nfgn.com      / ProMember!2026#");
  console.log("Affiliate:    affiliate@nfgn.com      / Affiliate!2026#");
  console.log("Customer:     customer@nfgn.com       / Customer!2026#");
  console.log("\nSeed complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
