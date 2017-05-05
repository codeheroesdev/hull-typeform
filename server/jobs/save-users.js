/* @flow */
import Promise from "bluebird";
import _ from "lodash";

/**
 * @param ctx
 * @param  {Object} req
 * @return {Promise}
 */
export default function saveUsers(ctx: any, req: any) {
  const { client, metric } = ctx;
  const { syncAgent } = req.shipApp;
  const { body, typeformUid } = req.payload;

  return Promise.all(_.map(body.responses, response => {
    const ident = syncAgent.getIdent(response);
    const traits = syncAgent.getTraits(response);
    const eventProps = syncAgent.getEventProps(response, typeformUid, body.questions);
    const eventContext = syncAgent.getEventContext(response);

    if (!ident.email) {
      client.logger.info("incoming.user.skip", { ...ident, reason: "No email defined" });
      return null;
    }

    metric.increment("ship.incoming.users", 1);
    client.logger.debug("ship.incoming.user", { ident, traits });
    client.logger.debug("ship.incoming.event", "Form Submitted", eventProps, eventContext);

    client.logger.info("incoming.user.success", ident);

    return Promise.all([
      ctx.client
      .asUser(ident)
      .traits(traits),
      ctx.client
      .asUser(ident)
      .track("Form Submitted", eventProps, eventContext)
    ]);
  }));
}
