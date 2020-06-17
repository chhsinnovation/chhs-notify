const deliver = require('../../utils/deliver');
const handler = require('../../utils/handler');
const template = require('./template-model');
const format = require('./template-format');
const assess = require('./template-assess');
const validate = require('./template-validate');
const Liquid = require('liquidjs').Liquid;



const list = handler(async (event, context) => {
  const rdsResponse = await template.listAll();

  const apiResponse = rdsResponse.map(tmpl => format.rdsRecord(tmpl));
  return deliver.withStatus(200, apiResponse);
});



const post = handler(async (event, context) => {
  const eventBody =  await validate.postRequest(event.body);
  const rdsResponse = await template.create( 
    eventBody.Channel, 
    eventBody.Content,
    eventBody.Key, 
    eventBody.Description
  );

  const apiResponse = format.rdsRecord(rdsResponse);
  return deliver.withStatus(201, apiResponse);
});



const get = handler(async (event, context) => {
  const rdsResponse = await template.getById(event.pathParameters.id);

  const apiResponse = format.rdsRecord(rdsResponse);
  return deliver.withStatus(200, apiResponse);
});




const put = handler(async (event, context) => {
  const eventBody =  await validate.putRequest(event.body);
  const rdsResponse = await template.update(
    event.pathParameters.id,
    eventBody.Channel,
    eventBody.Description,
    eventBody.Content,
    eventBody.Key
  );

  const apiResponse = format.rdsRecord(rdsResponse);
  return deliver.withStatus(200, apiResponse);
});



const del = handler(async (event, context) => {
  const rdsResponse = await template.deleteById(event.pathParameters.id);

  return deliver.withStatus(204, null);
});



const render = handler(async (event, context) => {
  const eventBody = await validate.renderRequest(event.body);
  const rdsResponse = await template.getById(event.pathParameters.id);

  const engine = new Liquid();
  const tpl = engine.parse(rdsResponse.content);
  const content = await engine.render(tpl, eventBody.Parameters);

  //const content = mustache.render(rdsResponse.content, eventBody.Parameters);

  const apiResponse = {
    RenderedContent: content,
    Parameters: eventBody.Parameters,
    ...format.rdsRecord(rdsResponse)
  }
  return deliver.withStatus(200, apiResponse);
});


module.exports = {
  list,
  post,
  put,
  get,
  del,
  render
}