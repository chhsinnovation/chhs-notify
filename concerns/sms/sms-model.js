const rds = require('../../lib/rds-lib');
const sqs = require('../../lib/sqs-lib');
const errors = require('../../utils/errors');

const formatRecord = (record) => ({
  id: record[0].stringValue,
  batch_id: record[1].stringValue,
  channel: record[2].stringValue,
  phone_number: record[3].stringValue,
  content: record[4].stringValue,
  delivery_status: record[5].stringValue,
  delivery_note: record[6].stringValue,
  created_at: record[7].stringValue,
  queued_at: record[8].stringValue,
  sent_at: record[9].stringValue,
  verified_at: record[10].stringValue
});

const fieldsToReturn = `
id, 
batch_id, 
channel, 
phone_number,
content,
delivery_status, 
delivery_note, 
${rds.toDate('created_at')}, 
${rds.toDate('queued_at')}, 
${rds.toDate('sent_at')}, 
${rds.toDate('verified_at')}
`;

const createSQL = `
INSERT INTO sms (batch_id, channel, phone_number, content, delivery_status, queued_at) 
VALUES (CAST(:batch_id AS UUID), :channel, :phone_number, :content, :delivery_status, :queued_at)
RETURNING ${fieldsToReturn}
`;

// Creates an initial record in the database for this text message.
const create = (phone_number, content, delivery_status, batch_id=null) => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), createSQL, [
    { name: 'batch_id', value: (batch_id ? { "stringValue": batch_id } : { "isNull": true })},
    { name: 'channel', value: { "stringValue": "SMS" }},
    { name: 'phone_number', value: { "stringValue": phone_number }},
    { name: 'content', value: { "stringValue": content }},
    { name: 'delivery_status', value: { "stringValue": delivery_status }},
    { name: 'queued_at', typeHint: "TIMESTAMP", value: { "stringValue": rds.now() }}
  ]).then(data => formatRecord(data.records[0]));
};

const getSQL = `
SELECT ${fieldsToReturn}
FROM sms
WHERE id = CAST(:id as UUID)
`;

// Creates an initial record in the database for this text message.
const getById = (id) => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), getSQL, [
    { name: 'id', value: { "stringValue": id }}
  ]).then(data => {
    if (data.records.length == 0) {
      throw new errors.APIError(
        "NO_RECORDS_FOUND", 404, { SmsId: id },
        "No records found under the given ID."
      );
    }
    return formatRecord(data.records[0])
  });
};

const updateAfterQueueProcessingSQL = `
UPDATE sms
SET delivery_status = :delivery_status,
    sns_message_id = CAST(:sns_message_id as UUID),
    sent_at = :sent_at
WHERE id = CAST(:id as UUID)
RETURNING ${fieldsToReturn}
`;

const updateAfterQueueProcessing = (id, sns_message_id, delivery_status) => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), updateAfterQueueProcessingSQL, [
    { name: 'id', value: { "stringValue": id }},
    { name: 'sns_message_id', value: { "stringValue": sns_message_id }},
    { name: 'delivery_status', value: { "stringValue": delivery_status }},
    { name: 'sent_at', typeHint: "TIMESTAMP", value: { "stringValue": rds.now() }}
  ]).then(data => formatRecord(data.records[0]));
};



const updateStatusSQL = `
UPDATE sms
SET delivery_status = :delivery_status,
    delivery_note = :delivery_note,
WHERE id = CAST(:id as UUID)
RETURNING ${fieldsToReturn}
`;

const updateStatus = (id, delivery_status, delivery_note) => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), updateStatusSQL, [
    { name: 'id', value: { "stringValue": id }},
    { name: 'delivery_note', value: { "stringValue": delivery_note }},
    { name: 'delivery_status', value: { "stringValue": delivery_status }}
  ]).then(data => formatRecord(data.records[0]));
};




const logToManifestSQL = `
INSERT INTO sms_manifest (sns_message_id, stage) 
VALUES (CAST(:sns_message_id as UUID), :stage)
RETURNING sns_message_id, stage
`;

// Logs the SNS Message ID to the separate notify_messages database.
const logToManifest = (sns_message_id, stage) => {
  const connection = rds.connectTo('notify_messages', {
    secretArn: process.env.RDS_MESSAGES_ACCESS_ARN,
    resourceArn: process.env.RDS_MESSAGES_INSTANCE_ARN
  });
  return rds.run(connection, logToManifestSQL, [
    { name: 'sns_message_id', value: { "stringValue": sns_message_id }},
    { name: 'stage', value: { "stringValue": stage }}
  ]).then((data) => {
    
    console.log(data);
    return {
      sns_message_id: data.records[0][0].stringValue,
      stage: data.records[0][0].stringValue
    };
  });
};

// Put an SMS message into the SQS queue.
const queueDelivery = (phoneNumber, content, sms_id) => {
  return sqs.queueMessage(process.env.SQS_SMS_URL, {
    PhoneNumber: phoneNumber,
    Content: content,
    SmsId: sms_id
  });
};

module.exports = {
  create,
  getById,
  updateAfterQueueProcessing,
  updateStatus,
  logToManifest,
  queueDelivery
}