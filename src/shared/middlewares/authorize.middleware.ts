/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { envVars } from "../../config/env";
import { AppError } from "../errors/app-error";
import { cookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";
import { prisma } from "../../database/prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";

export const authorize =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //Session Token Verification
      let sessionToken = cookieUtils.getCookie(
        req,
        "better-auth.session_token",
      );

      // Fallback to Authorization header if cookie is missing
      if (!sessionToken && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          sessionToken = authHeader.substring(7);
        }
      }

      if (!sessionToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No session token provided.",
        );
      }

      if (sessionToken) {
        const sessionExists = await prisma.session.findFirst({
          where: {
            token: sessionToken,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            user: true,
          },
        });

        if (sessionExists && sessionExists.user) {
          const user = sessionExists.user;

          const now = new Date();
          const expiresAt = new Date(sessionExists.expiresAt);
          const createdAt = new Date(sessionExists.createdAt);

          const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
          const timeRemaining = expiresAt.getTime() - now.getTime();
          const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

          if (percentRemaining < 20) {
            res.setHeader("X-Session-Refresh", "true");
            res.setHeader("X-Session-Expires-At", expiresAt.toISOString());
            res.setHeader("X-Time-Remaining", timeRemaining.toString());

            console.log("Session Expiring Soon!!");
          }

          if (
            user.status === UserStatus.BLOCKED ||
            user.status === UserStatus.DELETED
          ) {
            throw new AppError(
              status.UNAUTHORIZED,
              "Unauthorized access! User is not active.",
            );
          }

          if (user.isDeleted) {
            throw new AppError(
              status.UNAUTHORIZED,
              "Unauthorized access! User is deleted.",
            );
          }

          if (authRoles.length > 0 && !authRoles.includes(user.role)) {
            throw new AppError(
              status.FORBIDDEN,
              "Forbidden access! You do not have permission to access this resource.",
            );
          }

          req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };

          return next();
        }
      }

      //Access Token Verification
      let accessToken = cookieUtils.getCookie(req, "accessToken");

      // Fallback to Authorization header if cookie is missing
      if (!accessToken && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          accessToken = authHeader.substring(7);
        }
      }

      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No access token provided.",
        );
      }

      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET,
      );

      if (!verifiedToken.success) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! Invalid access token.",
        );
      }

      if (
        authRoles.length > 0 &&
        !authRoles.includes(verifiedToken.data!.role)
      ) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden access! You do not have permission to access this resource.",
        );
      }

      if (!req.user) {
        const tokenData = verifiedToken.data!;

        req.user = {
          id: String(tokenData.userId || tokenData.id || ""),
          name: String(tokenData.name || ""),
          email: String(tokenData.email || ""),
          role: (tokenData.role as Role) || Role.USER,
        };
      }

      if (!req.user?.id) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! User information is missing in the token.",
        );
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let sessionToken = cookieUtils.getCookie(req, "better-auth.session_token");
    if (!sessionToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.substring(7);
      }
    }

    if (sessionToken) {
      const sessionExists = await prisma.session.findFirst({
        where: {
          token: sessionToken,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (sessionExists && sessionExists.user) {
        const user = sessionExists.user;
        if (user.status === UserStatus.ACTIVE && !user.isDeleted) {
          req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
          return next();
        }
      }
    }

    // Try JWT Access Token if session failed
    let accessToken = cookieUtils.getCookie(req, "accessToken");
    if (!accessToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.substring(7);
      }
    }

    if (accessToken) {
      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET,
      );

      if (verifiedToken.success) {
        const tokenData = verifiedToken.data!;
        req.user = {
          id: String(tokenData.userId || tokenData.id || ""),
          name: String(tokenData.name || ""),
          email: String(tokenData.email || ""),
          role: (tokenData.role as Role) || Role.USER,
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we just continue even if tokens are malformed
    next();
  }
};
