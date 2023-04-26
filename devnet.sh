#!/bin/bash

# Run the Tenderly command and capture both stdout and stderr
output=$(tenderly devnet spawn-rpc --project daobox --template daobox 2>&1)

# Extract the RPC URL by looking for the line that starts with "https://"
rpcUrl=$(echo "$output" | grep -o '^https://.*')

if [ -z "$rpcUrl" ]; then
  echo "RPC URL not found."
  exit 1
fi

echo "Received RPC URL: $rpcUrl"

# Update the .env file with the new RPC URL (in-place editing without backup)
sed -i '' "s|DEVNET_RPC_URL=.*|DEVNET_RPC_URL=$rpcUrl|" .env
echo "DEVNET_RPC_URL updated successfully in .env file."

# Run the tests with the updated RPC URL
hh test
