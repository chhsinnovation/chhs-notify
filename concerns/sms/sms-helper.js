const sms = require('./sms-model');
const assess = require('./sms-assess');


const formatForApiResponse = (record) => {
  const batchUrl = (record.batch_id ? `${process.env.URL_BASE}/batches/${record.batch_id}` : undefined);
  const apiResponse = {
    SmsMessage: {
      Id: record.id,
      Url: `${process.env.URL_BASE}/sms/${record.id}`,
      BatchId: record.batch_id,
      BatchUrl: batchUrl,
      Channel: record.channel,
      PhoneNumber: record.phone_number,
      Content: record.content,
      DeliveryStatus: record.delivery_status,
      DeliveryNote: record.delivery_note,
      CreatedTime: record.created_at,
      QueuedTime: record.queued_at,
      SentTime: record.sent_at,
      VerifiedTime: record.verified_at
    }
  };
  return apiResponse;
};


const processNew = async eventBody => {
  //const eventBody =  await assess.postRequest(event.body);
  const rdsResponse = await sms.create(eventBody.PhoneNumber, eventBody.Content, "QUEUED", eventBody.BatchId);
  const sqsResponse = await sms.queueDelivery(eventBody.PhoneNumber, eventBody.Content, rdsResponse.id);

  return formatForApiResponse(rdsResponse);
};


module.exports = {
  processNew,
  formatForApiResponse
}