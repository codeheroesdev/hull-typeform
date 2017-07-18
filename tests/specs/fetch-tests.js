/* global describe, it, beforeEach, afterEach */
import Minihull from "minihull";
import assert from "assert";
import bootstrap from "./bootstrap";
import TypeformMock from "./typeform-mock";

describe("connector for /fetch-all endpoint", function test() {
  let minihull;
  let server;
  const typeformMock = new TypeformMock();

  const private_settings = {
    api_key: "0987654321",
    typeform_uid: "123456789",
    question_as_email: "typeform_id",
    sync_answers_to_hull: [
      {
        question_id: "choice_7",
        hull: "hull_answer_id"
      }
    ]
  };

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);

    minihull.stubConnector({
      id: "123456789012345678901234", private_settings
    });

    minihull.stubSegments([
      {
        name: "testSegment",
        id: "hullSegmentId"
      }
    ]);

    setTimeout(() => {
      done();
    }, 1000);
  });

  afterEach(() => {
    minihull.close();
    server.close();
  });


  it("should fetch all users from typeform for choice type of answer", (done) => {
    const getTypeformClientNock = typeformMock.setUpGetClientNock("choice_7");

    minihull.postConnector("123456789012345678901234", "http://localhost:8000/fetch-all").then(() => {
      setTimeout(() => {
        getTypeformClientNock.done();
      }, 1000);
    });

    minihull.on("incoming.request@/api/v1/firehose", (req) => {
      const batch = req.body.batch;

      assert(batch[0].type === "traits");
      assert(batch[0].body.hull_answer_id.length === 1);
      assert(batch[0].body.hull_answer_id[0] === "choice_7");

      assert(batch[1].type === "track");
      assert(batch[1].body.event === "Form Submitted");
      assert(batch[1].body.useragent === "hull");
      assert(batch[1].body.source === "typeform");

      done();
    });
  });


  it("should fetch all users from typeform for another answer type than choice", (done) => {
    private_settings.sync_answers_to_hull = [
      {
        question_id: "notchoice_3",
        hull: "hull_answer_id"
      }
    ];
    const getTypeformClientNock = typeformMock.setUpGetClientNock("notchoice_3");

    minihull.postConnector("123456789012345678901234", "http://localhost:8000/fetch-all").then(() => {
      setTimeout(() => {
        getTypeformClientNock.done();
      }, 1000);
    });

    minihull.on("incoming.request@/api/v1/firehose", (req) => {
      const batch = req.body.batch;

      assert(batch[0].type === "traits");
      assert(batch[0].body.hull_answer_id === "notchoice_value");

      assert(batch[1].type === "track");
      assert(batch[1].body.event === "Form Submitted");
      assert(batch[1].body.useragent === "hull");
      assert(batch[1].body.source === "typeform");

      done();
    });
  });
});

