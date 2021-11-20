import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as efs from "@aws-cdk/aws-efs";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import { mctcFargateStackProps } from './mctcFargateStack';
import { mctcFargateNestedStack } from './mctcFargateNestedStack';
import { RemovalPolicy } from '@aws-cdk/core';

export interface mctcFargateEfsStackProps extends mctcFargateStackProps {
  mountPath: string;
}

export class mctcFargateEfsStack extends cdk.Stack {
  protected volumeConfig: ecs.Volume;
  protected mountPointConfig: ecs.MountPoint;
  fargateStack: mctcFargateNestedStack;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateEfsStackProps) {
    super(scope, id, props);

    this.fargateStack = new mctcFargateNestedStack(this, id, props);

    const fileSystem = new efs.FileSystem(this, 'FargateEfsFileSystem', {
      vpc: this.fargateStack.vpc,
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
    this.fargateStack.taskDefinition.addVolume(this.volumeConfig)

    this.mountPointConfig =
    {
      containerPath: props?.mountPath ?? "/mounted",
      sourceVolume: this.volumeConfig.name,
      readOnly: false,
    }

    // Mount volume to conatainer
    this.fargateStack.container.addMountPoints(this.mountPointConfig);

    // Need to add permissions to and from the file system to the target,
    // or else the task will timeout trying to mount the file system.
    this.fargateStack.service.connections.allowFrom(fileSystem, ec2.Port.tcp(2049));
    this.fargateStack.service.connections.allowTo(fileSystem, ec2.Port.tcp(2049));
  }

}
