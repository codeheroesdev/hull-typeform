import _ from "lodash";
import striptags from "striptags";

const identMappings = {
  email: 'email',
  anonymous_id: 'guest_id',
  external_id: 'external_id',
  hull_id: 'id',
}

export default class SyncAgent {

  constructor(req, hullAgent) {
    this.hullClient = req.hull.client;
    this.hullAgent = hullAgent;
  }

  getIdent({ hidden, answers }) {
    const ident = {};

    _.map(identMappings, (v, k) => {
      const value = _.get(hidden, k)
      if (value) ident[v] = value;
    })

    const emailQuestionId = this.hullAgent.getShipSettings().question_as_email;
    if (emailQuestionId) {

      if (_.get(hidden, emailQuestionId)) {
        ident.email = _.get(hidden, emailQuestionId);
      }

      if (_.get(answers, emailQuestionId)) {
        ident.email = _.get(answers, emailQuestionId);
      }

    }

    return ident;
  }

  getTraits(typeformResponse) {
    const answersToSave = _.get(this.hullAgent.getShipSettings(), "sync_answers_to_hull", []);

    const traits = _.reduce(answersToSave, (t, answer) => {
      let answerValue;

      if (this.isChoice(answer.question_id)) {
        const rootQuestionId = answer.question_id.split("_").slice(0, 2).join("_");
        answerValue = _.filter(typeformResponse.answers, (a, questionId) => {
          return questionId.search(rootQuestionId) !== -1;
        });
      } else {
        if (_.has(typeformResponse.answers, answer.question_id)) {
          answerValue = _.get(typeformResponse.answers, answer.question_id);
        }
        if (_.has(typeformResponse.hidden, answer.question_id)) {
          answerValue = _.get(typeformResponse.hidden, answer.question_id);
        }
      }

      _.set(t, answer.hull, this.castAnswerType(answer.question_id, answerValue));
      return t;
    }, {});

    return traits;
  }

  getEventProps(response, formId, questions) {
    const props = {
      // TODO:
      // form_name: formName,
      form_id: formId
    };

    _.map(_.merge(response.answers, response.hidden), (answer, questionId) => {
      const question = _.find(questions, { id: questionId });
      const propName = (question ? striptags(question.question) : questionId);

      if (_.has(props, propName)) {
        if (_.isArray(props[propName])) {
          props[propName].push(this.castAnswerType(questionId, answer));
        } else {
          props[propName] = [props[propName], this.castAnswerType(questionId, answer)];
        }
      } else {
        props[propName] = this.castAnswerType(questionId, answer);
      }
    });
    return props;
  }

  isHidden(question) {
    return question.id.search("_") === -1;
  }

  isNotHidden(question) {
    return question.id.search("_") !== -1;
  }

  getQuestionType(questionId = "") {
    return (questionId || "").split("_")[0];
  }

  isChoice(questionId = "") {
    return (questionId || "").split("_").slice(-2, -1).pop() === "choice";
  }

  castAnswerType(questionId = "", answer = "") {
    const questionType = this.getQuestionType(questionId);

    if (_.includes(["rating", "opinionscale", "number", "payment"], questionType)) {
      return parseFloat(answer);
    }

    if (_.includes(["yesno", "terms"], questionType)) {
      return answer === "1";
    }

    if (_.includes(["date"], questionType)) {
      return answer === "1";
    }

    return answer;
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
