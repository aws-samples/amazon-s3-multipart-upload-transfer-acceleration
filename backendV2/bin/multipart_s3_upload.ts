#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MultipartS3UploadStack } from '../lib/multipart_s3_upload-stack';

const app = new cdk.App({});
new MultipartS3UploadStack(app, 'MultipartS3UploadStack', {
    
});
