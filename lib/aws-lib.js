const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  logger: console,
});

module.exports.pinpoint = new AWS.Pinpoint();
module.exports.sqs = new AWS.SQS({apiVersion: '2012-11-05'});
module.exports.sns = new AWS.SNS({apiVersion: '2010-03-31'});
module.exports.rds = new AWS.RDSDataService({apiVersion: '2018-08-01'});
module.exports.s3 = new AWS.S3({apiVersion: '2006-03-01'});
module.exports.aws = AWS;