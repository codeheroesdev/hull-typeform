import Hull from "hull";
import bodyParser from "body-parser";
import cors from "cors";
import _ from "lodash";
import moment from "moment";
import Promise from "bluebird";
import striptags from "striptags";

import WebApp from "./util/app/web";
import StaticRouter from "./util/router/static";
import tokenMiddleware from "./util/middleware/token";
import HullAgent from "./util/hull-agent";
import TypeformClient from "./lib/typeform-client";
import InstrumentationAgent from "./util/instrumentation-agent";
import SyncAgent from "./lib/sync-agent";

const port = process.env.PORT;
if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

const hullMiddleware = Hull.Middleware({ hostSecret: process.env.SECRET, cacheShip: false });

const app = WebApp();

app.use("/", StaticRouter({ Hull }));

app.post("/fetch", tokenMiddleware, bodyParser.urlencoded({ extended: false }), hullMiddleware, (req, res) => {
  const instrumentationAgent = new InstrumentationAgent();
  const typeformClient = new TypeformClient(req.hull, instrumentationAgent);
  const hullAgent = new HullAgent(req);
  const syncAgent = new SyncAgent(req, hullAgent);

  if (!typeformClient.ifConfigured()) {
    return res.end("ok");
  }

  const since = req.hull.ship.private_settings.last_fetch_at || moment().subtract(1, "day").format("X");
  const typeformUid = req.hull.ship.private_settings.typeform_uid;

  if (!typeformUid) {
    return res.end("ok");
  }

  req.hull.client.logger.info("fetch.since", moment(since, "X").format());

  return typeformClient.get(`/form/${typeformUid}`)
    .query({
      completed: true,
      order_by: "date_submit",
      since
    })
    .catch(typeformClient.handleError)
    .then(({ body }) => {
      instrumentationAgent.metricInc("ship.incoming.usersData", body.responses.length, req.hull.client.configuration());
      req.hull.client.logger.debug("ship.incoming.usersData", body.responses.length);
      return Promise.all(_.map(body.responses, response => {
        const ident = syncAgent.getIdent(response);
        const traits = syncAgent.getTraits(response);
        const eventProps = syncAgent.getEventProps(response, typeformUid, body.questions);
        const eventContext = syncAgent.getEventContext(response);

        if (!ident.email) {
          req.hull.client.logger.debug("ship.incoming.user.skip", { ident, traits });
          return null;
        }

        instrumentationAgent.metricInc("ship.incoming.users", req.hull.client.configuration());
        req.hull.client.logger.debug("ship.incoming.user", { ident, traits });
        req.hull.client.logger.debug("ship.incoming.event", "Form Submitted", eventProps, eventContext);

        return Promise.all([
          req.hull.client
          .as(ident)
          .traits(traits),
          req.hull.client
          .as(ident)
          .track("Form Submitted", eventProps, eventContext)
        ]);
      }));
    })
    .then(() => {
      res.end("ok");
      return hullAgent.updateShipSettings({
        last_fetch_at: moment().format("X")
      });
    })
    .catch(err => {
      console.error(err);
      req.hull.client.logger.error("fetch.error", err);
      res.end("err");
    });
});


app.get("/schema/typeforms", cors(), tokenMiddleware, hullMiddleware, (req, res) => {
  const instrumentationAgent = new InstrumentationAgent();
  const typeformClient = new TypeformClient(req.hull, instrumentationAgent);

  if (!typeformClient.ifConfigured()) {
    return res.json({ options: [] });
  }

  return typeformClient.get("/forms")
    .then(({ body: forms }) => {
      res.json({
        options: forms.map(f => {
          return { label: f.name, value: f.id };
        })
      });
    })
    .catch(() => {
      res.json({ options: [] });
    });
});

app.get("/schema/questions", cors(), tokenMiddleware, hullMiddleware, (req, res) => {
  const instrumentationAgent = new InstrumentationAgent();
  const typeformClient = new TypeformClient(req.hull, instrumentationAgent);

  if (!req.hull.ship.private_settings.typeform_uid
      || !typeformClient.ifConfigured()) {
    return res.json({
      options: []
    });
  }

  const typeformUid = req.hull.ship.private_settings.typeform_uid;

  return typeformClient.get(`/form/${typeformUid}`)
    .then(({ body }) => {
      res.json({
        options: body.questions.map(f => {
          return { label: striptags(f.question), value: f.id };
        })
      });
    })
    .catch(() => {
      res.json({ options: [] });
    });
});

app.listen(port, () => {
  Hull.logger.info("webApp.listen", port);
});
