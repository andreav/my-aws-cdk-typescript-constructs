#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { mctcVpcStack } from '../lib/mctcVpcStack';
import { mctcFargateStack } from '../lib/mctcFargateStack';
import { mctcEc2Stack } from '../lib/mctcEc2Stack';
import { Fn } from '@aws-cdk/core';
import { SubnetType } from '@aws-cdk/aws-ec2';
import { mctcFargateAlbStack } from '../lib/mctcFargateAlbStack';

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
  fargateServiceSubnetType: SubnetType.PUBLIC
});

new mctcFargateStack(app, 'mctcFargatePrivateStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateServiceSubnetType: SubnetType.PRIVATE_WITH_NAT
});

new mctcFargateAlbStack(app, 'mctcFargateAlbPublicStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateServiceSubnetType: SubnetType.PRIVATE_WITH_NAT,
  desiredCount: 2,
  albSubnetType: SubnetType.PUBLIC
});

new mctcFargateAlbStack(app, 'mctcFargateAlbPrivatetack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcName: "mctcVpcStack/Vpc",
  fargateServiceSubnetType: SubnetType.PRIVATE_WITH_NAT,
  desiredCount: 2,
  albSubnetType: SubnetType.PRIVATE_WITH_NAT
});