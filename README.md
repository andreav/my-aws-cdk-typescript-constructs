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
* ## Update Fargate Service with code pipleline triggered by S3 upload

    Trying to update service image from CDK: upload the new image tag to S3.
    S3 upload will trigger a pipeline which updates the container image.
    S3 file must be a zipped file named `imagedefinitions.zip` containing an [imagedefinitions.json](https://docs.aws.amazon.com/codepipeline/latest/userguide/file-reference.html) file.

    * first deploy a vpc and a fargate stack from this repo (for example mctcFargateAlbPublicStack)
      ```
      npx cdk deploy mctcVpcStack
      npx cdk deploy mctcFargateAlbPublicStack
      ```

    * Then deploy the pipeline which will monitor the S3 bucket for imagedefinitions changes.  

      ```
      npx cdk deploy mctcFargatePublicStack     
      ```
      This will create:
      * a bucket named: "pipeline-source-bucket"
      * a codepipeline responsible for updating the ECS Service when a new imagedefinitions.json is uploaded
      
    * In the end create a zip file named `imagedefinitions.zip` containing a file named `imagedefinitions.json` with a valid format and upload it to previous bucket (this repo has one example file already in place). The container will be updated.
      ```
      aws s3 cp lib/update-fargate/s3pipeline/imagedefinitions.zip s3://mctc-pipeline-upload-bucket  # <-- bucket created when deploying codepipeline (tunable using stack prop)
      ```

      You will see four task under your cluster, two new `nginx/hello` running and responding from the load balancer and two draining `amazon/amazon-ecs-sample` in deprovisioning state.  
      During draining timeout all four task respond. If you refresh the page, sometimes the new, sometimes the draining tasks will serve the request.  
      After a while only two nginx task will survive

  &nbsp;

* ## Update Fargate Service by CLI

    This is not properly a stack but is part of my test for updating a container image inside an ECS service.  
    Credits to [acro5piano](https://github.com/acro5piano) on github [here](https://github.com/aws/aws-cli/issues/3064#issuecomment-817098886)
    
    * first deploy a vpc and a fargate stack from this repo (for example mctcFargateAlbPublicStack)
      ```
      npx cdk deploy mctcVpcStack
      npx cdk deploy mctcFargateAlbPublicStack
      ```

    * Then run the update command 

      ```
      ./lib/update-fargate/cli/run_update.sh
      ```

      * This will create a new task definition from the existing one, update the image tag
      * Then deploy the newly created task definition

      From now on the behaviour is the same as the same of the S3 triggered code pipeline

* ## Update Fargate Service when pushing a new image to ECR

    This stack goes on updating a container into a Fargate cluster when a new image is pushed to an ECR repository.  
    This is useful when you build the image outside the pipeline and just want an automatic "update on push" 
    
    * first deploy a vpc and a fargate stack from this repo (for example mctcFargatePublicStack)
      ```
      npx cdk deploy mctcVpcStack
      npx cdk deploy mctcFargatePublicStack
      ```

    * Then deploy the pipeline watching an ECR repo with these steps:
      * ECRSourceAction for triggering on push new image to ECR
      * CodeBuildAction reading variables from previous step and building an `imagedefinitions.json` artifact
      * ECSDeployAction accepting artifact from CodeBuildAction and updating fargate tasks according to imagedefinitions.json

      ```
      npx cdk deploy mctcFargateECRTriggetOnPush
      ```

    * Until now, pipeline has failed because no image is present into the repo.  
      Now simulate a build&push using the script `build_and_push_image_to_ecr.sh`  
      This script will first log into the ECR repository, then will build a fake image, tag it and push to ECR.

      ```
      ./lib/update-fargate/cli/run_update.sh
      ```

      Now the pipeline will trigger automatically again, receive infos through evironment variables about the new image, build the output artifact containing an imagedefinition, pass it to the last action which updates the containers.

      From now on, this is similar to the "Update Fargate Service by CLI". The new image will de deployed.

      Now, try isueing the build and push command again, another image will be pushed to the repo.  
      If you visit the plblic IP of the container the page will change

      ```
      ./lib/update-fargate/cli/run_update.sh
      ```

  &nbsp;
# Deploy

You can deploy first the mctcVpcStack and then any of the other stack (for faster testing)

```
npx cdk deploy mctcVpcStack --require-approval never
```

```
npx cdk deploy mctcEc2PublicStack
npx cdk deploy mctcEc2PrivateStack

npx cdk deploy mctcFargatePublicStack
npx cdk deploy mctcFargatePrivateStack

npx cdk deploy mctcFargateAlbPublicStack
npx cdk deploy mctcFargateAlbPrivatetack

npx cdk deploy mctcFargateEfsStack

npx cdk deploy mctcFargateCloudMapStack

npx cdk deploy mctcFargateCloudMapStack

npx cdk deploy mctcFargateUpdateCodePipelineS3Stack

npx cdk deploy mctcFargateECRTriggetOnPushProps

```

# Attention

If you deploy first a Vpc, then Fargate, then you destroy both, next time you have to clear the context by issueing:

    cdk context  --clear 

If you want to destroy stack, cdk still does not support destroying a no empty ECR repository. You can use CLI like this:

    aws ecr delete-repository --repository-name mctc-repo --force

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
npm install @aws-cdk/aws-codepipeline
npm install @aws-cdk/aws-codepipeline-actions
npm install @aws-cdk/aws-s3
npm install @aws-cdk/aws-ecr
npm install @aws-cdk/aws-codebuild
```

