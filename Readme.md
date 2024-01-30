# MultiversX Liquid Staking Aggregator

---

## How to Aggregate Your Data

If you wish to have your data aggregated and made available through this repository:

1. **Fork the Repository**

Click the 'Fork' button at the top right of this repository's page. This will create a copy of this repository in your GitHub account.

2. **Install**

Once you have forked and cloned the project, you can install the Node dependencies by running the following command in the project directory:

```bash
yarn install
```

_We recommend you to use [yarn](https://yarnpkg.com/) as a package manager._

3. **Create a new file for your provider**

Create a new file within the `providers` directory. Inside this file, define a class that implements the `LiquidStakingProviderInterface` interface.

4. **Implement the `LiquidStakingProviderInterface`**

To implement the `LiquidStakingProviderInterface`, you should create a class with methods that fulfill the interface's requirements.

Beside the class implementation, make sure to update the `provider.loader.ts` file so the mapping between the provider name and class is done.

5. **Testing Your Implementation**

Before submitting a pull request, run the tests to ensure your implementation adheres to expected behaviors:

```bash
yarn test:mainnet --provider=YOUR_PROVIDER_NAME # replace YOUR_PROVIDER_NAME with your provider file name
```

6. **Submit a Pull Request (PR)**

Once you've made the necessary changes and ensured that your implementation is correct, you can propose these changes to be merged into the main repository. Go to the main page of your forked repository, and click 'New Pull Request'. Fill in the necessary details, and then submit the PR.

## Testing your implementation

### Running Tests

To run the tests for a specific environment, use the following commands:

```bash
yarn test:devnet --provider=YOUR_PROVIDER_NAME # devnet

yarn test:testnet --provider=YOUR_PROVIDER_NAME # testnet

yarn test:mainnet --provider=YOUR_PROVIDER_NAME # mainnet
```

Ensure that you replace `YOUR_PROVIDER_NAME` with your provider name. Keep in mind that it is case-sensitive and it should have been initialized in `provider.loader.ts` file.

## Troubleshooting

- To validate data accuracy, we verify that the combined staked amount from contracts is close to the collective total of all staking addresses. It the test fails, you can increase the `acceptablePercentageDifference` threshold

- To avoid hitting the rate limiter imposed by the public API, you have the option to fine-tune your settings to stay within the 2 requests per second (RPS) limit. To achieve this, consider modifying the `apiSleepTime` and `batchApiRequestSize` settings.

- These settings can be found in the `config/config.<NETWORK>.yaml`:

```yaml
testConfig:
  acceptablePercentageDifference: 10
  apiSleepTime: 10000
  batchApiRequestSize: 10
```
