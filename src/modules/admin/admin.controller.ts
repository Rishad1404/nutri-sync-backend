import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import { adminService } from "./admin.service";

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllUsers();
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getPlatformStats();
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Platform statistics retrieved successfully",
    data: result,
  });
});

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status: userStatus } = req.body; // Expecting "ACTIVE", "BLOCKED", etc.

  const result = await adminService.updateUserStatus(id as string, userStatus);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: `User status updated to ${userStatus} successfully`,
    data: result,
  });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role: newRole } = req.body;

  const result = await adminService.updateUserRole(id as string, newRole);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: `User role has been successfully updated to ${newRole}`,
    data: result,
  });
});

const removeUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await adminService.deleteUser(id as string);
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const getSystemAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAdminAnalytics();
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Admin analytics retrieved",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await adminService.updateUser(id as string, req.body);
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "User details updated successfully",
    data: result,
  });
});

export const adminController = {
  getUsers,
  getStats,
  changeUserStatus,
  changeUserRole,
  removeUser,
  getSystemAnalytics,
  updateUser,
};
