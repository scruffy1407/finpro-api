import { Request, Response, NextFunction } from "express";
import {
  Interview,
  InterviewStatus,
  UpdateStatusInterview,
} from "../../models/models";

export const validateInterviewData = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data: Interview = req.body as Interview;
  console.log(data);
  // Validate time consistency
  const startTime = new Date(data.interviewTimeStart);
  const endTime = new Date(data.interviewTimeEnd);

  // Validate non-empty fields
  if (
    !data.interviewDate ||
    !data.interviewTimeStart ||
    !data.interviewTimeEnd ||
    !data.interviewDescription
  ) {
    res.status(400).json({ error: "All fields are required" });
  } else if (startTime >= endTime) {
    res.status(400).json({ error: "Start time must be before end time" });
  } else {
    next();
  }
};

export const validateUpdateStatus = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data: UpdateStatusInterview = req.body as UpdateStatusInterview;
  if (!data.interviewStatus || !data.interviewId || !data.applicationId) {
    res.status(400).json({ error: "All fields are required" });
  } else if (data.interviewStatus !== InterviewStatus[data.interviewStatus]) {
    res.status(400).json({ error: "Error status" });
  } else {
    next();
  }
};
