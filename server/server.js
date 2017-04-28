/* @flow */
import cors from "cors";
import bodyParser from "body-parser";
import * as actions from "./actions";
import appMiddleware from "./lib/app-middleware";

module.exports = function server({ connector, app }: any) {
  const middlewareSet = [connector.clientMiddleware(), appMiddleware];

  app.post("/fetch", bodyParser.urlencoded({ extended: true }), ...middlewareSet, actions.fetch);
  app.post("/fetch-all", bodyParser.urlencoded({ extended: true }), ...middlewareSet, actions.fetchAll);
  app.get("/admin", ...middlewareSet, actions.admin);
  app.get("/schema/typeforms", cors(), ...middlewareSet, actions.getForms);
  app.get("/schema/questions/:type?", cors(), ...middlewareSet, actions.getQuestions);

  return app;
};
