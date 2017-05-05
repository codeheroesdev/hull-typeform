/* @flow */
import { Request, Response, Next } from "express";
import TypeformClient from "./typeform-client";
import SyncAgent from "./sync-agent";

export default function appMiddleware(req: Request, res: Response, next: Next) {
  if (req.hull) {
    const typeformClient = new TypeformClient(req.hull);
    const syncAgent = new SyncAgent(req.hull);

    req.shipApp = req.shipApp || {
      typeformClient,
      syncAgent
    };
  }
  return next();
}
