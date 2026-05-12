import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import { userService } from "./user.service";

const getMyStats = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserStats(req.user.id);
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: result,
  });
});

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getMe(req.user.id);
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.updateProfile(req.user.id, req.body);
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getMyAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserAnalytics(req.user.id);
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "User analytics retrieved",
    data: result,
  });
});

const updateHealthProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.updateHealthProfile(req.user.id, req.body);
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Health profile updated successfully",
    data: result,
  });
});

export const userController = {
  getMyStats,
  getProfile,
  updateMyProfile,
  getMyAnalytics,
  updateHealthProfile,
};
