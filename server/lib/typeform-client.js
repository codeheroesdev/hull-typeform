import request from "superagent";
import prefixPlugin from "superagent-prefix";
import superagentPromisePlugin from "superagent-promise-plugin";
import _ from "lodash";
import Promise from "bluebird";

export default class TypeformClient {

  constructor(hull, instrumentationAgent) {
    this.apiKey = _.get(hull.ship, "private_settings.api_key");
    this.hull = hull;
    this.instrumentationAgent = instrumentationAgent;

    this.req = request;
  }

  ifConfigured() {
    return !_.isEmpty(this.apiKey);
  }

  attach(req) {
    if (!this.ifConfigured()) {
      throw new Error("Client access data not set!");
    }

    const preparedReq = req
      .use(prefixPlugin("https://api.typeform.com/v1"))
      .use(superagentPromisePlugin)
      .query({
        key: this.apiKey
      })
      .on("request", (reqData) => {
        this.hull.client.logger.info("REQ", reqData.method, reqData.url, reqData.qs);
        this.instrumentationAgent.metricInc("ship.service_api.call", 1, this.hull.client.configuration());
      });
      // .on("response", (res) => {});

    return preparedReq;
  }

  get(url) {
    const req = this.req.get(url);
    return this.attach(req);
  }

  post(url) {
    const req = this.req.post(url);
    return this.attach(req);
  }

  delete(url) {
    const req = this.req.delete(url);
    return this.attach(req);
  }

  handleError(err) {
    const filteredError = new Error(err.message);
    filteredError.stack = err.stack;
    filteredError.req = {
      url: _.get(err, "response.request.url"),
      method: _.get(err, "response.request.method"),
      data: _.get(err, "response.request._data")
    };
    filteredError.body = _.get(err, "response.body");
    filteredError.statusCode = _.get(err, "response.statusCode");
    return Promise.reject(filteredError);
  }

}
