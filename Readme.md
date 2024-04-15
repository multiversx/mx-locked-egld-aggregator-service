# MultiversX Locked EGLD Aggregator

---

## Introduction

This repository aims to provide a way for different providers in the MultiversX ecosystem to implement their own ways of fetching the amount of EGLD locked for each of the addresses that interact with them.

This will be useful for multiple use-cases, such as snapshots, liquid staking data aggregator, frontend display, and so on.

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

Create a new file within the `providers` directory. Inside this file, define a class that implements the `LockedEgldProviderInterface` interface.

4. **Implement the `LockedEgldProviderInterface`**

To implement the `LockedEgldProviderInterface`, you should create a class with methods that fulfill the interface's requirements.

You should also extend the `BaseProvider` class that will contain useful methods and access to the MultiversX API.

Beside the class implementation, make sure to update the `provider.loader.ts` file so the mapping between the provider name and class is done.

5. **Testing Your Implementation**

Before submitting a pull request, you should perform some checks:
5.1. **Via system test**
- inside `config.mainnet.yaml` (or the according environment) update:
  - `output.elastic.enable` to `false` to avoid having to set up an Elasticsearch instance (can remain to true is the setup is in place)
  - and `output.jsonExport.enable` to `true` 
  - set your provider as the only entry to the `snapshotsProviders` array
  - inside `snapshots.service.ts` file, search for the `Locked EGLD snapshots cronjob` cronjob and set the cron expressions to something that happens more often (for example `@Cron(CronExpression.EVERY_10_SECONDS)`)
  - start the app via `yarn run start:aggregator:mainnet`
  - wait for the cron job to execute and make sure there is no error in the console and data is correctly exported into `lockedEgldSnapshot.json` file

5.2. **Via integration test**
- inside `service.spec.ts` update the `provider` and the `network` with your data and run the tests 
- note that the test suite is skipped by default so make sure to un-skip it

5.3. **Via own unit test**
- define your own `<providerName>.spec.ts` test file inside `apps/aggregator/test` directory and write your own unit tests that ensure the correct functionality

6. **Submit a Pull Request (PR)**

Once you've made the necessary changes and ensured that your implementation is correct, you can propose these changes to be merged into the main repository. Go to the main page of your forked repository, and click 'New Pull Request'. Fill in the necessary details, and then submit the PR.

## Testing your implementation

### Running Tests

Tests can be run via running: 

```bash
yarn test
```

## Troubleshooting

1. To validate data accuracy, we verify that the combined locked EGLD amount from contracts is close to the collective total of all locked EGLD addresses. This means that we won't allow providers
to declare a higher combined value of locked EGLD than the contract actually have. 

2. If the locked EGLD provider uses an intermediary token to determine the number of EGLD based on that token's holding, the ratio should be included inside the PR.
- Example: A liquid staking provider uses a 'AEGLD' token that is slightly higher as value compared to EGLD (let's say 1 AEGLD = 1.07 EGLD). When computing the 'locked EGLD' of a user, the provider 
  could implement a formula like 'lockedEgldForUser = aEgldHolding / ratioBetweenEgldAndAegld'

3. Integration test
- In case of the integration test, you can increase the `acceptablePercentageDifference` threshold

- To avoid hitting the rate limiter imposed by the public API, you have the option to fine-tune your settings to stay within the 2 requests per second (RPS) limit. To achieve this, consider modifying the `apiSleepTime` and `batchApiRequestSize` settings.

- These settings can be found in the `config/config.<NETWORK>.yaml`:

```yaml
testConfig:
  acceptablePercentageDifference: 10
  apiSleepTime: 10000
  batchApiRequestSize: 10
```
