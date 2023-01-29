import { SendToPropertyInspectorEvent } from "@fnando/streamdeck";
import { ActionPollingDebugInfo } from "./actions/PollingAction";
import DefaultPropertyInspector from "./inspector"

/**
 * Base inspector for an action that periodically polls a target for information.
 */
export default abstract class PollingActionInspector<TSettings> extends DefaultPropertyInspector<TSettings> {
  /**
   * {@inheritdoc}
   */
  handleSendToPropertyInspector(event: SendToPropertyInspectorEvent<unknown>): void {
    super.handleSendToPropertyInspector(event);

    if (Object.prototype.hasOwnProperty.call(event, 'statusMessage')) {
      const info = <ActionPollingDebugInfo><unknown>event;
      this.handleReceiveDebugInfo(info);
    }
  }

  /**
   * Invoked when the action passed debug information.
   * 
   * Useful for helping the user determine a problem with their configuration.
   * 
   * @param info - Debug information was received from the action.
   */
  protected abstract handleReceiveDebugInfo(info: ActionPollingDebugInfo): void;
}
