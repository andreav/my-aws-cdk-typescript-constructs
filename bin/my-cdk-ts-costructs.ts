#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { mctcVpcStack } from '../lib/mctcVpcStack';
import { mctcEc2Stack } from '../lib/mctcEc2Stack';
import { SubnetType } from '@aws-cdk/aws-ec2';
import { mctcFargateStack } from '../lib/mctcFargateStack';
import { mctcFargateAlbStack } from '../lib/mctcFargateAlbStack';
import { mctcFargateEfsStack } from '../lib/mctcFargateEfsStack';
import { mctcFargateCloudMapStack } from '../lib/mctcFargateCloudMapStack';
import { mctcFargateUpdateCodePipelineS3Stack } from '../lib/update-fargate/mctcFargateUpdateCodePipelineS3Stack';

const app = new cdk.App();

new mctcVpcStack(app, 'mctcVpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new mctcEc2Stack(app, 'mctcEc2PublicStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  sshKeyPairName: "McdcKeyPair-eu-west-1",
  subnetType: SubnetType.PUBLIC,
});

new mctcEc2Stack(app, 'mctcEc2PrivateStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  subnetType: SubnetType.PRIVATE_WITH_NAT,
  sshKeyPairName: "McdcKeyPair-eu-west-1",
});

new mctcFargateStack(app, 'mctcFargatePublicStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateServiceSubnetType: SubnetType.PUBLIC,

  portMappings: [[80]],
  securityGroups: [80]
});

new mctcFargateStack(app, 'mctcFargatePrivateStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateServiceSubnetType: SubnetType.PRIVATE_WITH_NAT,
  
  portMappings: [[80]],
  securityGroups: [80]
});

new mctcFargateAlbStack(app, 'mctcFargateAlbPublicStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateServiceSubnetType: SubnetType.PRIVATE_WITH_NAT,
  desiredCount: 2,
  albSubnetType: SubnetType.PUBLIC,
  
  portMappings: [[80]],
  securityGroups: [80]
});

new mctcFargateAlbStack(app, 'mctcFargateAlbPrivatetack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateServiceSubnetType: SubnetType.PRIVATE_WITH_NAT,
  desiredCount: 2,
  albSubnetType: SubnetType.PRIVATE_WITH_NAT,
  
  portMappings: [[80]],
  securityGroups: [80]
});

new mctcFargateEfsStack(app, 'mctcFargateEfsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateServiceSubnetType: SubnetType.PUBLIC,

  // an image allowing ssh connection
  image: "hermsi/alpine-sshd",
  containerEnv: {
    "ROOT_LOGIN_UNLOCKED": "true",
    "ROOT_PASSWORD": "root"
  },
  portMappings: [[22]],
  securityGroups: [22],

  desiredCount: 2,

  mountPath: "/mount-efs"
});

new mctcFargateCloudMapStack(app, 'mctcFargateCloudMapStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
});

new mctcFargateUpdateCodePipelineS3Stack(app, 'mctcFargateUpdateCodePipelineS3Stack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateClusterName: "mctcFargateAlbPublicStack-mctcFargateAlbPublicStackNestedStackmctcFargateAlbPublicStac-1VY52SIEDFC03-Ec2ClusterEE43E89D-C2Y3F4JJNYtL",
  fargateServiceName: "mctcFargateAlbPublicStack-mctcFargateAlbPublicStackNestedStackmctcFargateAlbPublicStac-1VY52SIEDFC03-ServiceD69D759B-EqvtX9lv4eJZ",
  pipelineUploadBucketName: "mctc-pipeline-upload-bucket"
});