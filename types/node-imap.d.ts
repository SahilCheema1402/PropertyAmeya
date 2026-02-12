declare module 'node-imap' {
    namespace Imap {
        interface Config {
            user: string;
            password: string;
            host: string;
            port: number;
            tls?: boolean;
            tlsOptions?: object;
            autotls?: 'always' | 'required' | 'never';
            connTimeout?: number;
            authTimeout?: number;
            keepalive?: boolean | { interval?: number; idleInterval?: number; forceNoop?: boolean };
        }
 
        interface Box {
            name: string;
            readOnly: boolean;
            uidvalidity: number;
            uidnext: number;
            flags: string[];
            permFlags: string[];
            persistentUIDs: boolean;
            messages: {
                total: number;
                new: number;
                unseen: number;
            };
        }
 
        interface ImapMessage {
            once(arg0: string, arg1: () => Promise<void>): unknown;
            on(arg0: string, arg1: (stream: any) => void): unknown;
            seqno: number;
            uid: number;
            flags: string[];
            date: Date;
            attributes: {
                uid: number;
                flags: string[];
                date: Date;
                size: number;
            };
        }
 
        interface MessageBody {
            type: string;
            text: string;
            disposition?: string;
            params?: any;
        }
 
        interface FetchOptions {
            bodies?: string | string[];
            struct?: boolean;
            envelope?: boolean;
            size?: boolean;
            modifiers?: { [key: string]: any };
            markSeen?: boolean;
        }

      export function once(arg0: string, arg1: (err: any) => void) {
        throw new Error('Function not implemented.');
      }

      export function once(arg0: string, arg1: (err: any) => void) {
        throw new Error('Function not implemented.');
      }

      export function once(arg0: string, arg1: () => void) {
        throw new Error('Function not implemented.');
      }

      export function once(arg0: string, arg1: (err: { message: any; }) => void) {
        throw new Error('Function not implemented.');
      }

      export function once(arg0: string, arg1: () => void) {
        throw new Error('Function not implemented.');
      }

      export function once(arg0: string, arg1: () => void) {
        throw new Error('Function not implemented.');
      }

      export function once(arg0: string, arg1: () => void) {
        throw new Error('Function not implemented.');
      }
    }
 
    class Imap {
        constructor(config: Imap.Config);
        connect(): void;
        end(): void;
        destroy(): void;
        openBox(mailboxName: string, openReadOnly: boolean, callback: (err: Error, mailbox: Imap.Box) => void): void;
        closeBox(callback: (err: Error) => void): void;
        closeBox(autoExpunge: boolean, callback: (err: Error) => void): void;
        search(criteria: any[], callback: (err: Error, uids: number[]) => void): void;
        fetch(source: any, options: Imap.FetchOptions): NodeJS.EventEmitter;
        move(source: any, mailboxName: string, callback: (err: Error) => void): void;
        copy(source: any, mailboxName: string, callback: (err: Error) => void): void;
        addFlags(uid: any, flags: string | string[], callback: (err: Error) => void): void;
        delFlags(uid: any, flags: string | string[], callback: (err: Error) => void): void;
        setFlags(uid: any, flags: string | string[], callback: (err: Error) => void): void;
 
        on(event: 'ready' | 'close' | 'end', listener: () => void): this;
        on(event: 'error', listener: (err: Error) => void): this;
        on(event: string, listener: Function): this;
    }
 
    export = Imap;
}