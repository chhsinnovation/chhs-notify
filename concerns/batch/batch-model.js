const rds = require('../../lib/rds-lib');
const s3 = require('../../lib/s3-lib');
const sqs = require('../../lib/sqs-lib');
const errors = require('../../utils/errors');

const createSQL = `
INSERT INTO batch (queued_at) 
VALUES (:queued_at)
RETURNING id, to_json(queued_at)#>>'{}'
`;

// Creates an initial record in the database for this batch.
const create = () => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), createSQL, [
    { name: 'queued_at', typeHint: "TIMESTAMP", value: { "stringValue": rds.now() }}
  ]).then(data => {
    const record = data.records[0];
    return {
      id: record[0].stringValue,
      queued_at: record[1].stringValue
    };
  });
};

const getByIdSQL = `
SELECT 
  id, 
  processing_status,
  processing_note,
  description,
  ${rds.toDate('created_at')}, 
  ${rds.toDate('queued_at')}, 
  ${rds.toDate('processed_at')}, 
  ${rds.toDate('verified_at')},
  (
    SELECT COUNT(*) 
    FROM message msg 
    WHERE msg.batch_id = bch.id
  ) message_count 
FROM batch bch 
WHERE id = CAST(:id as UUID)
`;

const getById = (batchId) => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), getByIdSQL, [
    { name: 'id', value: { "stringValue": batchId }},
  ]).then(data => {
    if (data.records.length == 0) {
      throw new errors.APIError(
        "BATCH_NOT_FOUND", 404, { BatchId: batchId },
        "Batch not found."
      );
    };
    const record = data.records[0];
    return {
      id: record[0].stringValue,
      processing_status: record[1].stringValue,
      processing_note: record[2].stringValue,
      description: record[3].stringValue,
      created_at: record[4].stringValue,
      queued_at: record[5].stringValue,
      processed_at: record[6].stringValue,
      verified_at: record[7].stringValue,
      message_count: record[8].longValue,
    };
  });
};

const getMessagesByIdSQL = `
SELECT id, batch_id, channel, delivery_status, delivery_note, to_json(queued_at)#>>'{}', to_json(sent_at)#>>'{}', to_json(verified_at)#>>'{}'
FROM message
WHERE batch_id = CAST(:batch_id as UUID)
ORDER BY created_at, id
OFFSET :offset
LIMIT :limit
`;

// Creates an initial record in the database for this text message.
const getMessagesById = (batchId, offset, limit) => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), getMessagesByIdSQL, [
    { name: 'batch_id', value: { "stringValue": batchId }},
    { name: 'offset', value: { "longValue": offset }},
    { name: 'limit', value: { "longValue": limit }}
  ]).then(data => {
    if (data.records.length == 0) {
      throw new errors.APIError(
        "BATCH_MESSAGES_NOT_FOUND", 404, { BatchId: batchId },
        "No messages found under this Batch ID."
      );
    };
    return data.records.map(record => ({
      id: record[0].stringValue,
      batch_id: record[1].stringValue,
      channel: record[2].stringValue,
      delivery_status: record[3].stringValue,
      delivery_note: record[4].stringValue,
      queued_at: record[5].stringValue,
      sent_at: record[6].stringValue,
      verified_at: record[7].stringValue
    }));
  });
};

const upload = (batchId, content) => {
  const filename = `${batchId}-${Math.random().toString(36).slice(7)}.json`;
  return s3.upload(filename, process.env.S3_BATCH_FILES_BUCKET, JSON.stringify(content));
};

const download = (filename) => {
  return s3.download(filename, process.env.S3_BATCH_FILES_BUCKET);
}

// Probably not needed. We can use S3 events instead.
const queue = (batchId, filename, bucket) => {
  return sqs.queueMessage(process.env.SQS_MESSAGE_URL, {
    BatchId: batchId,
    FileName: filename,
    Bucket: bucket
  });
};


module.exports = {
  create, 
  getById,
  getMessagesById,
  upload,
  download,
  queue
}