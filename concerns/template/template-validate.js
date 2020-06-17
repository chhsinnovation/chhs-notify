const validate = require('../../utils/validate');
const schema = require('./template-schema');
const errors = require('../../utils/errors');

// Assess a post request for a new template.
const postRequest = json => {
  return Promise.resolve(json)
    .then(json => format.json(json))
    .then(obj => validate.schema(obj, schema.post))
    .catch(error => { throw error; });
};

// Assess a put request for an existing template.
const putRequest = json => {
  return Promise.resolve(json)
    .then(json => format.json(json))
    .then(obj => validate.schema(obj, schema.put))
    .catch(error => { throw error; });
};

// Assess a render test request for a template.
const renderRequest = json => {
  return Promise.resolve(json)
    .then(json => format.json(json))
    .then(obj => validate.schema(obj, schema.render))
    .catch(error => { throw error; });
};

module.exports = {
  postRequest,
  putRequest,
  renderRequest
}