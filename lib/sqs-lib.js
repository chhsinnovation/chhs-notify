const sqs = require('./aws-lib').sqs;

// Put an SMS message into an SQS queue.
const queueMessage = (queue, sqsMessageBody) => {
  let params = {
    DelaySeconds: 1,
    MessageBody: JSON.stringify(sqsMessageBody, null, 2),
    QueueUrl: queue
  };

  return sqs.sendMessage(params).promise().then(data => {
    return {
      sqs_message_id: data.MessageId
    }
  });
};

module.exports.queueMessage = queueMessage;