import HullAgent from "../util/hull-agent";
import TypeformClient from "./typeform-client";
import InstrumentationAgent from "../util/instrumentation-agent";
import SyncAgent from "./sync-agent";

export default function appMiddleware(req, res, next) {
  if (req.hull) {
    const instrumentationAgent = new InstrumentationAgent();
    const typeformClient = new TypeformClient(req.hull, instrumentationAgent);
    const hullAgent = new HullAgent(req);
    const syncAgent = new SyncAgent(req, hullAgent);

    req.shipApp = req.shipApp || {
      instrumentationAgent,
      typeformClient,
      hullAgent,
      syncAgent,
      hullClient: req.hull.client
    };
  }
  return next();
}
