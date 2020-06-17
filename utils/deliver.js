const buildResponse = (statusCode, body) => {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify(body)
  };
}

module.exports.successful = (body) => {
  return buildResponse(200, body);
}

module.exports.failed = (body) => {
  return buildResponse(500, body);
}

module.exports.withStatus = (statusCode, body) => {
  return buildResponse(statusCode, body);
}