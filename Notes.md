# Stack FargatePublicStack

Cannot reach the server on port 80 until I put `assignPublicIp: true` on service  
Now the task is in the public subnet

# Stack FargatePrivateStack

Why I cannot reach the private service by using the private IP and Cloudshell? 
Because CloudShell still not have access to private network.

To test it is working:

1. deploy FagatePrivateStack
1. deploy Ec2Stack with SSH keyPair
1. connect to EC2
1. curl <Task_pivate_ip>

You will see the response from the server

# Stack FargateEfsStack

Key points:
* use platform version 1.4
* allow inbound and outbound communication on port 2049 (default for efs) between fargate service adnd efs
  Otherwise task creation stops with error: 
  
  `ResourceInitializationError: failed to invoke EFS utils commands to set up EFS volumes: stderr: b'mount.nfs4: Connection timed out' : unsuccessful EFS utils command execution; code: 32) `

# CDK Update
When strange typescript errors happen, try updating cdk.  
find the new version, update all occurrences into package.json  
npm install  
and they could disappear

# IAM considerations
* a role can be asseumed by someone
* a role has policies (i.e. inline, managed)
* a policy has statements stating: what action is allowed/denied on which resource

If you do not specify nothing, CDK magically makes all for you  
If you need more permissions, reference the entity role, usually you find a role property, and use any addManagedPolicy or addPolicy  
Also you can use grantXXX to allow you to grant other resources access to that resource (`repository.grantPullPush`)  

mctcFargateECRBuildStack example. We need to push/pull/login from codebuild action to ECR repository

CDK simplifyies:

* `ecrRepository.grantPullPush(codebuildProject.role!)`
* If you inspect IAM, PipelineProject has access only to that repository

Manually more complex:

* Create role assumedBy 'codebuild.amazonaws.com' with managedPolicy: AmazonEC2ContainerRegistryPowerUser
* Attach thet role to codebuild PipelineProject
* If you inspect IAM, PipelineProject has access to all resources, still have to tune policy

# TODOs

- [x] Add Volume on EFS
- [x] Add CloudMap example
  * Deploy mysql image  
  * Deploy phpmyadmin image ([here](https://hub.docker.com/_/phpmyadmin))
- [x] Add ECR example
  * Create a repository
  * Build an image
  * Push an image
  * Update ECS through pipeline 
* [x] Add pipeline example triggered by s3 file upload updating imagedefinition
* [ ] Add pipeline example (building image from src code. projet and infrastructure in the same repo)
* [x] Update a ECS Task through CLI