import { Request } from "express";

export type AuthRequestType = {
  user?: any;
} & Request;
