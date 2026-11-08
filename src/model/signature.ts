/** Where a signature was found: the file and the place inside it, such as `cell_tx_signatures`. */
export interface SignatureOrigin {
  readonly file: string;
  readonly location: string;
}

/** A signature collected from a file, before it is checked. */
export interface CollectedSignature {
  /** The signature bytes as given. Normally 65 bytes: r, s, then the recovery id. */
  readonly bytes: string;
  /** The transaction it is meant for, by its name in the base file, such as `cell_tx`. */
  readonly txName: string;
  /** The lock args of the group it is meant for. */
  readonly lockArgs: string;
  /** The key hash the file says made this signature, when the file says so. */
  readonly namedSigner?: string;
  readonly origin: SignatureOrigin;
}
