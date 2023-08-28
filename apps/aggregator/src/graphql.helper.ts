import BigNumber from 'bignumber.js';
import moment from 'moment';

export const graphqlQuery = (project: string, stakedValueSum: BigNumber) => {
    return {
        operationName: "ingestData",
        query: `
        mutation ingestData($table: IngestTable!, $input: [GenericIngestInput!]!) {
            ingestData(table: $table, input: $input)
        }`,
        variables: {
            table: "LIQUID_STAKING",
            input: [
                {
                    timestamp: moment().unix(),
                    series: project,
                    key: "stakedValue",
                    value: stakedValueSum.toString(),
                }
            ]
        }
    }
}

