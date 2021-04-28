"use strict";
const nodemailer = require("nodemailer");
const aws = require("aws-sdk")

let sesClient;
const sesRegion = process.env.SES_EMAIL_REGION
if (sesRegion) {
  sesClient = new aws.SES( {region: sesRegion} )
} else {
  sesClient = new aws.SES()
}

export const NodeMailerTransporter = nodemailer.createTransport({
  SES: sesClient
});
