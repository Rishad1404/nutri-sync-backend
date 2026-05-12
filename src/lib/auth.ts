import { betterAuth } from "better-auth";
import { bearer, emailOTP } from "better-auth/plugins";
import { envVars } from "../config/env";
import { sendEmail } from "../shared/utils/email";
import { prisma } from "../database/prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Role, UserStatus } from "../generated/prisma/enums";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  trustedOrigins: [
    envVars.APP_URL!,
    envVars.FRONTEND_URL!,
    envVars.BETTER_AUTH_URL!,
    "http://localhost:3000",
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID as string,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
      prompt: "select_account consent",
      mapProfileToUser: () => {
        return {
          role: Role.USER,
          status: UserStatus.ACTIVE,
          needPasswordChange: false,
          emailVerified: true,
          isDeleted: false,
          deletedAt: null,
        };
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: Role.USER,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      needPasswordChange: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    },
  },
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        console.log(
          `[Better Auth] sendVerificationOTP called - Type: ${type}, Email: ${email}, OTP: ${otp}`,
        );

        try {
          if (type === "email-verification") {
            console.log(
              `[Better Auth] Processing email-verification for ${email}`,
            );

            const user = await prisma.user.findUnique({
              where: { email },
            });

            if (!user) {
              console.error(
                `[Better Auth] User not found with email: ${email}`,
              );
              return;
            }

            console.log(
              `[Better Auth] User found: ${user.name} (ID: ${user.id})`,
            );

            try {
              await sendEmail({
                to: email,
                subject: "Verify your email - NutriSync",
                templateName: "otp",
                templateData: {
                  userName: user.name || "User",
                  appName: envVars.APP_NAME || "NutriSync",
                  otp: otp,
                  expiresInMinutes: 5,
                  supportEmail:
                    envVars.EMAIL_SENDER.SMTP_FROM || "support@nutrisync.com",
                  logoUrl:
                    "https://i.ibb.co.com/tPNJMm63/Nutri-Sync-Photoroom.png",
                },
              });

              console.log(
                `[Better Auth] Verification email sent successfully to ${email}`,
              );
            } catch (emailError) {
              console.error(
                `[Better Auth] Failed to send verification email to ${email}:`,
                emailError,
              );
              throw emailError;
            }
          } else if (type === "forget-password") {
            console.log(
              `[Better Auth] Processing forget-password for ${email}`,
            );

            const user = await prisma.user.findUnique({
              where: { email },
            });

            if (!user) {
              console.error(
                `[Better Auth] User not found with email: ${email}`,
              );
              return;
            }

            console.log(
              `[Better Auth] User found for password reset: ${user.name} (ID: ${user.id})`,
            );

            try {
              await sendEmail({
                to: email,
                subject: "Reset your password - NutriSync",
                templateName: "otp",
                templateData: {
                  userName: user.name || "User",
                  appName: envVars.APP_NAME || "NutriSync",
                  otp: otp,
                  expiresInMinutes: 5,
                  supportEmail:
                    envVars.EMAIL_SENDER.SMTP_FROM || "support@nutrisync.com",
                  logoUrl:
                    "https://i.ibb.co.com/tPNJMm63/Nutri-Sync-Photoroom.png",
                },
              });

              console.log(
                `[Better Auth] Password reset email sent successfully to ${email}`,
              );
            } catch (emailError) {
              console.error(
                `[Better Auth] Failed to send password reset email to ${email}:`,
                emailError,
              );
              throw emailError;
            }
          } else {
            console.warn(`[Better Auth] Unknown OTP type: ${type}`);
          }
        } catch (error) {
          console.error(
            `[Better Auth] Error in sendVerificationOTP for ${email}:`,
            error,
          );
          // Don't throw - let registration complete even if email fails
        }
      },
      expiresIn: 5 * 60, // 5 minutes
      otpLength: 6,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24, // 1 day
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24, // 1 day
    },
  },
  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },
  advanced: {
    useSecureCookies: envVars.NODE_ENV === "production",
    cookies: {
      state: {
        attributes: {
          sameSite: envVars.NODE_ENV === "production" ? "none" : "lax",
          secure: envVars.NODE_ENV === "production",
          httpOnly: true,
          path: "/",
        },
      },
      sessionToken: {
        attributes: {
          sameSite: envVars.NODE_ENV === "production" ? "none" : "lax",
          secure: envVars.NODE_ENV === "production",
          httpOnly: true,
          path: "/",
        },
      },
    },
  },
});
