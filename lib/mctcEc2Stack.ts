import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'
import * as path from 'path';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { getOrCreateVpc } from "./utils";
import { SubnetType } from "@aws-cdk/aws-ec2";

export interface mctcEc2PublicStackProps extends cdk.StackProps {
    vpcName?: string;

    // Must be previuusly created from CLI
    sshKeyPairName?: string;

    userDataScriptPath?: string;
}

export class mctcEc2PublicStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: mctcEc2PublicStackProps) {
        super(scope, id, props);

        const vpc = getOrCreateVpc(this, props?.vpcName)

        // Allow SSH (TCP Port 22) access from anywhere
        const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc,
            description: 'Allow SSH (TCP port 22) in',
            allowAllOutbound: true
        });
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Access')

        const role = new iam.Role(this, 'ec2Role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
        })

        // best practices https://aws.amazon.com/blogs/mt/applying-managed-instance-policy-best-practices/
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))

        // Use Latest Amazon Linux Image - CPU Type ARM64
        const ami = new ec2.AmazonLinuxImage({
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            cpuType: ec2.AmazonLinuxCpuType.X86_64
        });

        const ec2Instance = new ec2.Instance(this, 'Instance', {
            vpc,
            vpcSubnets: {
                subnetType: props?.sshKeyPairName ? SubnetType.PUBLIC : SubnetType.PRIVATE,
            },
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
            machineImage: ami,
            securityGroup: securityGroup,
            keyName: props?.sshKeyPairName,
            role: role
        });

        if (props?.userDataScriptPath) {
            // Create an asset that will be used as part of User Data to run on first load
            const asset = new Asset(this, 'Asset', { path: path.join(__dirname, props.userDataScriptPath) });
            const localPath = ec2Instance.userData.addS3DownloadCommand({
                bucket: asset.bucket,
                bucketKey: asset.s3ObjectKey,
            });

            ec2Instance.userData.addExecuteFileCommand({
                filePath: localPath,
                arguments: '--verbose -y'
            });
            asset.grantRead(ec2Instance.role);
        }

        // Create outputs for connecting
        new cdk.CfnOutput(this, 'IP Address', { value: ec2Instance.instancePublicIp });

        if (props?.sshKeyPairName) {
            new cdk.CfnOutput(this, 'Key Name', { value: props?.sshKeyPairName ?? "No SSH Key" })
            new cdk.CfnOutput(this, 'ssh command', { value: 'ssh -i cdk-key.pem -o IdentitiesOnly=yes ec2-user@' + ec2Instance.instancePublicIp })
        }
    }
}