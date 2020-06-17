const rdsRecord = (record, extra = {}) => {
  let url = "";
  if (record.channel == "SMS") {
    url = `${process.env.URL_BASE}/sms/${record.id}`;
  };

  const batchUrl = (record.batch_id ? `${process.env.URL_BASE}/batches/${record.batch_id}` : undefined);

  let apiResponse = {
    Message: {
      Id: record.id,
      Url: url,
      BatchId: record.batch_id,
      BatchUrl: batchUrl,
      Channel: record.channel,
      DeliveryStatus: record.delivery_status,
      DeliveryNote: record.delivery_note,
      ...extra,
      CreatedTime: record.created_at,
      QueuedTime: record.queued_at,
      SentTime: record.sent_at,
      VerifiedTime: record.verified_at
    }
  };
  return apiResponse;
};

module.exports = {
  rdsRecord
}