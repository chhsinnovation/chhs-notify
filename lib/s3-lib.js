const s3 = require('./aws-lib').s3;

// Upload a file to an S3 bucket.
const upload = (filename, bucket, content) => {
  let params = {
    Body: content, 
    Bucket: bucket, 
    Key: filename, 
  };

  return s3.putObject(params).promise()
    .then(data => ({
      Bucket: bucket,
      File: filename
    })
  );
};

// Get a file from an S3 bucket.
const download = (filename, bucket) => {
  let params = {
    Bucket: bucket, 
    Key: filename, 
  };

  return s3.getObject(params).promise()
    .then(data => ({
      Bucket: bucket,
      Key: filename,
      Body: JSON.parse(data.Body.toString("utf-8"))
    }));
};




module.exports = {
  upload,
  download
};