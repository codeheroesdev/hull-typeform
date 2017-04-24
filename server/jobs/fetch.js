import saveUsers from "./save-users";

export default function fetch(req) {
  const { client, metric } = req.hull;
  const { typeformClient } = req.shipApp;
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
      metric.increment("ship.incoming.users.fetch", body.responses.length);
      client.logger.debug("ship.incoming.usersData", body.responses.length);
      return saveUsers({ shipApp: req.shipApp, payload: { body, typeformUid } })
        .then(() => {
          if (since || body.responses.length < limit) {
            return true;
          }
          client.logger.debug("fetch.nextCall");
          return fetch({ shipApp: req.shipApp, payload: { limit, offset: (offset + limit), typeformUid } });
        });
    })
    .catch(err => {
      console.error(err);
      client.logger.error("fetch.error", err);
    });
}
