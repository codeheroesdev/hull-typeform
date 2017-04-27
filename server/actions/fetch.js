import moment from "moment";

import * as jobs from "../jobs";

export default function fetch(req, res) {
  const { typeformClient } = req.shipApp;

  if (!typeformClient.ifConfigured()) {
    return res.end("ok");
  }

  const order_by = "date_submit,desc";
  const limit = 100;
  const since = req.hull.ship.private_settings.last_fetch_at || moment().subtract(1, "day").format("X");
  const typeformUid = req.hull.ship.private_settings.typeform_uid;

  if (!typeformUid) {
    return res.end("ok");
  }

  req.hull.client.logger.info("fetch.since", moment(since, "X").format());

  res.end("ok");
  return jobs.fetch(req.hull, { shipApp: req.shipApp, payload: { limit, order_by, since, typeformUid } });
}
