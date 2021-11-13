import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import { getOrCreateVpc } from './utils';
import { SubnetType } from '@aws-cdk/aws-ec2';

export interface mctcFargateStackProps extends cdk.StackProps {
  vpcName?: string;

  // Where to place Service
  fargateServiceSubnetType: ec2.SubnetType;

  desiredCount?: number;
}

export class mctcFargateStack extends cdk.Stack {
  protected vpc: ec2.IVpc;
  protected cluster: ecs.Cluster;
  protected taskDefinition: ecs.FargateTaskDefinition;
  protected containerWeb: ecs.ContainerDefinition;
  protected serviceSecGrp: ec2.SecurityGroup;
  protected service: ecs.FargateService;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateStackProps) {
    super(scope, id, props);

    this.vpc = getOrCreateVpc(this, props?.vpcName)

    // Cluster
    this.cluster = new ecs.Cluster(this, 'Ec2Cluster', { vpc: this.vpc });

    // Standard ECS service setup
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');
    this.containerWeb = this.taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 256,
    });

    this.containerWeb.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP
    });

    //Security group ingress
    this.serviceSecGrp = new ec2.SecurityGroup(
      this,
      `FargateAloneServiceSecurityGroup`,
      {
        allowAllOutbound: true,
        securityGroupName: `FargateAloneServiceSecurityGroup`,
        vpc: this.vpc,
      }
    );

    this.serviceSecGrp.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

    this.service = new ecs.FargateService(this, "Service", {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      assignPublicIp: props?.fargateServiceSubnetType == SubnetType.PUBLIC ? true : false,
      securityGroups: [this.serviceSecGrp, ...this.fargateServiceExtraSecurityGroups()],
      desiredCount: props?.desiredCount
    });
  }

  protected fargateServiceExtraSecurityGroups(): ec2.SecurityGroup[] {
    return []
  }
}
