/* eslint-disable @typescript-eslint/no-unused-vars */
import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../../config/env";
import { AppError } from "../errors/app-error";

const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  secure: true,
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS,
  },
  port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("[Email Service] SMTP connection failed:", error);
  } else {
    console.log("[Email Service] SMTP connection verified successfully");
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, string | number | boolean | object>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  subject,
  templateData,
  templateName,
  to,
  attachments,
}: SendEmailOptions) => {
  try {
    console.log(
      `[Email Service] Starting to send email to ${to} with template: ${templateName}`,
    );

    // Resolve template path
    const templatePath = path.resolve(
      process.cwd(),
      `src/templates/${templateName}.ejs`,
    );

    console.log(`[Email Service] Template path: ${templatePath}`);

    const td = templateData as Record<string, unknown>;
    const expiresVal =
      td && Object.prototype.hasOwnProperty.call(td, "expiresInMinutes")
        ? td["expiresInMinutes"]
        : undefined;
    const expiresInMinutes = typeof expiresVal === "number" ? expiresVal : 5;

    const templateDataWithDefaults: Record<string, unknown> = {
      appName: envVars.APP_NAME ?? "NutriSync",
      supportEmail: envVars.EMAIL_SENDER.SMTP_FROM ?? "support@nutrisync.com",
      year: new Date().getFullYear(),
      expiresInMinutes,
      logoUrl: "https://i.ibb.co.com/tPNJMm63/Nutri-Sync-Photoroom.png",
      ...td,
    };

    console.log(`[Email Service] Template data prepared:`, {
      appName: templateDataWithDefaults.appName,
      expiresInMinutes: templateDataWithDefaults.expiresInMinutes,
      hasOtp: !!templateDataWithDefaults.otp,
    });

    // Render template with EJS
    const html = await ejs.renderFile(templatePath, templateDataWithDefaults);

    console.log(`[Email Service] Template rendered successfully`);

    // Send email
    const result = await transporter.sendMail({
      from: envVars.EMAIL_SENDER.SMTP_FROM,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    console.log(`[Email Service] Email sent successfully to ${to}`, {
      messageId: result.messageId,
      response: result.response,
    });

    return result;
  } catch (error) {
    console.error(`[Email Service] Error sending email to ${to}:`, error);

    // Provide more detailed error message
    let errorMessage = `Failed to send email to ${to}`;

    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
      console.error(`[Email Service] Stack trace:`, error.stack);
    }

    throw new AppError(status.INTERNAL_SERVER_ERROR, errorMessage);
  }
};

// Health check function to test email service
export const testEmailConnection = async () => {
  try {
    console.log("[Email Service] Testing SMTP connection...");

    const testResult = await transporter.verify();

    if (testResult) {
      console.log("[Email Service] SMTP connection test successful ✓");
      return { success: true, message: "SMTP connection verified" };
    } else {
      console.error("[Email Service] SMTP connection test failed");
      return { success: false, message: "SMTP connection failed" };
    }
  } catch (error) {
    console.error("[Email Service] SMTP connection test error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
