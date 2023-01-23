const AWS = require('aws-sdk');
const s3UrlLib = require('./makePreSignedUrls')
const BUCKET_NAME = process.env['BUCKET_NAME'];
const URL_EXPIRES = process.env['URL_EXPIRES'];

const s3 = new AWS.S3({useAccelerateEndpoint: true});

exports.handler = async (event) => {
	console.log(event);
	if (event.body !== null && event.body !== undefined) {
		const partSignedUrlList = await s3UrlLib.makePreSignedUrls(s3,BUCKET_NAME,URL_EXPIRES,event.body)
		return {
			statusCode: 200,
			body: JSON.stringify({
				parts: partSignedUrlList,
			}),
			headers: {
				'Access-Control-Allow-Origin': '*'
			}
		};	
    }else{
		throw new Error("event.body is not defined");
	}    
}
