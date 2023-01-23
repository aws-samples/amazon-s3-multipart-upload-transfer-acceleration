const AWS = require('aws-sdk');

const BUCKET_NAME = process.env['BUCKET_NAME'];

const s3 = new AWS.S3();

exports.handler = async (event) => {
	console.log(event);
	if (!event.body) {
		throw new Error("event.body is not defined");
	}
	const body = JSON.parse(event.body);
    if (!body.name) { 
		throw new Error("name of the file is required");
	}
  
    const multipartParams = {
		Bucket: BUCKET_NAME,
		Key: body.name,
	}
  
	const multipartUpload = await s3.createMultipartUpload(multipartParams).promise()
  
	return {
		statusCode: 200,
		body: JSON.stringify({
			fileId: multipartUpload.UploadId,
			fileKey: multipartUpload.Key,
		  }),
		headers: {
		  'Access-Control-Allow-Origin': '*'
		}
	};
}