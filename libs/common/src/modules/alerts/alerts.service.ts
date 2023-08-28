import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { Injectable } from '@nestjs/common';
import { ApiConfigService } from '../api-config';
import { ApiService } from '@multiversx/sdk-nestjs-http';
import { SlackMessage } from './entities';

@Injectable()
export class AlertsService {
  private readonly logger = new OriginLogger(AlertsService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) { }

  public async sendIndexerWarning(project: string, warnings: string[]): Promise<void> {
    const message = SlackMessage.buildIndexerWarningMessage(
      project,
      warnings,
      this.apiConfigService.getNetwork(),
    );
    await this.sendAlert(message);
  }

  public async sendIndexerError(project: string): Promise<void> {
    const message = SlackMessage.buildIndexerErrorMessage(
      project,
      this.apiConfigService.getNetwork(),
    );
    await this.sendAlert(message);
  }

  private async sendAlert(message: SlackMessage): Promise<void> {
    try {
      const slackWebhookUrl = this.apiConfigService.getSlackWebhookUrl();
      if (!slackWebhookUrl) {
        this.logger.warn(`Could not send Slack message with title '${message.title}'. No slack webhook was provided`,);
        return;
      }

      await this.apiService.post(slackWebhookUrl, message);

      this.logger.log(`Send Slack message with title '${message.title}'`);
    } catch (error) {
      this.logger.error(
        `Could not send Slack message with title '${message.title}'`,
      );
      this.logger.error(error);
    }
  }
}
