import { nanoid } from "nanoid";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { emailProvider } from "./providers/emailProvider";

export async function sendProposalEmail(params: {
  proposalId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  destinationName: string;
  pdfUrl: string;
  agencyName: string | null;
}): Promise<void> {
  const trackingPixelId = nanoid(16);
  const trackingPixel = `<img src="${env.PUBLIC_API_URL}/track/pixel/${trackingPixelId}" width="1" height="1" alt="" style="display:block" />`;
  const pdfLink = params.pdfUrl.startsWith("http") ? params.pdfUrl : `${env.PUBLIC_API_URL}${params.pdfUrl}`;

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #1a1a1a;">
        <h1>Your ${params.destinationName} Itinerary</h1>
        <p>Hi ${params.customerName},</p>
        <p>I've put together a personalized itinerary for your trip to ${params.destinationName}!</p>
        <p><a href="${pdfLink}" style="display:inline-block;padding:10px 20px;background:#1e90ff;color:#fff;border-radius:6px;text-decoration:none;">Download Your Proposal</a></p>
        <p>Let me know if you'd like any changes.</p>
        ${params.agencyName ? `<p style="color:#888;font-size:12px;">${params.agencyName}</p>` : ""}
        ${trackingPixel}
      </body>
    </html>
  `;

  const mailgunMessageId = await emailProvider.send(params.customerEmail, `Your ${params.destinationName} Itinerary`, html);

  await prisma.email.upsert({
    where: { proposalId: params.proposalId },
    create: {
      proposalId: params.proposalId,
      userId: params.userId,
      customerEmail: params.customerEmail,
      mailgunMessageId,
      trackingPixelId,
      sentAt: new Date(),
      deliveryStatus: "delivered",
    },
    update: {
      mailgunMessageId,
      trackingPixelId,
      sentAt: new Date(),
      deliveryStatus: "delivered",
    },
  });
}

export async function recordEmailOpen(trackingPixelId: string): Promise<void> {
  const email = await prisma.email.findUnique({ where: { trackingPixelId } });
  if (!email) return;

  const now = new Date();
  await prisma.email.update({
    where: { id: email.id },
    data: {
      openCount: { increment: 1 },
      firstOpenedAt: email.firstOpenedAt ?? now,
      lastOpenedAt: now,
    },
  });

  await prisma.proposal.updateMany({
    where: { id: email.proposalId, openedAt: null },
    data: { openedAt: now, status: "opened" },
  });
}
