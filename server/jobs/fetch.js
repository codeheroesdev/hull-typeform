/* @flow */
import saveUsers from "./save-users";

export default function fetch(ctx: any, req: any) {
  const { client, metric } = ctx;
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
      client.logger.debug("incoming.job.progress", { jobName: "fetch-all", stepName: "usersData", progress: body.responses.length });
      return saveUsers(ctx, { shipApp: req.shipApp, payload: { body, typeformUid } })
        .then(() => {
          if (since || body.responses.length < limit) {
            client.logger.info("incoming.job.success", { jobName: "fetch-all" });
            return true;
          }

          client.logger.debug("incoming.job.progress", { jobName: "fetch-all", stepName: "next-call" });
          return fetch(ctx, { shipApp: req.shipApp, payload: { limit, offset: (offset + limit), typeformUid } });
        });
    })
    .catch(err => {
      client.logger.info("incoming.job.error", { jobName: "fetch-all", errors: err });
    });
}
