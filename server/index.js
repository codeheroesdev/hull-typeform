/* @flow */
import Hull from "hull";
import { Cache } from "hull/lib/infra";
import express from "express";
import server from "./server";

const { PORT = 8082, SECRET, LOG_LEVEL } = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

const cache = new Cache({
  store: "memory",
  ttl: 1
});

const app = express();
const connector = new Hull.Connector({ port: PORT, hostSecret: SECRET, cache });

connector.setupApp(app);
server(app);
connector.startApp(app);
