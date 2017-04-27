/* global describe, it */
const assert = require("assert");

import Hull from "hull";
import express from "express";
import nock from "nock";
import request from "request";
import cheerio from "cheerio";
import ClientMock from "./mocks/client-mock";
import Server from "../server/server";


const port = 8080;
const app = express();

const connector = new Hull.Connector({ port, hostSecret: "123" });
const options = { connector, app };


connector.setupApp(app);
const typeform_uid = "54321";
app.use((req, res, next) => {
  req.hull.client = ClientMock();
  req.hull.ship = {
    private_settings: {
      api_key: "12345",
      typeform_uid
    }
  };

  next();
});

connector.startApp(Server(options));

const typeformAllFormsMock =
  nock("https://api.typeform.com/v1")
    .get("/forms")
    .query(true)
    .reply(200, [
      {
        name: "name1",
        id: "123"
      },
      {
        name: "name2",
        id: 124
      }
    ]);

const typeformSingleFormMock =
  nock("https://api.typeform.com/v1")
    .get(`/form/${typeform_uid}`)
    .query(true)
    .reply(200, {
      stats: {
        responses: {
          completed: 12
        }
      }
    });

describe("Server", () => {
  describe("for /schema/typeforms", () => {
    it("should connect with typeform API and return status OK.", (done) => {
      request
        .get("http://127.0.0.1:8080/schema/typeforms")
        .on("response", (response) => {
          assert(response.statusCode === 200);
          typeformAllFormsMock.done();
          done();
        });
    });
  });

  describe("for /admin", () => {
    it("should connect with typeform API and return status OK with rendered admin.html file", (done) => {
      let body;

      request
        .get("http://127.0.0.1:8080/admin")
        .on("response", (response) => {
          assert(response.statusCode === 200);
          typeformSingleFormMock.done();
        })
        .on("data", (data) => {
          body += data;
        });

      setTimeout(() => {
        const $ = cheerio.load(body);
        assert($($(".text-center").children().get(1)).text().includes("Completed Form Submissions: 12"));
        done();
      }, 100);
    });
  });
});
