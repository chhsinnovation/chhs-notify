const validate = require('./validate');
const format = require('./format');

// Common field assessment for an sms message object.
const smsFields = object => {
  return Promise.resolve(object)
    .then(obj => validate.presence(obj, "PhoneNumber"))
    .then(obj => format.phoneNumber(obj, "PhoneNumber"))
    .then(obj => validate.minLength(obj, "PhoneNumber", 11))
    .then(obj => validate.content(obj, "Content", "Template", "TemplateId", "TemplateKey", "Parameters"))
    .catch(error => { throw error; });
};

const smsContents = object => {
  return Promise.resolve(object)
    .then(obj => format.content(obj, "Content", "Template", "Parameters"))
    .then(obj => presence(obj, "Content"))
    .then(obj => maxLength(obj, "Content", 160))
    .catch(error => { throw error; });
};

module.exports = {
  smsFields,
  smsContents
};