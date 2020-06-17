const errors = require('../../utils/errors');
const handler = require('../../utils/handler');
const deliver = require('../../utils/deliver');
const assessor = require('./batch-assessor');
const batch = require('./batch-model');
const message = require('../message/message-model');
const messageHelper = require('../message/message-helper');
const batchHelper = require('../batch/batch-helper');



const create = handler(async (event, context) => {
  const messages = await assessor.postAssessor(event.body);

  // If the assessor discovered any errors, throw them and exit.
  const failures = messages.filter(report => (report.hasOwnProperty("Error")));
  if (failures.length > 0) {
    throw new errors.APIBatchError(
      "VALIDATION_FAILURES", 400, failures, 
      "Validation errors encountered during intake. Please fix and resubmit."
    );
  };

  const rdsResponse = await batch.create();
  const s3Response = await batch.upload(rdsResponse.id, {
    BatchId: rdsResponse.id,
    Messages: messages
  });

  const apiResponse = {
    Batch: {
      Id: rdsResponse.id,
      Url: `${process.env.URL_BASE}/batches/${rdsResponse.id}`,
      ProcessingStatus: "QUEUED"
    }
  };
  return deliver.withStatus(202, apiResponse);
});



const get = handler(async (event, context) => {
  const apiResponse = await batchHelper.processGet(event);
  return deliver.withStatus(200, apiResponse);
});



const processFile = handler(async (event, context) => {
  const filename = event.Records[0].s3.object.key;
  const file = await batch.download(filename);

  const promises = file.Body.Messages.map(async msg => {
    msg.BatchId = file.Body.BatchId;
    return message.queueIntake(msg);
  });

  const jobs = await Promise.all(promises);
  return deliver.withStatus(204, null);
});



module.exports = {
  create,
  get,
  processFile
};
