export interface PusherMembers {
    count: number;
    members: Record<string, unknown>;
    myID: string;
    me: {
        id: string;
        info: unknown;
    };
}