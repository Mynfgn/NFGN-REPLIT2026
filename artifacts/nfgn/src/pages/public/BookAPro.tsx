import { useState } from "react";
import { useListProfessionals } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star, Calendar, Clock, DollarSign, Loader2, Trophy,
  ChevronDown, Users, Dumbbell, Mic, UserCheck, Stethoscope,
  GraduationCap, Zap, Filter,
} from "lucide-react";
import { BAP_CATEGORIES, SPORTS_CATEGORY_KEY } from "@/lib/bapCategories";

const GOLD = "#C9A84C";
const BLACK = "#0a0a0a";

const SPORTS_ROLES = [
  { icon: <Dumbbell size={13} />, label: "Personal Trainer" },
  { icon: <Mic size={13} />, label: "Guest Speaker" },
  { icon: <UserCheck size={13} />, label: "Coach / Ast Coach" },
  { icon: <Stethoscope size={13} />, label: "Medical Sports Professional" },
  { icon: <GraduationCap size={13} />, label: "Skills Camp Trainer" },
  { icon: <Zap size={13} />, label: "Athletic Performance Coach" },
];

const ALL_OPTION = "All Categories";
const CATEGORY_OPTIONS = [ALL_OPTION, SPORTS_CATEGORY_KEY, ...Object.keys(BAP_CATEGORIES).filter(k => k !== SPORTS_CATEGORY_KEY)];

function ProCard({ pro }: { pro: any }) {
  const isSports = pro.specialty === SPORTS_CATEGORY_KEY;

  return (
    <div
      style={{
        background: isSports ? "linear-gradient(135deg, #0d0d0d, #141414)" : "#fff",
        border: `1.5px solid ${isSports ? "rgba(201,168,76,0.35)" : "#e5e7eb"}`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: isSports ? "0 4px 20px rgba(201,168,76,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.2s ease",
      }}
    >
      {isSports && (
        <div style={{ background: `linear-gradient(90deg, ${GOLD}, rgba(201,168,76,0.7))`, padding: "5px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          <Trophy size={11} color="#000" />
          <span style={{ fontSize: 10, fontWeight: 900, color: "#000", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            NFGN SPORTS PROFESSIONAL
          </span>
        </div>
      )}

      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
          {pro.avatar ? (
            <img
              src={pro.avatar}
              alt={pro.name}
              style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${isSports ? GOLD : "#e5e7eb"}` }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
              background: isSports ? `linear-gradient(135deg, ${GOLD}, rgba(201,168,76,0.6))` : "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: isSports ? "#000" : "#6b7280",
              border: `2px solid ${isSports ? GOLD : "#e5e7eb"}`,
            }}>
              {pro.name.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: isSports ? "#fff" : "#1a1a1a", margin: "0 0 4px", lineHeight: 1.2 }}>
              {pro.name}
            </h3>
            <span style={{
              display: "inline-block",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: isSports ? GOLD : "#6b7280",
              background: isSports ? "rgba(201,168,76,0.12)" : "#f3f4f6",
              border: `1px solid ${isSports ? "rgba(201,168,76,0.3)" : "#e5e7eb"}`,
              padding: "2px 8px", borderRadius: 99,
            }}>
              {pro.specialty}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={11} style={{ fill: n <= Math.round(pro.rating) ? "#facc15" : "none", color: n <= Math.round(pro.rating) ? "#facc15" : "#d1d5db" }} />
              ))}
              <span style={{ fontSize: 11, color: isSports ? "#a0a0a0" : "#9ca3af", marginLeft: 2 }}>
                {pro.rating} ({pro.reviewCount})
              </span>
            </div>
          </div>
        </div>

        {pro.bio && (
          <p style={{ fontSize: 13, color: isSports ? "#9ca3af" : "#6b7280", lineHeight: 1.6, margin: "0 0 12px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {pro.bio}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: isSports ? "#a0a0a0" : "#6b7280" }}>
            <DollarSign size={14} color={GOLD} />
            <span style={{ fontWeight: 700, color: isSports ? GOLD : "#1a1a1a" }}>${pro.hourlyRate}/hr</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: isSports ? "#a0a0a0" : "#6b7280" }}>
            <Clock size={14} color={isSports ? GOLD : "#9ca3af"} />
            <span>60–90 min sessions</span>
          </div>
        </div>

        {pro.services?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
            {pro.services.slice(0, 4).map((s: string) => (
              <span key={s} style={{
                fontSize: 10, fontWeight: 700,
                background: isSports ? "rgba(201,168,76,0.10)" : "#f3f4f6",
                color: isSports ? GOLD : "#374151",
                border: `1px solid ${isSports ? "rgba(201,168,76,0.25)" : "#e5e7eb"}`,
                padding: "3px 8px", borderRadius: 99,
              }}>
                {s}
              </span>
            ))}
            {pro.services.length > 4 && (
              <span style={{ fontSize: 10, color: isSports ? "#a0a0a0" : "#9ca3af", padding: "3px 4px" }}>
                +{pro.services.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "0 20px 20px", marginTop: "auto" }}>
        {pro.isAvailable ? (
          <Link href={`/book/${pro.id}`}>
            <button style={{
              width: "100%", padding: "11px 0",
              background: isSports ? GOLD : BLACK,
              color: isSports ? "#000" : "#fff",
              border: "none", borderRadius: 8,
              fontWeight: 800, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "opacity 0.15s",
            }}>
              <Calendar size={15} /> Book Session
            </button>
          </Link>
        ) : (
          <button disabled style={{
            width: "100%", padding: "11px 0",
            background: isSports ? "rgba(201,168,76,0.08)" : "#f3f4f6",
            color: isSports ? "rgba(201,168,76,0.4)" : "#9ca3af",
            border: `1px solid ${isSports ? "rgba(201,168,76,0.15)" : "#e5e7eb"}`,
            borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "not-allowed",
          }}>
            Currently Unavailable
          </button>
        )}
      </div>
    </div>
  );
}

export function BookAPro() {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_OPTION);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const specialtyParam = selectedCategory === ALL_OPTION ? undefined : selectedCategory;
  const { data: professionals, isLoading } = useListProfessionals(
    specialtyParam ? { specialty: specialtyParam } : undefined,
  );

  const allPros: any[] = professionals ?? [];
  const sportsPros = allPros.filter(p => p.specialty === SPORTS_CATEGORY_KEY);
  const otherPros = allPros.filter(p => p.specialty !== SPORTS_CATEGORY_KEY);

  const showSportsBanner = selectedCategory === ALL_OPTION || selectedCategory === SPORTS_CATEGORY_KEY;
  const showSportsSection = showSportsBanner && sportsPros.length > 0;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#fff" }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ background: BLACK, borderBottom: "2px solid #1a1a1a" }}>
        <div style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 72px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)", padding: "7px 18px", borderRadius: 99 }}>
              <Users size={13} color={GOLD} />
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Book A Professional</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(34px, 6vw, 58px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 16px", fontFamily: "'Playfair Display',serif" }}>
              Connect With <span style={{ color: GOLD }}>NFGN Experts</span>
            </h1>
            <p style={{ color: "#a0a0a0", fontSize: 18, maxWidth: 520, margin: "0 auto 32px" }}>
              Schedule sessions with certified naturopaths, coaches, sports professionals, ministers, and more.
            </p>

            {/* ── Category Filter Dropdown ─── */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(201,168,76,0.4)",
                    color: "#fff", padding: "12px 20px", borderRadius: 10,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    minWidth: 280, justifyContent: "space-between",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Filter size={15} color={GOLD} />
                    {selectedCategory === ALL_OPTION ? "Filter by Category" : selectedCategory}
                  </span>
                  <ChevronDown size={15} color={GOLD} style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "#1a1a1a", border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                    zIndex: 50, overflow: "hidden", maxHeight: 340, overflowY: "auto",
                  }}>
                    {CATEGORY_OPTIONS.map((cat, idx) => {
                      const isSportsOpt = cat === SPORTS_CATEGORY_KEY;
                      const isSelected = selectedCategory === cat;
                      const isAll = cat === ALL_OPTION;
                      return (
                        <button
                          key={cat}
                          onClick={() => { setSelectedCategory(cat); setDropdownOpen(false); }}
                          style={{
                            width: "100%", textAlign: "left",
                            padding: "11px 16px",
                            display: "flex", alignItems: "center", gap: 9,
                            background: isSelected ? "rgba(201,168,76,0.15)" : isSportsOpt ? "rgba(201,168,76,0.06)" : "transparent",
                            color: isSelected ? GOLD : isSportsOpt ? GOLD : "#d1d5db",
                            fontWeight: isSelected || isSportsOpt ? 800 : 500,
                            fontSize: 13, cursor: "pointer", border: "none",
                            borderBottom: isSportsOpt && !isAll ? "1px solid rgba(201,168,76,0.2)" : idx < CATEGORY_OPTIONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          }}
                        >
                          {isSportsOpt && <Trophy size={13} color={GOLD} />}
                          {cat}
                          {isSportsOpt && (
                            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 900, background: GOLD, color: "#000", padding: "2px 6px", borderRadius: 99, letterSpacing: "0.1em" }}>
                              SPORTS
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NFGN SPORTS Professionals Banner (when viewing All or Sports) ── */}
      {showSportsBanner && (
        <div style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)", padding: "48px 24px", borderBottom: `3px solid ${GOLD}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.03) 39px, rgba(201,168,76,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.03) 39px, rgba(201,168,76,0.03) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -60, right: "6%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.10), transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", padding: "5px 14px", borderRadius: 99 }}>
                  <Trophy size={12} color={GOLD} />
                  <span style={{ color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase" }}>NFGN SPORTS PROFESSIONALS</span>
                </div>
                <h2 style={{ color: "#fff", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, margin: "0 0 10px", fontFamily: "serif", lineHeight: 1.1 }}>
                  Elite Sports Pros. <span style={{ color: GOLD }}>Ready to Train.</span>
                </h2>
                <p style={{ color: "#a0a0a0", fontSize: 15, maxWidth: 480, margin: "0 0 20px" }}>
                  Coaches, trainers, speakers, and medical sports professionals — all powered by the NFGN Sports network.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SPORTS_ROLES.map(r => (
                    <span key={r.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.22)", color: GOLD, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>
                      {r.icon} {r.label}
                    </span>
                  ))}
                </div>
              </div>
              {selectedCategory !== SPORTS_CATEGORY_KEY && (
                <button
                  onClick={() => setSelectedCategory(SPORTS_CATEGORY_KEY)}
                  style={{ background: GOLD, color: "#000", border: "none", borderRadius: 8, padding: "12px 22px", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  <Trophy size={14} /> View Sports Pros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Professional Listings ──────────────────────────── */}
      <div style={{ background: "#f9f9f9", padding: "60px 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Section heading */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 4px" }}>
                {selectedCategory === ALL_OPTION ? "All Professionals" : selectedCategory}
              </p>
              <h2 style={{ color: "#1a1a1a", fontSize: 26, fontWeight: 900, margin: 0, fontFamily: "serif" }}>
                {selectedCategory === ALL_OPTION ? "Find Your Professional" : selectedCategory}
              </h2>
            </div>
            {!isLoading && allPros.length > 0 && (
              <span style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)", color: GOLD, fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 99 }}>
                {allPros.length} {allPros.length === 1 ? "professional" : "professionals"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: 20, height: 280, opacity: 0.5, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : allPros.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15, color: GOLD }}>✦</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>No professionals found</h3>
              <p style={{ color: "#6b7280" }}>
                {selectedCategory !== ALL_OPTION ? `No professionals registered under "${selectedCategory}" yet.` : "Check back soon — professionals are being onboarded."}
              </p>
              {selectedCategory !== ALL_OPTION && (
                <button
                  onClick={() => setSelectedCategory(ALL_OPTION)}
                  style={{ marginTop: 16, background: GOLD, color: "#000", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                >
                  View All Professionals
                </button>
              )}
            </div>
          ) : (
            <>
              {/* SPORTS PROS first when viewing "All" */}
              {showSportsSection && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)", padding: "4px 12px", borderRadius: 99 }}>
                      <Trophy size={11} color={GOLD} />
                      <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>NFGN SPORTS Professionals</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" style={{ marginBottom: 48 }}>
                    {sportsPros.map(pro => <ProCard key={pro.id} pro={pro} />)}
                  </div>
                  {otherPros.length > 0 && (
                    <div style={{ marginBottom: 20, paddingTop: 8, borderTop: "2px solid #e5e7eb" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "4px 12px", borderRadius: 99, marginTop: 20 }}>
                        <Users size={11} color="#6b7280" />
                        <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>All Other Professionals</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Regular pros (or all if filtered to a non-sports category) */}
              {(showSportsSection ? otherPros : allPros).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(showSportsSection ? otherPros : allPros).map(pro => <ProCard key={pro.id} pro={pro} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
