import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import { getOrCreateVpc } from './utils';
import { SubnetType } from '@aws-cdk/aws-ec2';
import { FargatePlatformVersion } from '@aws-cdk/aws-ecs';

export interface mctcFargateNestedStackProps extends cdk.NestedStackProps {
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

export class mctcFargateNestedStack extends cdk.NestedStack {
  public vpc: ec2.IVpc;
  public cluster: ecs.Cluster;
  public taskDefinition: ecs.FargateTaskDefinition;
  public container: ecs.ContainerDefinition;
  public serviceSecGrp: ec2.SecurityGroup[];
  public service: ecs.FargateService;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateNestedStackProps) {
    super(scope, id, props);

    this.vpc = getOrCreateVpc(this, props?.vpcName)

    // Cluster
    this.cluster = new ecs.Cluster(this, 'Ec2Cluster', {
      vpc: this.vpc,
      clusterName: `Cluster${id}`
    });

    // Standard ECS service setup
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: `Task${id}`
    });

    const imageName = props?.image ?? "amazon/amazon-ecs-sample"
    this.container = this.taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry(imageName),
      // image: ecs.ContainerImage.fromRegistry(props?.image ?? "praqma/network-multitool"),
      memoryLimitMiB: 256,
      environment: props?.containerEnv,
      logging: ecs.LogDriver.awsLogs({ streamPrefix: imageName }),
    });

    // const mapping = props?.portMappings ?? [[80]]
    if (props?.portMappings) {
      props.portMappings.forEach(port => {
        this.container.addPortMappings({
          containerPort: port[0],
          hostPort: port[1] ?? port[0],
          protocol: ecs.Protocol.TCP
        });
      });
    }

    //Security group ingress
    // const securityGroups: number[] = props?.securityGroups ?? [80]
    if (props?.securityGroups) {
      this.serviceSecGrp = props.securityGroups.map(port => {
        const name = `${id}SecurityGroup_${port}`
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
      })
    }

    this.service = new ecs.FargateService(this, "Service", {
      cluster: this.cluster,
      serviceName: `Service${id}`,
      taskDefinition: this.taskDefinition,
      assignPublicIp: props?.fargateServiceSubnetType == SubnetType.PUBLIC ? true : false,
      securityGroups: this.serviceSecGrp,
      desiredCount: props?.desiredCount,
      // mandatory for mounting EFS volumes
      platformVersion: FargatePlatformVersion.VERSION1_4
    });

    new cdk.CfnOutput(this, `Fargate Cluster ARN`, { value: this.cluster.clusterArn });
    new cdk.CfnOutput(this, `Fargate Service ARN`, { value: this.service.serviceArn });
  }
}
