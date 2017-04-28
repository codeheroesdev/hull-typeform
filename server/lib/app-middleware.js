import TypeformClient from "./typeform-client";
import SyncAgent from "./sync-agent";

export default function appMiddleware(req, res, next) {
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
