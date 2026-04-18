import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, MapPin, Lightbulb, TrendingUp, Users } from "lucide-react";
import { customFetch } from "@/lib/custom-fetch";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Coordinate lookup for US states and world countries
const COORDS: Record<string, [number, number]> = {
  // US States
  "Alabama": [-86.79, 32.80], "Alaska": [-153.37, 61.37], "Arizona": [-111.09, 34.05],
  "Arkansas": [-92.20, 34.90], "California": [-119.42, 36.78], "Colorado": [-105.78, 39.55],
  "Connecticut": [-72.68, 41.60], "Delaware": [-75.51, 39.00], "Florida": [-81.52, 27.66],
  "Georgia": [-83.44, 32.16], "Hawaii": [-155.58, 19.90], "Idaho": [-114.74, 44.07],
  "Illinois": [-89.40, 40.63], "Indiana": [-86.13, 40.27], "Iowa": [-93.10, 42.01],
  "Kansas": [-98.48, 38.53], "Kentucky": [-84.27, 37.84], "Louisiana": [-91.96, 30.98],
  "Maine": [-69.38, 44.69], "Maryland": [-76.80, 39.05], "Massachusetts": [-71.38, 42.41],
  "Michigan": [-85.60, 44.31], "Minnesota": [-94.63, 46.73], "Mississippi": [-89.40, 32.74],
  "Missouri": [-92.29, 38.46], "Montana": [-110.45, 46.88], "Nebraska": [-99.90, 41.49],
  "Nevada": [-116.42, 38.80], "New Hampshire": [-71.57, 43.45], "New Jersey": [-74.41, 40.06],
  "New Mexico": [-106.02, 34.52], "New York": [-74.22, 42.17], "North Carolina": [-79.02, 35.76],
  "North Dakota": [-101.00, 47.53], "Ohio": [-82.91, 40.42], "Oklahoma": [-97.09, 35.47],
  "Oregon": [-120.55, 43.80], "Pennsylvania": [-77.19, 41.20], "Rhode Island": [-71.48, 41.70],
  "South Carolina": [-81.16, 33.84], "South Dakota": [-99.90, 44.30], "Tennessee": [-86.58, 35.52],
  "Texas": [-99.90, 31.97], "Utah": [-111.09, 39.32], "Vermont": [-72.71, 44.05],
  "Virginia": [-78.17, 37.77], "Washington": [-120.74, 47.75], "West Virginia": [-80.45, 38.65],
  "Wisconsin": [-88.79, 44.27], "Wyoming": [-107.55, 43.08], "Washington DC": [-77.04, 38.91],
  "DC": [-77.04, 38.91],
  // Countries
  "United States": [-95.71, 37.09], "Canada": [-106.35, 56.13], "Mexico": [-102.55, 23.63],
  "United Kingdom": [-3.44, 55.38], "England": [-1.17, 52.36], "Scotland": [-4.20, 56.49],
  "France": [2.21, 46.23], "Germany": [10.45, 51.17], "Spain": [-3.75, 40.46], "Italy": [12.57, 41.87],
  "Australia": [133.78, -25.27], "New Zealand": [174.89, -40.90], "Japan": [138.25, 36.20],
  "China": [104.20, 35.86], "India": [78.96, 20.59], "Brazil": [-51.93, -14.24],
  "Nigeria": [8.68, 9.08], "Ghana": [-1.02, 7.95], "South Africa": [22.94, -30.56],
  "Kenya": [37.91, -0.02], "Ethiopia": [40.49, 9.15], "Tanzania": [34.89, -6.37],
  "Jamaica": [-77.30, 18.11], "Trinidad": [-61.22, 10.69], "Barbados": [-59.54, 13.19],
  "Haiti": [-72.29, 18.97], "Dominican Republic": [-70.16, 18.74], "Bahamas": [-77.40, 25.03],
  "Guyana": [-58.93, 4.86], "Belize": [-88.50, 17.19], "Panama": [-80.78, 8.54],
  "Colombia": [-74.30, 4.57], "Venezuela": [-66.59, 6.42], "Ecuador": [-78.18, -1.83],
  "Peru": [-75.02, -9.19], "Chile": [-71.54, -35.68], "Argentina": [-63.62, -38.42],
  "Philippines": [121.77, 12.88], "Singapore": [103.82, 1.35], "Malaysia": [109.70, 4.21],
  "Indonesia": [117.87, -0.79], "South Korea": [127.77, 35.91], "Taiwan": [120.96, 23.70],
  "Saudi Arabia": [45.08, 23.89], "UAE": [53.85, 23.42], "Israel": [34.85, 31.05],
};

function getCoords(label: string, country: string): [number, number] | null {
  // Try exact match first
  if (COORDS[label]) return COORDS[label];
  // Try stripping city prefix "City, STATE" → state name
  const parts = label.split(", ");
  if (parts.length >= 2) {
    const state = parts[parts.length - 1].trim();
    // Try abbreviation → full name mapping
    const stateAbbrevMap: Record<string, string> = {
      "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
      "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
      "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
      "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
      "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
      "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire",
      "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina",
      "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania",
      "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee",
      "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
      "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "DC": "Washington DC",
    };
    const fullState = stateAbbrevMap[state] ?? state;
    if (COORDS[fullState]) return COORDS[fullState];
    if (COORDS[state]) return COORDS[state];
  }
  // Fall back to country
  if (COORDS[country]) return COORDS[country];
  return null;
}

function getMarketingSuggestions(locations: { label: string; count: number; country: string }[]): string[] {
  const suggestions: string[] = [];
  if (locations.length === 0) return ["Share your referral link on social media to attract your first community members!"];

  const top = locations[0];
  suggestions.push(`Your strongest market is ${top.label} with ${top.count} member${top.count > 1 ? "s" : ""}. Host a virtual or in-person wellness event there to deepen the community!`);

  const hasUS = locations.some(l => l.country === "United States" || l.label.includes(", "));
  const hasIntl = locations.some(l => l.country !== "United States" && l.country !== "");
  if (hasUS && !hasIntl) suggestions.push("Your community is primarily US-based. Expand globally — target the Caribbean, UK, and West Africa where naturopathic wellness is thriving!");
  if (hasIntl) suggestions.push("You have international members! Create region-specific social media groups to nurture each market in their local timezone.");

  if (locations.length < 3) suggestions.push("Only " + locations.length + " region" + (locations.length > 1 ? "s" : "") + " represented. Encourage members in " + top.label + " to share their referral links locally to multiply community growth.");
  else suggestions.push(`${locations.length} regions active! Consider a \"Top Recruiter\" leaderboard to spark friendly competition across your locations.`);

  suggestions.push("Share before-and-after wellness testimonials from members in each region — local success stories are the most powerful recruiting tool.");
  return suggestions.slice(0, 3);
}

interface LocationPoint {
  label: string;
  country: string;
  count: number;
  latestJoin: string;
}

export function MemberMapCard({ title = "Community World Map" }: { title?: string }) {
  const [tooltip, setTooltip] = useState<{ label: string; count: number; x: number; y: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard/member-locations"],
    queryFn: () => customFetch("/api/dashboard/member-locations").then(r => r.ok ? r.json() : { locations: [], total: 0 }),
    staleTime: 60_000,
  });

  const locations: LocationPoint[] = data?.locations ?? [];
  const total: number = data?.total ?? 0;

  const markers = locations
    .map(loc => ({ ...loc, coords: getCoords(loc.label, loc.country) }))
    .filter(loc => loc.coords !== null) as (LocationPoint & { coords: [number, number] })[];

  const suggestions = getMarketingSuggestions(locations);
  const maxCount = Math.max(...locations.map(l => l.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {total > 0
            ? `${total} member${total > 1 ? "s" : ""} across ${locations.length} location${locations.length > 1 ? "s" : ""}`
            : "No member location data yet — locations are captured at registration."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <>
            {/* World Map */}
            <div className="relative bg-blue-50/50 dark:bg-blue-950/20 rounded-xl overflow-hidden border" style={{ height: 220 }}>
              {tooltip && (
                <div
                  className="absolute z-10 bg-popover border shadow-lg rounded-lg px-3 py-2 text-xs pointer-events-none"
                  style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -110%)" }}
                >
                  <p className="font-bold text-foreground">{tooltip.label}</p>
                  <p className="text-muted-foreground">{tooltip.count} member{tooltip.count > 1 ? "s" : ""}</p>
                </div>
              )}
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 100, center: [10, 20] }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup zoom={1}>
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map(geo => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#e2e8f0"
                          stroke="#cbd5e1"
                          strokeWidth={0.3}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: "#cbd5e1" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>
                  {markers.map((loc) => {
                    const r = Math.max(5, Math.min(18, 5 + (loc.count / maxCount) * 13));
                    return (
                      <Marker
                        key={loc.label}
                        coordinates={loc.coords}
                        onMouseEnter={(e: React.MouseEvent) => {
                          const rect = (e.currentTarget as SVGElement).closest("svg")?.getBoundingClientRect();
                          const svgRect = (e.currentTarget as SVGElement).getBoundingClientRect();
                          if (rect) {
                            setTooltip({
                              label: loc.label,
                              count: loc.count,
                              x: svgRect.left - rect.left + svgRect.width / 2,
                              y: svgRect.top - rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <circle
                          r={r}
                          fill="#C9A84C"
                          fillOpacity={0.8}
                          stroke="#92400e"
                          strokeWidth={1.5}
                          style={{ cursor: "pointer" }}
                        />
                        {loc.count > 1 && (
                          <text
                            y={4}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize={r > 9 ? 9 : 7}
                            fontWeight="700"
                            pointerEvents="none"
                          >
                            {loc.count}
                          </text>
                        )}
                      </Marker>
                    );
                  })}
                </ZoomableGroup>
              </ComposableMap>

              {total === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-xl">
                  <MapPin className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground text-center px-4">Member locations will appear here as people join with their city & country.</p>
                </div>
              )}
            </div>

            {/* Location list */}
            {locations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Locations</p>
                <div className="space-y-1.5">
                  {locations.slice(0, 6).map((loc, i) => (
                    <div key={loc.label} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground font-mono text-xs w-5 text-right">{i + 1}.</span>
                      <div className="flex-1 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="font-medium truncate">{loc.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-bold">
                        <Users className="h-2.5 w-2.5 mr-1" />
                        {loc.count}
                      </Badge>
                      <div className="w-20 bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${(loc.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {locations.length > 6 && (
                    <p className="text-xs text-muted-foreground pl-7">+ {locations.length - 6} more location{locations.length - 6 > 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>
            )}

            {/* Marketing Suggestions */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Growth Suggestions</p>
                <TrendingUp className="h-3.5 w-3.5 text-amber-600 ml-auto" />
              </div>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <span className="mt-0.5 font-bold text-amber-600 flex-shrink-0">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
