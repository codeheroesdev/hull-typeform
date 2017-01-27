import _ from "lodash";
import striptags from "striptags";

export default function getQuestions(req, res) {
  const { typeformClient, syncAgent } = req.shipApp;

  if (!req.hull.ship.private_settings.typeform_uid
      || !typeformClient.ifConfigured()) {
    return res.json({
      options: []
    });
  }

  const typeformUid = req.hull.ship.private_settings.typeform_uid;

  return typeformClient.get(`/form/${typeformUid}`)
    .then(({ body }) => {
      const result = [{
        label: "questions",
        options: _.chain(body.questions)
          .filter(syncAgent.isNotHidden)
          .thru(questions => {
            return questions.filter(f => {
              if (req.params.type) {
                return syncAgent.getQuestionType(f.id) === req.params.type;
              }
              return true;
            }) || questions;
          })
          .map(f => {
            return { label: striptags(f.question), value: f.id };
          })
          .uniqBy("label")
          .value()
      }, {
        label: "hidden",
        options: _.chain()
          .filter(syncAgent.isHidden)
          .map(f => {
            return { label: striptags(f.question), value: f.id };
          })
          .uniqBy("label")
          .value()
      }];
      res.json({ options: result });
    })
    .catch(() => {
      res.json({ options: [] });
    });
}
