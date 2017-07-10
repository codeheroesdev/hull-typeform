/* @flow */
import Promise from "bluebird";
import _ from "lodash";

/**
 * @param ctx
 * @param  {Object} req
 * @return {Promise}
 */
export default function saveUsers(ctx: any, req: any) {
  const { metric } = ctx;
  const { syncAgent } = req.shipApp;
  const { body, typeformUid } = req.payload;

  return Promise.all(_.map(body.responses, response => {
    const ident = syncAgent.getIdent(response);
    const traits = syncAgent.getTraits(response);
    const eventProps = syncAgent.getEventProps(response, typeformUid, body.questions);
    const eventContext = syncAgent.getEventContext(response);
    const asUser = ctx.client.asUser(ident);

    if (!ident.email) {
      asUser.logger.info("incoming.user.skip", { reason: "No email defined" });
      return null;
    }

    metric.increment("ship.incoming.users", 1);
    asUser.logger.debug("ship.incoming.event", "Form Submitted", eventProps, eventContext);

    asUser.logger.info("incoming.user.success", { traits });

    return Promise.all([
      asUser.traits(traits),
      asUser.track("Form Submitted", eventProps, eventContext)
    ]);
  }));
}
