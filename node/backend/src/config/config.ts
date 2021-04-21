import * as dotenv from 'dotenv';
dotenv.config();

export default {
  PORT: process.env.PORT || '3000',
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || undefined,
  AWS_SECRET: process.env.AWS_SECRET || undefined,
  FRONTEND_REL_PATH: process.env.MODE === "production" ? "../../../../frontend/dist" : "../../frontend/dist",

  PDF_BUCKET: process.env.PDF_BUCKET,
  PDF_RENDERS_BUCKET: process.env.PDF_RENDERS_BUCKET,

  SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
  DEBUG_SQS_ENDPOINT_URL: process.env.DEBUG_SQS_ENDPOINT_URL,
  DEBUG_SQS_SSL_ENABLED: process.env.DEBUG_SQS_SSL_ENABLED,

  MQ_URL: process.env.MQ_URL || "ws://mq:61614",
  MQ_USERNAME: process.env.MQ_USERNAME || 'admin',
  MQ_PASSWORD: process.env.MQ_PASSWORD || 'admin',

  INIT_SUPERUSER_EMAIL: process.env.INIT_SUPERUSER_EMAIL || 'info@h2xengineering.com',
};
