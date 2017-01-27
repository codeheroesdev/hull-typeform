import Promise from "bluebird";
import _ from "lodash";

/**
 * @param  {Object} req
 * @return {Promise}
 */
export default function saveUsers(req) {
  const { syncAgent, instrumentationAgent, hullClient } = req.shipApp;
  const { body, typeformUid } = req.payload;

  return Promise.all(_.map(body.responses, response => {
    const ident = syncAgent.getIdent(response);
    const traits = syncAgent.getTraits(response);
    const eventProps = syncAgent.getEventProps(response, typeformUid, body.questions);
    const eventContext = syncAgent.getEventContext(response);

    if (!ident.email) {
      hullClient.logger.debug("ship.incoming.user.skip", { ident, traits });
      return null;
    }

    instrumentationAgent.metricInc("ship.incoming.users", hullClient.configuration());
    hullClient.logger.debug("ship.incoming.user", { ident, traits });
    hullClient.logger.debug("ship.incoming.event", "Form Submitted", eventProps, eventContext);

    return Promise.all([
      hullClient
      .as(ident)
      .traits(traits),
      hullClient
      .as(ident)
      .track("Form Submitted", eventProps, eventContext)
    ]);
  }));
}
