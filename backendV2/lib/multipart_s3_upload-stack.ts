import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam"
import { BucketEncryption } from 'aws-cdk-lib/aws-s3';

export class MultipartS3UploadStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const env = cdk.Stack.of(this).node.tryGetContext('env');
    const expires = cdk.Stack.of(this).node.tryGetContext('urlExpiry') ?? '300';

    const s3Bucket = new s3.Bucket(this, "document-upload-bucket", {
      bucketName: `document-client-upload-${env}`,
      lifecycleRules: [{
        expiration: cdk.Duration.days(10),
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
      }],
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      transferAcceleration: true,
      cors: [{
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.PUT,
          s3.HttpMethods.POST,
        ],
        exposedHeaders: ['ETag'],
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const whitelistedIps = [cdk.Stack.of(this).node.tryGetContext('whitelistip')]

    const apiResourcePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['execute-api:Invoke'],
          principals: [new iam.AnyPrincipal()],
          resources: ['execute-api:/*/*/*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: ['execute-api:/*/*/*'],
          conditions: {
            'NotIpAddress': {
              "aws:SourceIp": whitelistedIps
            }
          }
        })
      ]
    })

    const apiGateway = new apigw.RestApi(this, 'multi-part-upload-api', {
      description: 'API for multipart s3 upload',
      restApiName: 'multi-part-upload-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,                
      },
      policy: apiResourcePolicy,
    });

    const initializeLambda = new lambda.Function(this, 'initializeHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda',{
        exclude: ['finalize.js','getPreSignedUrls.js','getPreSignedTAUrls.js','makePreSignedUrls.js']
      }),
      handler: 'initialize.handler',
      environment: {
        BUCKET_NAME: s3Bucket.bucketName
      },
      functionName: `multipart-upload-initialize-${env}`
    });
    const getPreSignedUrlsLambda = new lambda.Function(this, 'getPreSignedUrlsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda',{
        exclude: ['finalize.js','initialize.js','getPreSignedTAUrls.js']
      }),
      handler: 'getPreSignedUrls.handler',
      environment: {
        BUCKET_NAME: s3Bucket.bucketName,
        URL_EXPIRES: expires
      },
      functionName: `multipart-upload-getPreSignedUrls-${env}`
    });
    const getPreSignedTAUrlsLambda = new lambda.Function(this, 'getPreSignedTAUrlsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda',{
        exclude: ['finalize.js','initialize.js','getPreSignedUrls.js']
      }),
      handler: 'getPreSignedTAUrls.handler',
      environment: {
        BUCKET_NAME: s3Bucket.bucketName,
        URL_EXPIRES: expires
      },
      functionName: `multipart-upload-getPreSignedTAUrls-${env}`
    });
    const finalizeLambda = new lambda.Function(this, 'finalizeHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda',{
        exclude: ['getPreSignedUrls.js','initialize.js','getPreSignedTAUrls.js','makePreSignedUrls.js']
      }),
      handler: 'finalize.handler',
      environment: {
        BUCKET_NAME: s3Bucket.bucketName
      },
      functionName: `multipart-upload-finalize-${env}`
    });

    s3Bucket.grantReadWrite(initializeLambda);
    s3Bucket.grantReadWrite(getPreSignedUrlsLambda);
    s3Bucket.grantReadWrite(getPreSignedTAUrlsLambda);
    s3Bucket.grantReadWrite(finalizeLambda);

    apiGateway.root.addResource('initialize').addMethod('POST', new apigw.LambdaIntegration(initializeLambda));
    apiGateway.root.addResource('getPreSignedUrls').addMethod('POST', new apigw.LambdaIntegration(getPreSignedUrlsLambda));
    apiGateway.root.addResource('getPreSignedTAUrls').addMethod('POST', new apigw.LambdaIntegration(getPreSignedTAUrlsLambda));
    apiGateway.root.addResource('finalize').addMethod('POST', new apigw.LambdaIntegration(finalizeLambda));

    apiGateway.addUsagePlan('usage-plan', {
      name: 'consumerA-multi-part-upload-plan',
      description: 'usage plan for consumerA',
      apiStages: [{
        api: apiGateway,
        stage: apiGateway.deploymentStage,
      }],
      throttle: {
        rateLimit: 100,
        burstLimit: 200
      },
    });
  }
}
