/* @flow */
import cors from "cors";
import express from "express";
import * as actions from "./actions";
import appMiddleware from "./lib/app-middleware";

module.exports = function server(app: express): express {
  app.post("/fetch", appMiddleware, actions.fetch);
  app.post("/fetch-all", appMiddleware, actions.fetchAll);
  app.get("/admin", appMiddleware, actions.admin);
  app.get("/schema/typeforms", cors(), appMiddleware, actions.getForms);
  app.get("/schema/questions/:type?", cors(), appMiddleware, actions.getQuestions);
  return app;
};
