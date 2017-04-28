/* @flow */
import Hull from "hull";
import express from "express";
import Server from "./server";

const { PORT = 8082, SECRET, LOG_LEVEL } = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

const app = express();
const connector = new Hull.Connector({ port: PORT, hostSecret: SECRET });

connector.setupApp(app);

connector.startApp(Server({ connector, app }));
