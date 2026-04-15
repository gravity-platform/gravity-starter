import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { SendEmailConfig, SendEmailExecutorOutput } from "../util/types";
import { sendEmail } from "../service/sendEmailService";

const NODE_TYPE = "SendEmail";

export default class SendEmailExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: SendEmailConfig,
    context: NodeExecutionContext,
  ): Promise<SendEmailExecutorOutput> {
    try {
      const result = await sendEmail(config, context, this.logger);
      this.logger.info("Email sent successfully", { messageId: result.messageId });
      return {
        __outputs: {
          sent: result.sent,
          messageId: result.messageId,
        },
      };
    } catch (error) {
      this.logger.error("Email send failed", { error });
      throw error;
    }
  }
}
