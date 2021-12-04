import * as cdk from '@aws-cdk/core';
import * as ecr from "@aws-cdk/aws-ecr";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import * as codebuild from "@aws-cdk/aws-codebuild";
import { getFargateCluster, getFargateService, getOrCreateVpc } from '../../utils';
import { RemovalPolicy } from '@aws-cdk/core';

export interface mctcFargateECRTriggetOnPushProps extends cdk.StackProps {
  vpcName?: string;

  fargateClusterName: string;
  fargateServiceName: string;
}

export class mctcFargateECRTriggetOnPush extends cdk.Stack {
  pipeline: codepipeline.Pipeline;
  constructor(scope: cdk.Construct, id: string, props?: mctcFargateECRTriggetOnPushProps) {
    super(scope, id, props);

    /*
     * retrieve existing resources
     */
    const vpc = getOrCreateVpc(this, props?.vpcName)

    const fargateCluster = getFargateCluster(this, vpc, props?.fargateClusterName ?? "MANDATORY_fargateClusterName");

    const fargateService = getFargateService(this, fargateCluster, props?.fargateServiceName ?? "MANDATORY_fargateServiceName");

    /*
     * Create an ECR repot
     */
    const ecrRepository = new ecr.Repository(this, "mctcRepository", {
      repositoryName: "mctc-repo",
      removalPolicy: RemovalPolicy.DESTROY
    });

    /*
     * Create a pipeline with
     * - ECRSourceAction for triggering on push new image to ECR
     * - CodeBuildAction reading variables from previous step and building an imagedefinitions.json artifact
     * - ECSDeployAction accepting artifact from CodeBuildAction and updating fargate tasks according to imagedefinitions.json
     */
    this.pipeline = new codepipeline.Pipeline(this, 'UpdateECSCodePipelineECR', {
      pipelineName: 'mctcPipelineECRSource',
      crossAccountKeys: false, // 1$ month
    });

    // 1. ECR source action
    const ecrSoureOutputArtifact = new codepipeline.Artifact();
    const ecrSourceAction = new codepipeline_actions.EcrSourceAction({
      actionName: 'ECR',
      repository: ecrRepository,
      // imageTag: 'some-tag', // optional, default: 'latest'
      output: ecrSoureOutputArtifact,
      variablesNamespace: "ecr_namespace"
    })

    this.pipeline.addStage({
      stageName: 'ECRSourceStage',
      actions: [
        ecrSourceAction
      ]
    })


    // 2. the PipelineProject
    //    - retrieves the image variables from the source action
    //    - create an artifact containings an imagedefinitions.json file 
    const codebuildProject = new codebuild.PipelineProject(this, 'mtctProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'env',
              'echo IMAGE_TAE value: $IMAGE_TAG',
              'IMAGE_URI_NO_SHA=${IMAGE_URI%@*}',
              'printf \'[{"name":"web","imageUri":"%s:%s"}]\' $IMAGE_URI_NO_SHA $IMAGE_TAG > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ["imagedefinitions.json"],
        }
      })
    })

    // const codebuildActionInputArtifact = new codepipeline.Artifact();
    const codebuildActionOutputArtifact = new codepipeline.Artifact();
    const codebuidAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'codebuildAction',
      project: codebuildProject,
      input: ecrSoureOutputArtifact,
      outputs: [codebuildActionOutputArtifact],
      environmentVariables: {
        // Retrieving ECR infos from previous action
       REPOSITORY_NAME: { value: ecrSourceAction.variables.repositoryName },
       REGISTRY_ID: { value: ecrSourceAction.variables.registryId },
       IMAGE_URI: { value: ecrSourceAction.variables.imageUri },
       IMAGE_TAG: { value: ecrSourceAction.variables.imageTag },
     }
    })

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
