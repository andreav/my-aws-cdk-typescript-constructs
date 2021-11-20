import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import { mctcFargateNestedStack } from './mctcFargateNestedStack';
import { getOrCreateVpc } from './utils';

export interface mctcFargateCloudMapStackProps extends cdk.StackProps {
  vpcName?: string;
}

export class mctcFargateCloudMapStack extends cdk.Stack {
  protected vpc: ec2.IVpc;

  private appStack: mctcFargateNestedStack;
  private dbStack: mctcFargateNestedStack;

  private cloudMapNamespace: servicediscovery.IPrivateDnsNamespace;
  private cloudMapService_app: servicediscovery.Service;
  private cloudMapService_db: servicediscovery.Service;

  constructor(scope: cdk.Construct, id: string, props?: mctcFargateCloudMapStackProps) {
    super(scope, id, props);

    this.vpc = getOrCreateVpc(this, props?.vpcName)
    
    // Create Fargate services
    this.appStack = new mctcFargateNestedStack(this, 'phpMyAdminStack', {
      vpcName: "mctcVpcStack/Vpc",
      fargateServiceSubnetType: ec2.SubnetType.PUBLIC,

      image: "phpmyadmin",
      containerEnv: {
        "MYSQL_ROOT_PASSWORD": "testrootpwd",
        "PMA_HOST": "dbsrv.mctc.com"  // <-- here we "link" app with db
      },
      // portMappings: [[8080, 80]]   // getting: Host port (80) must be left out or equal to container port 8080 for network mode awsvpc
      portMappings: [[80]],
      securityGroups: [80]
    });

    this.dbStack = new mctcFargateNestedStack(this, 'mariadb', {
      vpcName: "mctcVpcStack/Vpc",
      fargateServiceSubnetType: ec2.SubnetType.PRIVATE_WITH_NAT,

      image: "mariadb",
      containerEnv: {
        "MYSQL_ROOT_PASSWORD": "testrootpwd",
      },
      portMappings: [[3306]],
      securityGroups: [3306]
    });

    // Create Namespace
    this.cloudMapNamespace = new servicediscovery.PrivateDnsNamespace(this, `ServiceDiscoveryNamespace`, {
      name: 'mctc.com',
      vpc: this.vpc
    });

    // Register first service
    this.cloudMapService_app = new servicediscovery.Service(this, `ServiceDiscovery_app`, {
      namespace: this.cloudMapNamespace,
      dnsRecordType: servicediscovery.DnsRecordType.A,
      dnsTtl: cdk.Duration.seconds(60),
      name: 'appsrv', // will be used as a subdomain of the domain set in the namespace
      routingPolicy: servicediscovery.RoutingPolicy.WEIGHTED,
      loadBalancer: true, // Important! If you choose WEIGHTED but don't set this, the routing policy will default to MULTIVALUE instead
      /*
       * Cannot specify `healthCheckConfig` for a Private DNS namespace.
       * Route 53 health checkers are public and they can only monitor hosts with IP addresses that are publicly routable on the internet
       * refs - https://aws.amazon.com/blogs/networking-and-content-delivery/performing-route-53-health-checks-on-private-resources-in-a-vpc-with-aws-lambda-and-amazon-cloudwatch/
       */
      // healthCheck: {
      //   type: servicediscovery.HealthCheckType.HTTPS,
      //   resourcePath: '/login',
      //   failureThreshold: 2,
      // },
    })

    this.appStack.service.associateCloudMapService({
      service: this.cloudMapService_app
    })

    // Register second service
    this.cloudMapService_db = new servicediscovery.Service(this, `ServiceDiscovery_db`, {
      namespace: this.cloudMapNamespace,
      dnsRecordType: servicediscovery.DnsRecordType.A,
      dnsTtl: cdk.Duration.seconds(60),
      name: 'dbsrv', // will be used as a subdomain of the domain set in the namespace
      routingPolicy: servicediscovery.RoutingPolicy.WEIGHTED,
      loadBalancer: true, // Important! If you choose WEIGHTED but don't set this, the routing policy will default to MULTIVALUE instead
    })

    this.dbStack.service.associateCloudMapService({
      service: this.cloudMapService_db
    })
  }
}
