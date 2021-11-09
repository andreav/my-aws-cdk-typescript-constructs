#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MyCdkTsCostructsStack } from '../lib/my-cdk-ts-costructs-stack';
import { mctcVpcStack } from '../lib/mctcVpcStack';
import { mctcFargatePublicStack } from '../lib/mctcFargatePublic';
import { Fn } from '@aws-cdk/core';

const app = new cdk.App();
new MyCdkTsCostructsStack(app, 'MyCdkTsCostructsStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});


new mctcVpcStack(app, 'mctcVpcStack', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new mctcFargatePublicStack(app, 'mctcFargatePublic', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc"
});

