# Stacks from this project

* ## VPC - mctcVpcStack

  simply create a VPC across 2 AZ before launching other stacks (next stack will create faster)

  &nbsp;

* ## EC2 Public with SSH - mctcEc2PublicStack

  An EC2 instance taken from  [here](https://github.dev/aws-samples/aws-cdk-examples)

  Optionally create a KeyPair before deploying and connect through the command shown in the output of the stack.

      ssh -i my-ssh-key.pem -o IdentitiesOnly=yes ec2-user@<ec2PublicIp>
  
  &nbsp;
* ## EC2 Private with SSH - mctcEc2PrivateStack

  An EC2 instance in the private subnet

  &nbsp;
* ## Nested Stack - mctcFargateNestedStack

  This stack is used to simplyfy fargate creation and put focus only on the important differenes between stacks 

  &nbsp;
* ## FARGATE Public - mctcFargatePublicStack
  
  One fargate container with public access.
  After deploy, you can reach the container on the public ip at port 80

  &nbsp;
* ## FARGATE Private - mctcFargatePrivateStack

  Same as before, but not reachable from the outside  
  After deploy, you can reach the container on the prinvate ip at port 80  
  Useful for private usage (i.e. accessing the container only by a VPN)  
  For instance you can deploy a public EC2 and test reachability through curl once logged in by ssh

  &nbsp;
* ## ALB Public - mctcFargateAlbPublicStack
  
  Two fargate tasks accessed through ALB
  Tasks run in private network, reachable only through ALB, they have only private IP
  After deploy, you can reach the containers using the DNS name provided by the Alb

  &nbsp;
* ## ALB Private - mctcFargateAlbPrivatetack
  
  Two fargate tasks accessed through ALB
  Tasks and ALB run in private network  
  After deploy, you can reach the containers using the DNS name provided by the ALB but not from the outside  
  For instance you can deploy a public EC2 and test reachability through curl once logged in by ssh

  &nbsp;
* ## EFS - mctcFargateEfsStack

    Two fargate tasks accessed only throught public IP  (no ALB)  
    They both share same EFS volume mounted at /mount-efs  
    For testing purposes, an image with ssh access is used
    
    * Connecting to port 22 of one task  
      `ssh root@<public_ip_1>  (pass: root)`
    * touch a file under /mount-efs
    * connect two second task:  
      `ssh root@<public_ip_2>  (pass: root)`
    * ls /moun-efs and see the file created on the other task

  &nbsp;
* ## Cloud Map (service discovery) - mctcFargateCloudMapStack

    Two fargate services connected via cloudmap for service discovery
    * first service: is phpmyadmin  
      Exposed via public ip on port 80
    * second service: mariadb  
      in private network

    phpmyadmin reaches mariadb service discovery by cloudmap

    For testing purposes, cpnnect to public ip of first service and use test credential:
    * user: root
    * pawd: testrootpwd



  &nbsp;
# Deploy

You can deploy first the mctcVpcStack and then any of the other stack (for faster testing)

```
cdk deploy mctcVpcStack
```

```
cdk deploy mctcEc2PublicStack
cdk deploy mctcEc2PrivateStack

cdk deploy mctcFargatePublicStack
cdk deploy mctcFargatePrivateStack

cdk deploy mctcFargateAlbPublicStack
cdk deploy mctcFargateAlbPrivatetack

cdk deploy mctcFargateEfsStack

cdk deploy mctcFargateCloudMapStack
```

# Attention

If you deploy first a Vpc, then Fargate, then you destroy both, next time you have to clear the context by issueing:

    cdk context  --clear 


# Setup Development environment

- OS: Ubuntu 20.04
* Installing node
    ```
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt install -y nodejs
    node -v
    sudo apt install npm
    npm  -v
    ```

* Installing aws cli
  ```
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

- Configure aws cli
  ```
  aws configure
  ```

- Testing aws cli
  ```
  aws sts get-caller-identity
  ```

* Installing CDK 
  ```
  sudo npm install -g aws-cdk
  cdk doctor
  ```

# Creating an example project

```
mkdir my-cdk-ts-constructs
cd my-cdk-ts-constructs

cdk init app --language typescript

npm install @aws-cdk/aws-ec2
npm install @aws-cdk/aws-ecs
npm install @aws-cdk/aws-iam
npm install @aws-cdk/aws-elasticloadbalancingv2
npm install @aws-cdk/aws-efs
npm install @aws-cdk/aws-servicediscovery
```

