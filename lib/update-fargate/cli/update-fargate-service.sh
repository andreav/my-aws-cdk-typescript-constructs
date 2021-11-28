#! /bin/bash

echo $CLUSTER_NAME
echo $SERVICE_NAME
echo $FAMILY_NAME
echo $TASKDEF_NAME
echo $NEW_IMAGE

NEW_TASK_DEFINTION=$( aws ecs describe-task-definition --task-definition $TASKDEF_NAME | jq ".taskDefinition.containerDefinitions[0].image = \"$NEW_IMAGE\"" | jq '{  
                  containerDefinitions: .taskDefinition.containerDefinitions,
                  family: .taskDefinition.family,
                  taskRoleArn: .taskDefinition.taskRoleArn,
                  executionRoleArn: .taskDefinition.executionRoleArn,
                  networkMode: .taskDefinition.networkMode,
                  volumes: .taskDefinition.volumes,
                  placementConstraints: .taskDefinition.placementConstraints,
                  requiresCompatibilities: .taskDefinition.requiresCompatibilities,
                  cpu: .taskDefinition.cpu,
                  memory: .taskDefinition.memory}' )

echo $NEW_TASK_DEFINTION

aws ecs register-task-definition  --family $FAMILY_NAME --cli-input-json "$NEW_TASK_DEFINTION"
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $TASKDEF_NAME  # --force-new-deployment