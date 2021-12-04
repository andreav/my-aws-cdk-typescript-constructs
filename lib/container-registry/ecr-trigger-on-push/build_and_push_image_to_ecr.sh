#!/bin/bash -e

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEFAULT_AWS_REGION=$(aws configure get region)
DEFAULT_AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query 'Account')
AWS_REGION="${AWS_REGION:=$DEFAULT_AWS_REGION}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:=$DEFAULT_AWS_ACCOUNT_ID}"
ECR_NAME=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

FILE=$SCRIPT_DIR/passed.txt
IMAGE=nginxdemos/hello
[[ -f  "$FILE" ]] && IMAGE=httpd
# pipeline observe tag latest
TAG=$ECR_NAME/mctc-repo:latest

echo "Logging to $ECR_NAME"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_NAME

echo "Simulating build and pushing image $IMAGE with $TAG"
docker pull $IMAGE
docker tag $IMAGE:latest $TAG
docker push $TAG

# change image next time
[[ -f  "$FILE" ]] && rm $FILE || touch $FILE
