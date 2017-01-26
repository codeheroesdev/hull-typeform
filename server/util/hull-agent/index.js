import _ from "lodash";

import Extract from "./extract";

export default class HullAgent {

  constructor(req, shipCache = null) {
    this.hullClient = req.hull.client;
    this.ship = req.hull.ship;
    this.shipCache = shipCache;

    this.extract = new Extract(req, req.hull.client);
  }

  updateShipSettings(newSettings) {
    return this.hullClient.get(this.ship.id)
      .then(ship => {
        this.ship = ship;
        const private_settings = { ...this.ship.private_settings, ...newSettings };
        this.ship.private_settings = private_settings;
        return this.hullClient.put(this.ship.id, { private_settings });
      })
      .then((ship) => {
        if (!this.shipCache) {
          return ship;
        }
        return this.shipCache.del(this.ship.id)
          .then(() => {
            return ship;
          });
      });
  }

  getShipSettings() {
    return _.get(this.ship, "private_settings", {});
  }

  /**
   *
   */
  userComplete(user) {
    return !_.isEmpty(user.email);
  }

  /**
   *
   */
  userWhitelisted(user) {
    const segmentIds = _.get(this.ship, "private_settings.synchronized_segments", []);
    if (segmentIds.length === 0) {
      return true;
    }
    return _.intersection(segmentIds, user.segment_ids).length > 0;
  }

  getSegments() {
    return this.hullClient.get("/segments");
  }
}
