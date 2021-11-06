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

# Deploy

```
cdk deploy mctcVpcStack 
cdk deploy mctcVpcFargateAlone
```

# Attention

If you deploy first a Vpc, then Fargate, then you destroy both, next time you have to clear the context by issueing:

    cdk context  --clear 
