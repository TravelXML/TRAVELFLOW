import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { env, providers } from "../../config/env";
import { logger } from "../../utils/logger";

export interface StorageProvider {
  upload(key: string, body: Buffer, contentType: string): Promise<string>;
}

const UPLOADS_DIR = path.join(__dirname, "..", "..", "..", "uploads");

class LocalStorageProvider implements StorageProvider {
  async upload(key: string, body: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(UPLOADS_DIR, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
    logger.info(`Stored file locally at uploads/${key}`);
    return `/uploads/${key}`;
  }
}

class S3StorageProvider implements StorageProvider {
  private client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET!,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }
}

export const storageProvider: StorageProvider = providers.hasS3 ? new S3StorageProvider() : new LocalStorageProvider();
export { UPLOADS_DIR };
