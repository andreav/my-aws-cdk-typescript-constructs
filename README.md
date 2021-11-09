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
```

# Stacks from this project

* mctcVpcStack

  simply create a VPC across 2 AZ before launching other stacks (next stack will create faster)

* mctcEc2PublicStack

  An EC2 instance taken from  [here](https://github.dev/aws-samples/aws-cdk-examples)

  Optionally create a KeyPair before deploying and connect through the command shown in the output of the stack.

      ssh -i my-ssh-key.pem -o IdentitiesOnly=yes ec2-user@<ec2PublicIp>
  

* mctcFargatePublicStack
  
  One fargate container with public access.
After deploy, you can reach the container on the public ip at port 80

* mctcFargatePrivateStack

   Same as before, but not reachable from the outside
After deploy, you can reach the container on the prinvate ip at port 80
Useful for internal sage (i.e. accessing the container only by a VPN)

# Deploy

```
cdk deploy mctcVpcStack 
cdk deploy mctcEc2PublicStack 
cdk deploy mctcFargatePublicStack
cdk deploy mctcFargatePrivateStack
```

# Attention

If you deploy first a Vpc, then Fargate, then you destroy both, next time you have to clear the context by issueing:

    cdk context  --clear 
