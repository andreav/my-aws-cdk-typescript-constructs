import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";

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