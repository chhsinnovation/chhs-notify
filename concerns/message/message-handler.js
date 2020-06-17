const deliver = require('../../utils/deliver');
const handler = require('../../utils/handler');
const smsHelper = require('../sms/sms-helper');



const processQueue = handler(async (event, context) => {
  const promises = event.Records.map(async record => {
    const recordBody = JSON.parse(record.body);
    if (recordBody.Channel == "SMS") {

      return smsHelper.processNew(recordBody);
    }
  });
  const jobs = await Promise.all(promises);

  return deliver.withStatus(204, null);
});


module.exports = {
  processQueue
}