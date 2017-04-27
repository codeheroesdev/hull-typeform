import Promise from "bluebird";
import _ from "lodash";

/**
 * @param  {Object} req
 * @return {Promise}
 */
export default function saveUsers(ctx, req) {
  const { client, metric } = ctx;
  const { syncAgent } = req.shipApp;
  const { body, typeformUid } = req.payload;

  return Promise.all(_.map(body.responses, response => {
    const ident = syncAgent.getIdent(response);
    const traits = syncAgent.getTraits(response);
    const eventProps = syncAgent.getEventProps(response, typeformUid, body.questions);
    const eventContext = syncAgent.getEventContext(response);

    if (!ident.email) {
      client.logger.debug("ship.incoming.user.skip", { ident, traits });
      return null;
    }

    metric.increment("ship.incoming.users", 1);
    client.logger.debug("ship.incoming.user", { ident, traits });
    client.logger.debug("ship.incoming.event", "Form Submitted", eventProps, eventContext);

    return Promise.all([
      ctx.client
      .as(ident)
      .traits(traits),
      ctx.client
      .as(ident)
      .track("Form Submitted", eventProps, eventContext)
    ]);
  }));
}
