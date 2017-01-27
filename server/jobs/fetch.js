import saveUsers from "./save-users";

export default function fetch(req) {
  const { typeformClient, instrumentationAgent, hullClient } = req.shipApp;
  const { typeformUid, limit, offset = 0, since, order_by } = req.payload;

  return typeformClient.get(`/form/${typeformUid}`)
    .query({
      completed: true,
      order_by,
      limit,
      offset,
      since
    })
    .catch(typeformClient.handleError)
    .then(({ body }) => {
      instrumentationAgent.metricInc("ship.incoming.users.fetch", body.responses.length, hullClient.configuration());
      hullClient.logger.debug("ship.incoming.usersData", body.responses.length);
      return saveUsers({ shipApp: req.shipApp, payload: { body, typeformUid } })
        .then(() => {
          if (since || body.responses.length < limit) {
            return true;
          }
          hullClient.logger.debug("fetch.nextCall");
          return fetch({ shipApp: req.shipApp, payload: { limit, offset: (offset + limit), typeformUid } });
        });
    })
    .catch(err => {
      console.error(err);
      hullClient.logger.error("fetch.error", err);
    });
}
