import * as dotenv from 'dotenv';
dotenv.config();

export default {
  PORT: process.env.PORT || '3000',

  FRONTEND_REL_PATH: process.env.MODE === "production" ? "../../../../frontend/dist" : "../../frontend/dist",

  PDF_BUCKET: process.env.PDF_BUCKET,
  PDF_RENDERS_BUCKET: process.env.PDF_RENDERS_BUCKET,

  SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
  DEBUG_SQS_ENDPOINT_URL: process.env.DEBUG_SQS_ENDPOINT_URL,
  DEBUG_SQS_SSL_ENABLED: process.env.DEBUG_SQS_SSL_ENABLED,

  MQ_URL: process.env.MQ_URL || "ws://localhost:61614",
  MQ_USERNAME: process.env.MQ_USERNAME || 'admin',
  MQ_PASSWORD: process.env.MQ_PASSWORD || 'admin',

  INIT_SUPERUSER_EMAIL: process.env.INIT_SUPERUSER_EMAIL || 'test@h2xtesting.com',

  WEBHOOK_ZAPIER_CREATE_HUBSPOT_CONTACT: process.env.WEBHOOK_ZAPIER_CREATE_HUBSPOT_CONTACT,

  DEFAULT_EMAIL_FROM: process.env.EMAIL_ADDRESS || 'test@h2xtesting.com',
  NEW_MEMBERS_EMAIL: process.env.NEW_MEMBERS_EMAIL || 'test+local.newmembers@h2xtesting.com',
  FEEDBACK_EMAIL: process.env.FEEDBACK_EMAIL || 'test+local.feedback@h2xtesting.com',
  BUGS_EMAIL: process.env.BUGS_EMAIL || 'test+local.bugs@h2xtesting.com',
};
