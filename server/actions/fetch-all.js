import * as jobs from "../jobs";

export default function fetchAll(req, res) {
  const { typeformClient } = req.shipApp;

  if (!typeformClient.ifConfigured()) {
    return res.redirect("back");
  }

  const order_by = "date_submit,asc";
  const limit = 100;
  const typeformUid = req.hull.ship.private_settings.typeform_uid;

  if (!typeformUid) {
    return res.redirect("back");
  }

  req.hull.client.logger.info("fetchAll.started");

  res.redirect("back");
  return jobs.fetch({ shipApp: req.shipApp, payload: { limit, order_by, typeformUid } });
}
