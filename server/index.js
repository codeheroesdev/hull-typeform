import Hull from "hull";
import bodyParser from "body-parser";
import cors from "cors";

import express from "express";
import appMiddleware from "./lib/app-middleware";
import * as actions from "./actions";

const { PORT, hostSecret, LOG_LEVEL } = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL.LOG_LEVEL;
}

const app = express();
const connector = new Hull.Connector({ port: PORT, hostSecret });

connector.setupApp(app);

const middlewareSet = [connector.clientMiddleware(), appMiddleware];

app.post("/fetch", bodyParser.urlencoded({ extended: true }), ...middlewareSet, actions.fetch);
app.post("/fetch-all", bodyParser.urlencoded({ extended: true }), ...middlewareSet, actions.fetchAll);
app.get("/admin", ...middlewareSet, actions.admin);
app.get("/schema/typeforms", cors(), ...middlewareSet, actions.getForms);
app.get("/schema/questions/:type?", cors(), ...middlewareSet, actions.getQuestions);

connector.startApp(app);
