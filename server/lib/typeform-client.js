import request from "superagent";
import prefixPlugin from "superagent-prefix";
import superagentPromisePlugin from "superagent-promise-plugin";
import _ from "lodash";
import Promise from "bluebird";

export default class TypeformClient {

  constructor({ ship, client, metric }) {
    this.apiKey = _.get(ship, "private_settings.api_key");
    this.client = client;
    this.metric = metric;
    this.req = request;
  }

  ifConfigured() {
    return !_.isEmpty(this.apiKey);
  }

  attach(req) {
    if (!this.ifConfigured()) {
      throw new Error("Client access data not set!");
    }

    // .on("response", (res) => {});

    return req
      .use(prefixPlugin("https://api.typeform.com/v1"))
      .use(superagentPromisePlugin)
      .query({
        key: this.apiKey
      })
      .on("request", (reqData) => {
        this.client.logger.debug("typeform.request", reqData.method, reqData.url, reqData.qs);
        this.metric.increment("ship.service_api.call", 1);
      });
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
