import moment from 'moment';

export const graphqlQuery = (project: string, key: string, value: string) => {
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
                    timestamp: moment.utc().startOf('day').unix(),
                    series: project,
                    key,
                    value,
                },
            ],
        },
    };
};

