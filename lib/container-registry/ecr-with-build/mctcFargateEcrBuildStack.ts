import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'
import * as ecr from "@aws-cdk/aws-ecr";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import * as codecommit from "@aws-cdk/aws-codecommit";
import * as codebuild from "@aws-cdk/aws-codebuild";
import { getCurrentUser, getFargateCluster, getFargateService, getOrCreateVpc } from '../../utils';
import { RemovalPolicy } from '@aws-cdk/core';

// refs - https://aws.amazon.com/blogs/devops/build-a-continuous-delivery-pipeline-for-your-container-images-with-amazon-ecr-as-source/

export interface mctcFargateECRBuildStackProps extends cdk.StackProps {
  vpcName?: string;

  fargateClusterName: string;
  fargateServiceName: string;
}

export class mctcFargateECRBuildStack extends cdk.Stack {
  pipeline: codepipeline.Pipeline;
  constructor(scope: cdk.Construct, id: string, props?: mctcFargateECRBuildStackProps) {
    super(scope, id, props);

    /*
     * retrieve existing resources
     */
    const vpc = getOrCreateVpc(this, props?.vpcName)

    const fargateCluster = getFargateCluster(this, vpc, props?.fargateClusterName ?? "MANDATORY_fargateClusterName");

    const fargateService = getFargateService(this, fargateCluster, props?.fargateServiceName ?? "MANDATORY_fargateServiceName");

    /*
     * Create an ECR Repository
     */
    const ecrRepository = new ecr.Repository(this, "mctcECRRepository", {
      repositoryName: "mctc-repo",
      removalPolicy: RemovalPolicy.DESTROY
    });

    /*
     * Create a Code Commit Repository
     */
    const repository = new codecommit.Repository(this, 'mctcSourceRepository', {
      repositoryName: 'mctcSourceRepo'
    });

    // let me pull/push
    const me = getCurrentUser(this)
    repository.grantPullPush(me)

    new cdk.CfnOutput(this, 'checkout repo', { value: `git clone ${repository.repositoryCloneUrlHttp} /tmp/mctcSourceRepo` })

    /*
     * Create a pipeline with CodeCommit Repository as Source
     */
    this.pipeline = new codepipeline.Pipeline(this, 'UpdateECSCodePipelineCodeCommit', {
      pipelineName: 'mctcPipelineCodeCommitSource',
      crossAccountKeys: false, // 1$ month,
    });

    // 1. CodeCommit source action
    const codecommitSourceOutputArtifact = new codepipeline.Artifact("codecommitSourceOutputArtifact");
    const codecommitAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: 'CodeCommitSource',
      repository: repository,
      output: codecommitSourceOutputArtifact
    })

    this.pipeline.addStage({
      stageName: 'CodeCommitSourceStage',
      actions: [
        codecommitAction
      ]
    })

    // 2. Build the project according to buildspec.yml contained in source repo
    //  - login to repo
    //  - build dockerfile
    //  - tag image with :latest and :commit-sha 
    //  - push image to ECR
    //  - create artifact for ECSDeployAction
    
    // const roleECR = new iam.Role(this, 'codebuidActionRole', {
    //   roleName: "ruolo_per_codebuild_action",
    //   description: 'used by codebuild project to interact wirh ECR repo image',
    //   assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryPowerUser")
    //   ],
    // });

    const codebuildActionOutputArtifact = new codepipeline.Artifact("codebuildOutputArtifact");
    const codebuildProject = new codebuild.PipelineProject(this, 'mtctProjectBuildCodeCommitRepo', {
      // in order to build docekr images
      environment: {
        privileged: true,
      },
      // role: roleECR  //it is better to use grantPullPush
    });
    const codebuidAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'codebuildAction',
      project: codebuildProject,
      input: codecommitSourceOutputArtifact,
      outputs: [codebuildActionOutputArtifact],
      environmentVariables: {
      }
    })

    // buildspec needs to login push pull images
    ecrRepository.grantPullPush(codebuildProject.role!);

    this.pipeline.addStage({
      stageName: 'BuildImageDefinitionsFile',
      actions: [
        codebuidAction
      ]
    })

    // 3. This action deploys the new image according to the imagedefinitions.json created by the codebuild action
    this.pipeline.addStage({
      stageName: 'DeployToECS',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: "ECS-Service",
          service: fargateService,
          imageFile: codebuildActionOutputArtifact.atPath('imagedefinitions.json'),
        })
      ]
    })
  }
}
