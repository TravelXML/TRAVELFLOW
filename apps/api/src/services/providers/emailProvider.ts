import Mailgun from "mailgun.js";
// @ts-ignore -- mailgun.js ships its own form-data-less fetch client
import FormData from "form-data";
import fs from "fs/promises";
import path from "path";
import { env, providers } from "../../config/env";
import { logger } from "../../utils/logger";

export interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<string>;
}

const OUTBOX_DIR = path.join(__dirname, "..", "..", "..", "uploads", "outbox");

class ConsoleEmailProvider implements EmailProvider {
  async send(to: string, subject: string, html: string): Promise<string> {
    const messageId = `mock-${Date.now()}`;
    logger.info(`[MockEmail] Would send "${subject}" to ${to} (message id ${messageId})`);

    await fs.mkdir(OUTBOX_DIR, { recursive: true });
    await fs.writeFile(path.join(OUTBOX_DIR, `${messageId}.html`), html, "utf-8");

    return messageId;
  }
}

class MailgunEmailProvider implements EmailProvider {
  private client = new Mailgun(FormData).client({ username: "api", key: env.MAILGUN_API_KEY! });

  async send(to: string, subject: string, html: string): Promise<string> {
    try {
      const result = await this.client.messages.create(env.MAILGUN_DOMAIN!, {
        from: `TravelFlow <proposals@${env.MAILGUN_DOMAIN}>`,
        to,
        subject,
        html,
        "o:tracking": "yes",
        "o:tracking-opens": "yes",
        "o:tracking-clicks": "yes",
      });
      return result.id ?? `mailgun-${Date.now()}`;
    } catch (err) {
      logger.error(`Mailgun send failed, falling back to console email: ${(err as Error).message}`);
      return new ConsoleEmailProvider().send(to, subject, html);
    }
  }
}

export const emailProvider: EmailProvider = providers.hasMailgun ? new MailgunEmailProvider() : new ConsoleEmailProvider();
