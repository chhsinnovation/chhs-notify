const rds = require('../../lib/rds-lib');
const errors = require('../../utils/errors');

const sqlReturns = (record) => ({
  id: record[0].stringValue,
  key: record[1].stringValue,
  channel: record[2].stringValue,
  description: record[3].stringValue,
  content: record[4].stringValue
})



const listSQL = `
SELECT id, key, channel, description, content
FROM template
`;


const listAll = () => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), listSQL, [])
    .then(data => {
      return data.records.map(record => sqlReturns(record));
    });
}



const createSQL = `
INSERT INTO template (key, channel, description, content) 
VALUES (:key, :channel, :description, :content)
RETURNING id, key, channel, description, content
`;

const create = (channel, content, key, description) => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), createSQL, [
    { name: 'key', value: (key ? { "stringValue": key } : { "isNull": true })},
    { name: 'channel', value: { "stringValue": channel }},
    { name: 'description', value: (description ? { "stringValue": description } : { "isNull": true })},
    { name: 'content', value: { "stringValue": content }}
  ]).then(data => {
    return sqlReturns(data.records[0]);
  });
};



const getSQLGenerator = (whereClause) => (`
SELECT id, key, channel, description, content
FROM template
${whereClause}
`);

const getById = (id) => {
  const sql = getSQLGenerator("WHERE id = CAST(:id as UUID)");
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), sql, [
    { name: 'id', value: { "stringValue": id }}
  ]).then(data => {
    if (data.records.length == 0) {
      throw new errors.APIError(
        "TEMPLATE_NOT_FOUND", 404, { TemplateId: id },
        `No templates found with this TemplateID: ${id}`
      );
    };
    return sqlReturns(data.records[0]);
  });
};

const getByKey = (key) => {
  const sql = getSQLGenerator("WHERE key = :key");
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), sql, [
    { name: 'key', value: { "stringValue": key }}
  ]).then(data => {
    if (data.records.length == 0) {
      throw new errors.APIError(
        "TEMPLATE_NOT_FOUND", 404, { TemplateKey: key },
        `No templates found with this TemplateKey: ${key}`
      );
    };
    return sqlReturns(data.records[0]);
  });
};




const updateSQL = (updates) => (`
UPDATE template
SET ${updates.join(", ")}
WHERE id = CAST(:id as UUID)
RETURNING id, key, channel, description, content
`);

const update = (id, channel, description, content, key) => {
  let [sqls, params] = rds.paramsFrom({channel, description, content, key});
  params.push({ name: 'id', value: { "stringValue": id }})
  const sql = updateSQL(sqls);
  return rds.run(
    rds.connectTo(process.env.RDS_DATABASE_NAME), 
    sql, 
    params
  ).then(data => {
    return sqlReturns(data.records[0]);
  });
};



const deleteSQL = `
DELETE FROM template
WHERE id = CAST(:id as UUID)
`;

const deleteById = (id) => {
  return rds.run(rds.connectTo(process.env.RDS_DATABASE_NAME), deleteSQL, [
    { name: 'id', value: { "stringValue": id }}
  ]).then(data => {
    return {
      id: id
    };
  });
};

module.exports = {
  listAll,
  create,
  getById,
  getByKey,
  update,
  deleteById
};