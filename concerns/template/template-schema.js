const base = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "http://notify.chhs.ca.gov/docs/template-base.schema.json",
  title: "Template Base Request",
  description: "Common definitions for template requests.",
  type: "object",
  definitions: {
    Template: {
      properties: {
        Channel: {
          description: "The intended channel for this template: SMS, etc.",
          type: "string",
          maxLength: 25,
          minLength: 2
        },
        Key: {
          description: "A key by which the template can be referenced.",
          type: "string",
          maxLength: 128,
          minLength: 2
        },
        Description: {
          description: "A description of the template's purpose.",
          type: "string"
        },
        Content: {
          description: "The full content for the given template.",
          type: "string"
        }
      }
    }
  }
};

const post = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "http://notify.chhs.ca.gov/docs/template-post.schema.json",
  title: "Template POST Request",
  description: "Definition for template POST requests.",
  type: "object",
  properties: base.definitions.Template.properties,
  required: [ "Channel", "Content" ]
};

const put = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "http://notify.chhs.ca.gov/docs/template-put.schema.json",
  title: "Template PUT Request",
  description: "Definition for template PUT requests.",
  type: "object",
  properties: base.definitions.Template.properties,
  anyOf: [
    { required: ["Channel"] },
    { required: ["Key"] },
    { required: ["Description"] },
    { required: ["Content"] },
  ]
};

const render = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "http://notify.chhs.ca.gov/docs/template-render.schema.json",
  title: "Template Render Request",
  description: "Definition for template render test requests.",
  type: "object",
  properties: {
    Parameters: {
      description: "A set of parameters to render into the given template.",
      type: "object"
    }
  },
  required: ["Parameters"]
};

module.exports = {
  base,
  post,
  put,
  render
};