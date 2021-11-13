import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as efs from "@aws-cdk/aws-efs";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import { mctcFargateStack, mctcFargateStackProps } from './mctcFargateStack';
import { RemovalPolicy } from '@aws-cdk/core';

export interface mctcFargateEfsStackProps extends mctcFargateStackProps {
  mountPath: string;

  // If sepcified, opens ssh 22 on fargate service
  // Must be previuusly created from CLI
  sshKeyPairName?: string;
}

export class mctcFargateEfsStack extends mctcFargateStack {
  protected alb: elbv2.ApplicationLoadBalancer;
  protected volumeConfig: ecs.Volume;
  protected mountPointConfig: ecs.MountPoint;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateEfsStackProps) {
    super(scope, id, props);

    const fileSystem = new efs.FileSystem(this, 'FargateEfsFileSystem', {
      vpc: this.vpc,
      encrypted: true,
      removalPolicy: RemovalPolicy.DESTROY,
      // lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      // performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      // throughputMode: efs.ThroughputMode.BURSTING
    });

    this.volumeConfig = {
      name: "FargateEfsVolume",
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId
      }
    }

    // Add vvolume to task definition
    this.taskDefinition.addVolume(this.volumeConfig)

    this.mountPointConfig =
    {
      containerPath: props?.mountPath ?? "/mounted",
      sourceVolume: this.volumeConfig.name,
      readOnly: false,
    }

    // Mount volume to conatainer
    this.containerWeb.addMountPoints(this.mountPointConfig);
  }

  /*
   * Add SSH access for testing purposes
   */
  fargateServiceExtraSecurityGroups(): ec2.SecurityGroup[] {

    // opens port 22 on container
    this.containerWeb.addPortMappings({
      containerPort: 22
    })

    // allow access
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroupFargateEfs_SSH', {
      vpc: this.vpc,
      description: 'Allow SSH (TCP port 22) in',
      allowAllOutbound: true
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Access')

    return [securityGroup]
  }
}
