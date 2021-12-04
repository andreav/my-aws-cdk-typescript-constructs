import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as ecs from "@aws-cdk/aws-ecs";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import { getFargateCluster, getFargateService, getOrCreateVpc } from '../../utils';

var path = require('path');

export interface mctcFargateUpdateCodePipelineS3StackProps extends cdk.StackProps {
  vpcName?: string;

  fargateClusterName: string;
  fargateServiceName: string;

  pipelineUploadBucketName: string;
}


export class mctcFargateUpdateCodePipelineS3Stack extends cdk.Stack {
  pipeline: codepipeline.Pipeline;
  pipelineSourceBucket: s3.IBucket;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateUpdateCodePipelineS3StackProps) {
    super(scope, id, props);

    /*
     * retrieve existing resources
     */
    const vpc = getOrCreateVpc(this, props?.vpcName)

    const fargateCluster = getFargateCluster(this, vpc, props?.fargateClusterName ?? "MANDATORY_fargateClusterName");

    const fargateService = getFargateService(this, fargateCluster, props?.fargateServiceName ?? "MANDATORY_fargateServiceName");

    /*
     * Create a bucket for uploading an imagedefinition.json and trigger a pipeline ecs update
     */
    this.pipelineSourceBucket = new s3.Bucket(this, 'BucketForUpdateECS', {
      versioned: true, // Needed to succesfully run deploy action 
      bucketName: props?.pipelineUploadBucketName,
      encryption: s3.BucketEncryption.KMS_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // destroy bucket when deleting stack 
      autoDeleteObjects: true                   // automatically delete items before destroying bucket (otherwise stack destroy fails) 
    });

    new cdk.CfnOutput(this, `Bucket Name for uploads`, { value: this.pipelineSourceBucket.bucketName });

    /*
     * Craete the pipeline
     */
    this.pipeline = new codepipeline.Pipeline(this, 'UpdateECSCodePipelineS3', {
      pipelineName: 'mctcPipelineS3',
      artifactBucket: this.pipelineSourceBucket,
      crossAccountKeys: false, // 1$ month,
    });

    const s3SorceOutputArtifact = new codepipeline.Artifact();

    this.pipeline.addStage({
      stageName: 'S3SourceStage',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: "S3SourceAction",
          bucket: this.pipelineSourceBucket,
          bucketKey: "imagedefinitions.zip",
          output: s3SorceOutputArtifact,
          // trigger: codepipeline_actions.S3Trigger.EVENTS, // default: S3Trigger.POLL
        })
      ]
    })

    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: "ECS-Service",
          service: fargateService,
          imageFile: s3SorceOutputArtifact.atPath('imagedefinitions.json'),
        })
      ]
    })
  }
}