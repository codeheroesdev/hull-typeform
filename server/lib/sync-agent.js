import _ from "lodash";

export default class SyncAgent {

  constructor(req, hullAgent) {
    this.hullClient = req.hull.client;
    this.hullAgent = hullAgent;
  }

  getIdent(typeformResponse) {
    const ident = {};
    ident.anonymous_id = `typeform:${typeformResponse.token}`;

    const emailQuestionId = this.hullAgent.getShipSettings().question_as_email;
    if (emailQuestionId) {
      let email;
      if (_.get(typeformResponse.answers, emailQuestionId)) {
        email = _.get(typeformResponse.answers, emailQuestionId);
      }
      if (_.get(typeformResponse.hidden, emailQuestionId)) {
        email = _.get(typeformResponse.hidden, emailQuestionId);
      }
      ident.email = _(email).trim().toLowerCase();
    }

    return ident;
  }

  getTraits(typeformResponse) {
    const answersToSave = _.get(this.hullAgent.getShipSettings(), "sync_answers_to_hull", []);

    const traits = _.reduce(answersToSave, (t, answer) => {
      if (_.has(typeformResponse.answers, answer.question_id)) {
        _.set(t, answer.hull, _.get(typeformResponse.answers, answer.question_id));
      }
      if (_.has(typeformResponse.hidden, answer.question_id)) {
        _.set(t, answer.hull, _.get(typeformResponse.hidden, answer.question_id));
      }
      return t;
    }, {});


    return traits;
  }

  getEventProps(response, formName, questions) {
    const props = {
      form_name: formName,
      // TODO:
      // form_id: formId
    };
    _.map(response.answers, (answer, questionId) => {
      const question = _.find(questions, { id: questionId });
      if (question) {
        props[question.question] = answer;
      }
    });

    _.map(response.hidden, (answer, questionId) => {
      const question = _.find(questions, { id: questionId });
      if (question) {
        props[question.question] = answer;
      }
    });

    return props;
  }

  getEventContext(response) {
    const context = {
      useragent: response.metadata.user_agent,
      referer: response.metadata.referer,
      source: "typeform",
      event_type: "form",
      event_id: ["typeform", response.token, "submit"].join("-"),
      created_at: response.metadata.date_submit
    };

    return context;
  }

}
