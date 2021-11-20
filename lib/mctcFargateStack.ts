import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import {  SubnetType } from '@aws-cdk/aws-ec2';
import { mctcFargateNestedStack } from './mctcFargateNestedStack';

export interface mctcFargateStackProps extends cdk.StackProps {
  vpcName?: string;

  // Where to place Service
  fargateServiceSubnetType: ec2.SubnetType;

  desiredCount?: number;

  image?: string;

  containerEnv?: { [key: string]: string; } | undefined;

  portMappings?: [number, number?][];

  // simply allow any tcp ingress to these ports
  securityGroups?: number[];
}

export class mctcFargateStack extends cdk.Stack {
  fargateStack: mctcFargateNestedStack;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateStackProps) {
    super(scope, id, props);

    this.fargateStack = new mctcFargateNestedStack(this, id, {
      vpcName: props?.vpcName,
      fargateServiceSubnetType: props?.fargateServiceSubnetType ?? SubnetType.PRIVATE_WITH_NAT,
      desiredCount: props?.desiredCount,
      image: props?.image,
      containerEnv: props?.containerEnv,
      portMappings: props?.portMappings,
      securityGroups: props?.securityGroups
    })
  }
}
