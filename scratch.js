const rds = require('./lib/aws-lib').rds;

const sql = `INSERT INTO sms (sns_message_id, phone_number, message, delivery_status, scheduled_at) 
VALUES (:sns_message_id, :phone_number, :message, :delivery_status, :scheduled_at)
RETURNING id, sns_message_id, delivery_status, to_json(scheduled_at)#>>'{}'`;

const dbParams = {
  secretArn: 'arn:aws:secretsmanager:us-west-2:360110701450:secret:rds-db-credentials/cluster-5GIPGL5VPQMABX35R3XKGU3ZQM/chhsinnovation-p7mPb3',
  resourceArn: 'arn:aws:rds:us-west-2:360110701450:cluster:notifydb'
}

const connectTo = (databaseName, params = dbParams) => {
  return {
    ...params,
    database: databaseName
  }
}

const run = (connection, sql, parameters) => {
  const params = {
    ...connection,
    sql,
    parameters
  }
  return rds.executeStatement(params).promise();
}

const currentTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
const runIt = async () => {
  const result = await run(connectTo('notify_dev'), sql, [
    { name: 'sns_message_id', value: { "stringValue": "Test4" }},
    { name: 'phone_number', value: { "stringValue": "15105655757" }},
    { name: 'message', value: { "stringValue": "Test Message 3" }},
    { name: 'delivery_status', value: { "stringValue": "PENDING" }},
    { name: 'scheduled_at', typeHint: "TIMESTAMP", value: { "stringValue": currentTime }}
  ]);
  console.log(result);
}

runIt();

const t = async () => {

  try {

    const currentTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const params = {
      secretArn: 'arn:aws:secretsmanager:us-west-2:360110701450:secret:rds-db-credentials/cluster-5GIPGL5VPQMABX35R3XKGU3ZQM/chhsinnovation-p7mPb3',
      resourceArn: 'arn:aws:rds:us-west-2:360110701450:cluster:notifydb',
      database: 'notify_dev',
      sql: sql,
      parameters: [
        { name: 'sns_message_id', value: { "stringValue": "Test3" }},
        { name: 'phone_number', value: { "stringValue": "15105655757" }},
        { name: 'message', value: { "stringValue": "Test Message 3" }},
        { name: 'delivery_status', value: { "stringValue": "PENDING" }},
        { name: 'scheduled_at', typeHint: "TIMESTAMP", value: { "stringValue": currentTime }}
      ]
    }

    let data = await rds.executeStatement(params).promise()
    let record = data.records[0]

    console.log(JSON.stringify(data, null, 2))

    const params2 = {
      secretArn: 'arn:aws:secretsmanager:us-west-2:360110701450:secret:rds-db-credentials/cluster-5GIPGL5VPQMABX35R3XKGU3ZQM/chhsinnovation-p7mPb3',
      resourceArn: 'arn:aws:rds:us-west-2:360110701450:cluster:notifydb',
      database: 'notify_messages',
      sql: `INSERT INTO sms_manifest (sns_message_id, stage) VALUES (:sns_message_id, :stage)`,
      parameters: [
        { name: 'sns_message_id', value: { "stringValue": record[1].stringValue }},
        { name: 'stage', value: { "stringValue": "dev" }}
      ]
    }

    let data2 = await rds.executeStatement(params2).promise()

 
    return {
      sms_id: record[0].longValue,
      delivery_status: record[2].stringValue,
      scheduled_at: record[3].stringValue
    }

  } catch(e) {
    console.log(e)
  }
}

//t();