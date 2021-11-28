#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

env \
    CLUSTER_NAME=ClustermctcFargateAlbPublicStack \
    SERVICE_NAME=ServicemctcFargateAlbPublicStack \
    FAMILY_NAME=TaskmctcFargateAlbPublicStack \
    TASKDEF_NAME=TaskmctcFargateAlbPublicStack \
    NEW_IMAGE="amazon/amazon-ecs-sample" \
    $SCRIPT_DIR/update-fargate-service.sh