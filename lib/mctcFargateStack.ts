import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import { getOrCreateVpc } from './utils';
import { SecurityGroup, SubnetType } from '@aws-cdk/aws-ec2';
import { FargatePlatformVersion } from '@aws-cdk/aws-ecs';

export interface mctcFargateStackProps extends cdk.StackProps {
  vpcName?: string;

  // Where to place Service
  fargateServiceSubnetType: ec2.SubnetType;

  desiredCount?: number;

  image?: string;

  containerEnv?: { [key: string]: string; } | undefined;

  portMappings?: number[];
  securityGroups?: number[];
}

export class mctcFargateStack extends cdk.Stack {
  protected vpc: ec2.IVpc;
  protected cluster: ecs.Cluster;
  protected taskDefinition: ecs.FargateTaskDefinition;
  protected container: ecs.ContainerDefinition;
  protected serviceSecGrp: ec2.SecurityGroup[];
  protected service: ecs.FargateService;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateStackProps) {
    super(scope, id, props);

    this.vpc = getOrCreateVpc(this, props?.vpcName)

    // Cluster
    this.cluster = new ecs.Cluster(this, 'Ec2Cluster', { vpc: this.vpc });

    // Standard ECS service setup
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');

    this.container = this.taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry(props?.image ?? "amazon/amazon-ecs-sample"),
      // image: ecs.ContainerImage.fromRegistry(props?.image ?? "praqma/network-multitool"),
      memoryLimitMiB: 256,
      environment: props?.containerEnv
    });

    const mapping = props?.portMappings ?? [80]
    mapping.forEach(port => {
      this.container.addPortMappings({
        containerPort: port,
        protocol: ecs.Protocol.TCP
      });
    });

    //Security group ingress
    const securityGroups: number[] = props?.securityGroups ?? [80]
    this.serviceSecGrp = securityGroups.map(secGroup => this.Util_Allow_Port(secGroup));

    this.service = new ecs.FargateService(this, "Service", {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      assignPublicIp: props?.fargateServiceSubnetType == SubnetType.PUBLIC ? true : false,
      securityGroups: this.serviceSecGrp,
      desiredCount: props?.desiredCount,
      // mandatory for mounting EFS volumes
      platformVersion:  FargatePlatformVersion.VERSION1_4
    });
  }

  // Utiltities
  protected Util_Allow_Port(port: number): ec2.SecurityGroup {
    const name = `FargateAloneServiceSecurityGroup_${port}`
    const serviceSecGrp = new ec2.SecurityGroup(
      this,
      name,
      {
        allowAllOutbound: true,
        securityGroupName: name,
        vpc: this.vpc,
      }
    );

    serviceSecGrp.connections.allowFromAnyIpv4(ec2.Port.tcp(port));
    return serviceSecGrp;
  }


}
