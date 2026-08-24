import { ReactNode } from "react";
import { Activity, Flight, Hotel, TrackingLinkSummary } from "../../types";
import { Card, CardTitle } from "../common/Card";
import { Button } from "../common/Button";

interface Props {
  flight: Flight | null;
  hotel: Hotel | null;
  activities: Activity[];
  trackingLinks: TrackingLinkSummary[];
  isSent: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function BookButton({ href }: { href: string | undefined }) {
  if (!href) {
    return <span className="text-xs text-slate-400">Send the proposal to generate a bookable link</span>;
  }
  return (
    <a href={href} target="_blank" rel="noreferrer">
      <Button className="w-full">Book now</Button>
    </a>
  );
}

function ItemCard({ kind, children, bookHref }: { kind: string; children: ReactNode; bookHref: string | undefined }) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-slate-200 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{kind}</div>
      {children}
      <div className="mt-auto pt-2">
        <BookButton href={bookHref} />
      </div>
    </div>
  );
}

export function BookingSection({ flight, hotel, activities, trackingLinks, isSent }: Props) {
  if (!flight && !hotel && activities.length === 0) return null;

  const flightLink = trackingLinks.find((l) => l.itemType === "flight");
  const hotelLink = trackingLinks.find((l) => l.itemType === "hotel");
  const activityLink = (title: string) => trackingLinks.find((l) => l.itemType === "activity" && l.itemName === title);

  return (
    <Card>
      <CardTitle>Book this trip</CardTitle>
      <p className="mt-1 text-xs text-slate-400">
        {isSent ? "Links below are tracked - clicks and bookings show up on your dashboard." : "Recommended picks from the search results used to build this itinerary."}
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {(flight || hotel) && (
          <div className="flex flex-col gap-4 sm:flex-row">
            {flight && (
              <ItemCard kind="Flight" bookHref={flightLink?.shortUrl}>
                <div className="font-medium text-slate-900">{flight.airline}</div>
                <div className="text-sm text-slate-600">
                  {formatTime(flight.departure)} – {formatTime(flight.arrival)} &middot; {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop(s)`}
                </div>
                <div className="text-lg font-semibold text-slate-900">${flight.price.toLocaleString()}</div>
              </ItemCard>
            )}
            {hotel && (
              <ItemCard kind="Hotel" bookHref={hotelLink?.shortUrl}>
                <div className="font-medium text-slate-900">{hotel.name}</div>
                <div className="text-sm text-slate-600">
                  {hotel.address} &middot; ★ {hotel.rating}
                </div>
                <div className="text-xs text-slate-400">
                  {hotel.distanceFromCenterKm} km from center &middot; {hotel.distanceFromAirportKm} km from airport
                </div>
                <div className="text-lg font-semibold text-slate-900">${hotel.pricePerNight.toLocaleString()}/night</div>
              </ItemCard>
            )}
          </div>
        )}

        {activities.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">Activities</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activities.map((activity) => (
                <ItemCard key={activity.id} kind={`${activity.durationHours}h`} bookHref={activityLink(activity.title)?.shortUrl}>
                  <div className="font-medium text-slate-900">{activity.title}</div>
                  <div className="text-sm text-slate-600">★ {activity.rating}</div>
                  <div className="text-lg font-semibold text-slate-900">${activity.price.toLocaleString()}</div>
                </ItemCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
