import Queue from "bull";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { sendProposalEmail } from "../services/emailService";

export interface SendProposalEmailJob {
  proposalId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  destinationName: string;
  pdfUrl: string;
  agencyName: string | null;
}

export const emailQueue = new Queue<SendProposalEmailJob>("proposal-emails", env.REDIS_URL);

emailQueue.process(async (job) => {
  logger.info(`Processing email job for proposal ${job.data.proposalId}`);
  await sendProposalEmail(job.data);
});

emailQueue.on("failed", (job, err) => {
  logger.error(`Email job for proposal ${job.data.proposalId} failed: ${err.message}`);
});
