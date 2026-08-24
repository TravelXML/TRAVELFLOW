import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProposal, useSendProposal } from "../hooks/useProposals";
import { extractErrorMessage } from "../lib/api";
import { Card, CardTitle } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { StatusBadge } from "../components/common/Badge";
import { BookingSection } from "../components/proposal/BookingSection";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api").replace(/\/api\/?$/, "");

function resolveUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: proposal, isLoading } = useProposal(id);
  const sendProposal = useSendProposal();
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!id) return;
    setError(null);
    try {
      await sendProposal.mutateAsync(id);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (isLoading || !proposal) {
    return <div className="text-sm text-slate-400">Loading proposal...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/proposals" className="text-sm text-slate-400 hover:text-slate-600">
            ← Back to proposals
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {proposal.customerName} &middot; {proposal.destinationName}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
            <StatusBadge status={proposal.status} />
            <span>
              {proposal.originName} → {proposal.destinationName}
            </span>
            <span>{proposal.customerEmail}</span>
            <span>
              {proposal.numAdults} adult(s){proposal.numChildren > 0 ? `, ${proposal.numChildren} child(ren)` : ""}
            </span>
            {proposal.budgetTotal && <span>Budget: ${proposal.budgetTotal.toLocaleString()}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {proposal.status === "draft" ? (
            <Button onClick={handleSend} isLoading={sendProposal.isPending}>
              Generate PDF & send email
            </Button>
          ) : (
            proposal.pdfUrl && (
              <a href={resolveUrl(proposal.pdfUrl)} target="_blank" rel="noreferrer">
                <Button variant="secondary">Download PDF</Button>
              </a>
            )
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          `${humanize(proposal.tripType)}, ${humanize(proposal.cabinClass)}`,
          proposal.directFlightsOnly ? "Direct flights only" : null,
          proposal.preferredAirlines.length > 0 ? `Prefers ${proposal.preferredAirlines.join(", ")}` : null,
          proposal.numSeniors > 0 ? `${proposal.numSeniors} senior(s)` : null,
          `${humanize(proposal.accommodationType)}, ${proposal.numRooms} room(s)`,
          proposal.hotelAmbiance !== "any" ? `${humanize(proposal.hotelAmbiance)} ambiance` : null,
          `Within ${proposal.maxDistanceFromCenterKm}km of center`,
          `Within ${proposal.maxDistanceFromAirportKm}km of airport`,
          proposal.priceRangeMin != null || proposal.priceRangeMax != null
            ? `$${proposal.priceRangeMin ?? 0}–$${proposal.priceRangeMax ?? "∞"}/night`
            : null,
          `${humanize(proposal.pace)} pace`,
          proposal.specialOccasion !== "none" ? humanize(proposal.specialOccasion) : null,
          ...proposal.dietaryRestrictions.map(humanize),
          proposal.accessibilityNeeds ? `Accessibility: ${proposal.accessibilityNeeds}` : null,
          ...proposal.preferences,
        ]
          .filter((chip): chip is string => Boolean(chip))
          .map((chip) => (
            <span key={chip} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {chip}
            </span>
          ))}
      </div>

      {proposal.specialRequests && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <span className="font-medium">Special requests:</span> {proposal.specialRequests}
        </div>
      )}

      <BookingSection
        flight={proposal.selectedFlight}
        hotel={proposal.selectedHotel}
        activities={proposal.selectedActivities}
        trackingLinks={proposal.trackingLinks}
        isSent={proposal.status !== "draft"}
      />

      {proposal.itineraryJson && (
        <Card>
          <CardTitle>{proposal.itineraryJson.title}</CardTitle>
          <p className="mt-2 text-sm text-slate-600">{proposal.itineraryJson.summary}</p>

          <div className="mt-6 flex flex-col gap-6">
            {proposal.itineraryJson.days.map((day) => (
              <div key={day.day}>
                <div className="mb-2 font-semibold text-slate-800">
                  Day {day.day}: {day.title}
                </div>
                <div className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {day.schedule.map((item, i) => (
                    <div key={i} className="flex gap-4 px-3 py-2 text-sm">
                      <span className="w-24 shrink-0 font-medium text-slate-500">{item.time}</span>
                      <span className="flex-1 text-slate-700">{item.activity}</span>
                      <span className="shrink-0 text-slate-400">{item.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4 text-lg font-semibold text-slate-900">
            Estimated total: ${proposal.itineraryJson.totalCost.toLocaleString()}
          </div>
        </Card>
      )}

      {proposal.trackingLinks.length > 0 && (
        <Card>
          <CardTitle>Tracking performance</CardTitle>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium">Program</th>
                <th className="pb-2 font-medium">Clicks</th>
                <th className="pb-2 font-medium">Conversions</th>
                <th className="pb-2 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {proposal.trackingLinks.map((link) => (
                <tr key={link.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{link.itemName}</td>
                  <td className="py-2 capitalize">{link.affiliateProgram}</td>
                  <td className="py-2">{link.clicks}</td>
                  <td className="py-2">{link.conversions}</td>
                  <td className="py-2">${link.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
