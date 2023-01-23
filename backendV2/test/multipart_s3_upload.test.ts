import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as MultipartS3Upload from '../lib/multipart_s3_upload-stack';

test('SQS Queue and SNS Topic Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new MultipartS3Upload.MultipartS3UploadStack(app, 'MyTestStack');
  // THEN

  const template = Template.fromStack(stack);

});
