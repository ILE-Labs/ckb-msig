import { ccc } from "@ckb-ccc/core";
import type { Network } from "../model/partial-tx.js";

/** Called with the JSON-RPC method of any request the client tries to send. */
export type RequestListener = (method: string) => void;

function refusingTransport(onRequest?: RequestListener): ccc.JsonRpcTransport {
  return {
    async request(payload) {
      onRequest?.(payload.method);
      throw new Error(`refused the ${payload.method} call: this command works offline`);
    },
  };
}

/**
 * A CCC client for the network whose transport refuses every request. Its in-memory
 * script table still works, so offline checks run as usual, and any attempt to reach
 * a node fails instead of going out.
 */
export function offlineClient(network: Network, onRequest?: RequestListener): ccc.Client {
  const transport = refusingTransport(onRequest);
  return network === "mainnet" ? new ccc.ClientPublicMainnet({ transport }) : new ccc.ClientPublicTestnet({ transport });
}
