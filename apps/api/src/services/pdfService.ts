import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { ItineraryJson } from "../types";
import { storageProvider } from "./providers/storageProvider";
import { logger } from "../utils/logger";

interface BookingLink {
  category: "flight" | "hotel" | "activity";
  label: string;
  price: number | null;
  bookUrl: string;
  note?: string;
}

let compiledTemplate: HandlebarsTemplateDelegate | null = null;

async function getTemplate(): Promise<HandlebarsTemplateDelegate> {
  if (!compiledTemplate) {
    const source = await fs.readFile(path.join(__dirname, "..", "templates", "proposal.hbs"), "utf-8");
    compiledTemplate = Handlebars.compile(source);
  }
  return compiledTemplate;
}

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateProposalPdf(params: {
  proposalId: string;
  itinerary: ItineraryJson;
  customerName: string;
  destination: string;
  numTravelers: number;
  numChildren: number;
  numSeniors: number;
  cabinClass: string;
  preferredAirlines: string[];
  accommodationType: string;
  numRooms: number;
  hotelAmbiance: string;
  specialOccasion: string;
  dietaryRestrictions: string[];
  accessibilityNeeds: string | null;
  agencyName: string | null;
  primaryColor: string;
  secondaryColor: string;
  bookingLinks: BookingLink[];
}): Promise<string> {
  const template = await getTemplate();
  const html = template({
    ...params.itinerary,
    customerName: params.customerName,
    destination: params.destination,
    numTravelers: params.numTravelers,
    agencyName: params.agencyName,
    primaryColor: params.primaryColor,
    secondaryColor: params.secondaryColor,
    flightLink: params.bookingLinks.find((l) => l.category === "flight") ?? null,
    hotelLink: params.bookingLinks.find((l) => l.category === "hotel") ?? null,
    activityLinks: params.bookingLinks.filter((l) => l.category === "activity"),
    tripDetails: [
      `${humanize(params.cabinClass)} flights`,
      params.preferredAirlines.length > 0 ? `Prefers ${params.preferredAirlines.join(", ")}` : null,
      `${humanize(params.accommodationType)} stay, ${params.numRooms} room(s)`,
      params.hotelAmbiance !== "any" ? `${humanize(params.hotelAmbiance)} ambiance` : null,
      params.numChildren > 0 ? `${params.numChildren} child(ren)` : null,
      params.numSeniors > 0 ? `${params.numSeniors} senior(s)` : null,
      params.specialOccasion !== "none" ? humanize(params.specialOccasion) : null,
      params.dietaryRestrictions.length > 0 ? params.dietaryRestrictions.map(humanize).join(", ") : null,
      params.accessibilityNeeds ? `Accessibility: ${params.accessibilityNeeds}` : null,
    ].filter(Boolean),
  });

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" } });

    const key = `proposals/${params.proposalId}-${Date.now()}.pdf`;
    const url = await storageProvider.upload(key, Buffer.from(pdfBuffer), "application/pdf");
    logger.info(`Generated PDF for proposal ${params.proposalId}`);
    return url;
  } finally {
    await browser.close();
  }
}
