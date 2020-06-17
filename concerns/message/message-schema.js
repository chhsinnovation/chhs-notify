const base = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "http://notify.chhs.ca.gov/docs/message.schema.json",
  title: "Message Base",
  description: "Base definition for objects that inherit from Message, such as SMS, etc.",
  type: "object",
  definitions: {
    Message: {
      allOf: [
        { $ref: "#/definitions/Contents" }
      ]
    },
    Contents: {
      properties: {
        Content: {
          description: "The full content for the given message.",
          type: "string"
        }
      },
      oneOf: [
        { required: ["Content"] },
        { $ref: "#/definitions/Templating" }
      ]
    },
    Templating: {
      properties: {
        Template: {
          description: "A string containing the full template.",
          type: "string"
        },
        TemplateId: {
          description: "A UUID reference to a stored template.",
          type: "string",
          format: "uuid"
        },
        TemplateKey: {
          description: "A key reference to a stored template.",
          type: "string"
        }, 
        Parameters: {
          description: "Parameters to enter into a template.",
          type: "object"
        }
      },
      required: ["Parameters"],
      oneOf: [
        { required: ["Template"] },
        { required: ["TemplateId"] },
        { required: ["TemplateKey"] }
      ]
    }
  }
};

module.exports = {
  base
}