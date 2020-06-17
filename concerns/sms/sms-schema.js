const message = require('../message');

const post = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "http://notify.chhs.ca.gov/docs/sms.schema.json",
  title: "Sms Post Request",
  description: "Definition for SMS POST requests.",
  type: "object",
  definitions: {
    // Need to redefine Contents here to enforce the character limit.
    Templating: message.schema.base.definitions.Templating,
    Contents: {
      properties: {
        Content: {
          description: "The full content for the given text message.",
          type: "string",
          maxLength: 160
        }
      },
      oneOf: [
        { required: ["Content"] },
        { $ref: "#/definitions/Templating" }
      ]
    }
  },
  properties: {
    PhoneNumber: {
      description: "Phone number to which the text message will be sent.",
      type: "string",
      minLength: 10
    }
  },
  allOf: [
    { required: ["PhoneNumber"] },
    { $ref: "#/definitions/Contents" }
  ]
};

module.exports = {
  post
}