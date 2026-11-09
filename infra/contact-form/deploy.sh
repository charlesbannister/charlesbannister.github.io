#!/usr/bin/env bash
# Deploys the contact form stack to the Shabba AWS account (216989108664, us-east-2).
# Usage: TO_ADDRESS=you@example.com infra/contact-form/deploy.sh
set -euo pipefail
unset AWS_PROFILE AWS_DEFAULT_PROFILE AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_REGION AWS_DEFAULT_REGION
cd "$(dirname "$0")"
: "${TO_ADDRESS:?set TO_ADDRESS}"
aws_() { aws --profile shabba --region us-east-2 "$@"; }
[ "$(aws_ sts get-caller-identity --query Account --output text)" = 216989108664 ] || { echo "wrong AWS account" >&2; exit 1; }
python3 build.py
aws_ cloudformation deploy --stack-name charlesbannister-contact-form --template-file template.yaml \
  --capabilities CAPABILITY_IAM --parameter-overrides "ToAddress=$TO_ADDRESS" --no-fail-on-empty-changeset
aws_ cloudformation describe-stacks --stack-name charlesbannister-contact-form \
  --query "Stacks[0].Outputs[?OutputKey=='FunctionUrl'].OutputValue" --output text
