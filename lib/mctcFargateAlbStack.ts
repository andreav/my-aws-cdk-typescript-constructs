import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import { IVpc, SubnetType } from '@aws-cdk/aws-ec2';
import { mctcFargateStack, mctcFargateStackProps } from './mctcFargateStack';

export interface mctcFargateAlbStackProps extends mctcFargateStackProps {
  desiredCount: number;

  // Where to place ALB
  albSubnetType: SubnetType;
}

export class mctcFargateAlbStack extends mctcFargateStack {
  protected alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateAlbStackProps) {
    super(scope, id, props);

    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: this.vpc,
      internetFacing: props?.albSubnetType == SubnetType.PUBLIC ? true : false
    });
    const listener = this.alb.addListener('PublicListener', { port: 80, open: true });
    
    // Attach ALB to ECS Service
    listener.addTargets('ECS', {
      port: 80,
      // this syntax is more powerful - refs https://github.dev/aws-samples/aws-cdk-examples
      targets: [this.service.loadBalancerTarget({
        containerName: 'web',
        containerPort: 80
      })],
      // include health check (default is none)
      healthCheck: {
        interval: cdk.Duration.seconds(60),
        path: "/",
        timeout: cdk.Duration.seconds(5),
      }
    });
    
  }
}