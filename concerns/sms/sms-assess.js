const validate = require('../../utils/validate');
const format = require('../../utils/format');
const template = require('../template')

const postRequest = json => {
  return Promise.resolve(json)
    .then(json => format.json(json))
    .then(obj => submission(obj))
    .then(obj => template.assess.assembly(obj, "Content", "Template", "TemplateId", "TemplateKey"))
    .then(obj => validate.optional(template.assess.url, obj, "Parameters", "_Url"))
    .then(obj => content(obj))
    .then(obj => validate.optedOut(obj, "PhoneNumber"))
    .catch(error => { throw error; });
};

const submission = object => {
  return Promise.resolve(object)
    .then(obj => validate.presence(obj, "PhoneNumber"))
    .then(obj => format.phoneNumber(obj, "PhoneNumber"))
    .then(obj => validate.minLength(obj, "PhoneNumber", 11))
    .then(obj => template.assess.submission(obj, "Content", "Template", "TemplateId", "TemplateKey", "Parameters"))
    .catch(error => { throw error; });
};

const content = object => {
  return Promise.resolve(object)
    .then(obj => template.assess.content(obj, "Content", "Template", "Parameters"))
    .then(obj => validate.presence(obj, "Content"))
    .then(obj => validate.maxLength(obj, "Content", 160))
    .catch(error => { throw error; });
};

module.exports = {
  postRequest,
  submission,
  content
}