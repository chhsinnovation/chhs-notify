const deliver = require('../../utils/deliver');
const handler = require('../../utils/handler');
const sms = require('./sms-model');
const sns = require('../../lib/sns-lib');
const helper = require('./sms-helper');
const assess = require('./sms-assess');




const post = handler(async (event, context) => {
  const eventBody =  await assess.postRequest(event.body);
  const apiResponse = await helper.processNew(eventBody);
  return deliver.withStatus(202, apiResponse);
});



const get = handler(async (event, context) => {
  const rdsResponse = await sms.getById(event.pathParameters.id);

  const apiResponse = helper.formatForApiResponse(rdsResponse);
  return deliver.withStatus(200, apiResponse);
});



const processQueue = handler(async (event, context) => {
  const promises = event.Records.map(async record => {
    const eventBody = JSON.parse(record.body);
    const snsResponse = await sns.publishSMS(eventBody.PhoneNumber, eventBody.Content);
    const rdsResponse = await sms.updateAfterQueueProcessing(eventBody.SmsId, snsResponse.sns_message_id, "SENT");
    return sms.logToManifest(rdsResponse.sns_message_id, process.env.STAGE);
  });
  const jobs = await Promise.all(promises);

  return deliver.withStatus(204, null);
});



module.exports = {
  post,
  get,
  processQueue
}