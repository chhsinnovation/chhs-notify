const validate = require('../../utils/validate');
const format = require('../../utils/format');
const errors = require('../../utils/errors');
const sms = require('../sms');
const message = require('../message');
const template = require('../template');

const batchMessageFields = async (objects, channel) => {
  const messages = await Promise.all(objects.map(object => Promise.resolve(object)
    .then(object => validate.presence(object, channel))
    .then(object => {
      if (object[channel] == "SMS") { 
        return sms.assess.submission(object); 
      };
      // Validate other Channels here: voice, email, postal, etc.
      throw new errors.APIError(
        "BAD_CHANNEL", 400, object, 
        "Ensure the Channel is an allowed value."
      );
    })
    .catch(e => e.report)
  ));

  const failures = messages.filter(report => (report.hasOwnProperty("Error")));
  if (failures.length > 0) {
    throw new errors.APIBatchError(
      "VALIDATION_FAILURES", 400, failures, 
      "Validation errors encountered during intake. Please fix and resubmit."
    );
  };

  return messages;
};

const batchMessageContents = async (objects, channel) => {
  const messages = await Promise.all(objects.map(object => Promise.resolve(object)
    .then(object => {
      if (object[channel] == "SMS") { 
        return sms.assess.content(object); 
      };
    })
    .catch(e => e.report)
  ));

  const failures = messages.filter(report => (report.hasOwnProperty("Error")));
  if (failures.length > 0) {
    throw new errors.APIBatchError(
      "CONTENT_FAILURES", 400, failures, 
      "Failed to validate or process message content during intake. Please fix and resubmit."
    );
  };

  return messages;
};

// Instead of throwing the first error in the batch, collect all errors first.
const postAssessor = json => {
  return Promise.resolve(json)
    .then(json => format.json(json))
    .then(objs => batchMessageFields(objs, "Channel"))
    .then(objs => template.assess.urls(objs, "Parameters", "_Url"))
    .then(objs => template.assess.batchAssembly(objs, "Content", "Template", "TemplateId", "TemplateKey"))
    .then(objs => batchMessageContents(objs, "Channel"))
    .catch(error => { throw error; });
};

module.exports = {
  postAssessor
};