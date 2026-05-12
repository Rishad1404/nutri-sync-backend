import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import { chatService } from "./chat.service";
import { chatMessageSchema } from "./chat.type";
import type { IRequestUser } from "../auth/auth.type";

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const payload = chatMessageSchema.shape.body.parse(req.body);

  const result = await chatService.processMessage(user, payload);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "AI responded successfully",
    data: result,
  });
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await chatService.getMyChatHistory(user);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Chat history fetched successfully",
    data: result,
  });
});

const clearHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  await chatService.clearMyChatHistory(user);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Chat history cleared successfully",
  });
});

export const chatController = {
  sendMessage,
  getHistory,
  clearHistory,
};
