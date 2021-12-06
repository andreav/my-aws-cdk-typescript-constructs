import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as iam from "@aws-cdk/aws-iam";
import * as child from 'child_process';

export function getOrCreateVpc(stack: cdk.Stack, vpcName?: string): ec2.IVpc {
    let vpc: ec2.IVpc
    if (vpcName) {
        vpc = ec2.Vpc.fromLookup(stack, "Vpc", {
            vpcName: vpcName
        })
    } else {
        vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
    }
    return vpc
}

export function getFargateCluster(stack: cdk.Stack, vpc: ec2.IVpc, clusterName: string): ecs.ICluster {
    const fargateCluster = ecs.Cluster.fromClusterAttributes(
        stack,
        "FargateCluster",
        {
            vpc: vpc,
            clusterName: clusterName,
            securityGroups: []
        }
    );

    return fargateCluster;
}

export function getFargateService(stack: cdk.Stack, fargateCluster: ecs.ICluster, serviceName: string): ecs.IBaseService {
    const fargateService = ecs.FargateService.fromFargateServiceAttributes(
        stack,
        "FargateService",
        {
            cluster: fargateCluster,
            serviceName: serviceName
        }
    );

    return fargateService;
}

export function getCurrentUser(stack: cdk.Stack): iam.IUser {
    const calleIdentity = child.spawnSync('aws', ['sts', 'get-caller-identity', '--output', 'text', '--query', 'Arn'])
    const arn = calleIdentity.stdout.toString().slice(0, -1);
    console.log("callerIdentity: arn", arn);
    if (calleIdentity.stderr.toString()) {
        console.log("callerIdentity: stderr: ", calleIdentity.stderr.toString());
    }

    const userCli = iam.User.fromUserArn(
        stack,
        'current-user-by-arn',
        arn,
    );
    return userCli;
}