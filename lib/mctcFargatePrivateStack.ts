import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import { getOrCreateVpc } from './utils';

export interface mctcFargatePrivateProps extends cdk.StackProps {
  vpcName?: string;
}

export class mctcFargatePrivateStack extends cdk.Stack {
  private vpc: ec2.IVpc;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargatePrivateProps) {
    super(scope, id, props);

    this.vpc = getOrCreateVpc(this, props?.vpcName)

    // Cluster
    const cluster = new ecs.Cluster(this, 'Ec2Cluster', { vpc: this.vpc });

    // Standard ECS service setup
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');
    const container = taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 256,
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP
    });

    //Security group ingress
    const serviceSecGrp = new ec2.SecurityGroup(
      this,
      `FargateAloneServiceSecurityGroup`,
      {
        allowAllOutbound: true,
        securityGroupName: `FargateAloneServiceSecurityGroup`,
        vpc: this.vpc,
      }
    );

    serviceSecGrp.connections.allowFromAnyIpv4(ec2.Port.tcp(80));


    const service = new ecs.FargateService(this, "Service", {
      cluster: cluster,
      taskDefinition,
      assignPublicIp: false,
      securityGroups: [serviceSecGrp]
    });
  }
}
