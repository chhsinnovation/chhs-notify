const rds = require('./aws-lib').rds;

// Format a JS Date object for insertion into PostgreSQL.
const formatDateTime = (date) => {
  return (date.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
};

// Get the current time. Often useful for recording events in DB.
const now = () => {
  return formatDateTime(new Date());
};

// Format a date for return from a query.
const toDate = (field) => (`to_json(${field})#>>'{}'`);

// Default connection ARNs to AWS RDS.
const defaultConnectionParams = {
  secretArn: process.env.RDS_ACCESS_ARN,
  resourceArn: process.env.RDS_INSTANCE_ARN
};

// Helps construct params to connect to a specific database in RDS.
const connectTo = (databaseName, params = defaultConnectionParams) => ({
  ...params,
  database: databaseName
});

// Executes a SQL statement against an RDS database.
// sql is a SQL template. Parameters feed the template. 
// Works per aws-sdk specs.
// Note that it returns a promise. Handle with care!
const run = (connection, sql, parameters) => {
  const params = {
    ...connection,
    sql,
    parameters
  }
  return rds.executeStatement(params).promise();
};

// Given an object, generates two things.
// 1. A list of SQL snippets to put in a SQL SET statement template.
// 2. A list of params with values for submission.
// Current limitation: only submits strings.
const paramsFrom = (updates) => {
  let sqls = [];
  let params = [];
  for(const key in updates) {
    if (updates[key]) {
      sqls.push(`${key} = :${key}`);
      params.push({ name: key, value: { stringValue: updates[key]}})
    };
  };
  return [sqls, params];
}



module.exports = {
  formatDateTime,
  now,
  connectTo,
  run,
  toDate,
  paramsFrom
}