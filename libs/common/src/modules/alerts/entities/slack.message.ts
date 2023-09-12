export class SlackMessage {
  title: string = '';
  attachments: any[] = [];

  static buildIndexerErrorMessage(project: string, network: string) {
    const message = new SlackMessage();
    message.title = `${project} - Could not process project indexing`;
    message.attachments = [
      {
        color: '#e01e5a',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*[${network.toUpperCase()}] ${project}* - Could not index project data`,
            },
          },
        ],
      },
    ];
    return message;
  }

  static buildIndexerWarningMessage(
    project: string,
    warnings: string[],
    network: string,
  ) {
    const message = new SlackMessage();
    message.title = `${project} - Found ${warnings.length} data warnings`;
    message.attachments = [
      {
        color: '#ecb22e',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*[${network.toUpperCase()}] ${project}* - Found ${warnings.length
                } data warnings`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Warnings:*\n${warnings
                  .map((w) => `• ${w}`)
                  .join('\n')}`,
              },
            ],
          },
        ],
      },
    ];
    return message;
  }
}
