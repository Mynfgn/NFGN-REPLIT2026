import { useListProfessionals } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock, DollarSign, Loader2 } from "lucide-react";

export function BookAPro() {
  const { data: professionals, isLoading } = useListProfessionals();

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-foreground text-background py-20 px-4 text-center">
        <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 block">Book A Professional</span>
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Connect With Wellness Experts</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Schedule one-on-one sessions with certified naturopaths, ministers, and business coaches.
        </p>
      </section>

      <div className="container mx-auto px-4 py-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(professionals ?? []).map((pro: any) => (
              <div key={pro.id} className="bg-card border border-border hover:border-primary/50 transition-colors group flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex gap-4 mb-4">
                    {pro.avatar ? (
                      <img src={pro.avatar} alt={pro.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                        {pro.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-serif font-bold text-lg">{pro.name}</h3>
                      <Badge variant="outline" className="text-xs">{pro.specialty}</Badge>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-sm font-semibold">{pro.rating}</span>
                        <span className="text-xs text-muted-foreground">({pro.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">{pro.bio}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span>${pro.hourlyRate}/hour</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>60-90 min sessions</span>
                    </div>
                  </div>
                  {pro.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {pro.services.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-6 pt-0">
                  {pro.isAvailable ? (
                    <Link href={`/book/${pro.id}`}>
                      <Button className="w-full gap-2">
                        <Calendar className="h-4 w-4" />
                        Book Session
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" disabled>Currently Unavailable</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
