#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { mctcVpcStack } from '../lib/mctcVpcStack';
import { mctcFargatePublicStack } from '../lib/mctcFargatePublicStack';
import { mctcFargatePrivateStack } from '../lib/mctcFargatePrivateStack';
import { mctcEc2PublicStack } from '../lib/mctcEc2Stack';
import { Fn } from '@aws-cdk/core';

const app = new cdk.App();

new mctcVpcStack(app, 'mctcVpcStack', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new mctcFargatePublicStack(app, 'mctcFargatePublicStack', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc"
});

new mctcFargatePrivateStack(app, 'mctcFargatePrivateStack', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc"
});

new mctcEc2PublicStack(app, 'mctcEc2PublicStack', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  sshKeyPairName: "McdcKeyPair-eu-west-1",
});