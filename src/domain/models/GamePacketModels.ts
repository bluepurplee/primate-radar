import {BufferCursor} from "../../utils/BufferCursor";


export class AlbionPacket {
    public constructor(public packetType: PacketType) {
        this.packetType = packetType;
    }
}

export class GamePacket extends AlbionPacket {
    public constructor(public gamePacketType: GamePacketType) {
        super(PacketType.DATA);
        this.gamePacketType = gamePacketType;
    }
}

export class GameEventOnMove extends GamePacket {
    constructor(private posX: number,
                private posY: number,
                public id: string) {
        super(GamePacketType.ON_MOVE);
        this.posY = posY;
        this.posX = posX;
        this.id = id;

    }
}

export class UnhandledGameEvent extends GamePacket {
    constructor(public parameters: Map<number, any> = new Map()) {
        super(GamePacketType.OTHER);
        this.parameters = parameters;
    }
}

export class GameEventUserLeft extends GamePacket {
    constructor(public id: number) {
        super(GamePacketType.USER_LEFT);
        this.id = id;
    }
}

export class GameEventOnMobAppears extends GamePacket {
    constructor(private posX: number,
                private posY: number,
                public id: string,
                private rarityLevel: number,
                private enchantLevel: number) {
        super(GamePacketType.ON_MOB_APPEARS);
        this.posX = posX;
        this.posY = posY;
        this.id = id;
        this.rarityLevel = rarityLevel;
        this.enchantLevel = enchantLevel;

    }
}


export class GameEventOnHarvestableAppears extends GamePacket {
    constructor(private posX: number,
                private posY: number,
                public id: string,
                private tier: number,
                private unitsHarvestedPerClick: number,
                private harvestableType: HarvestableType,
                private enchantLevel: number) {
        super(GamePacketType.ON_HARVESTABLE_APPEARS);
        this.posX = posX;
        this.posY = posY;
        this.id = id;
        this.enchantLevel = enchantLevel;
        this.unitsHarvestedPerClick = unitsHarvestedPerClick;
        this.harvestableType = harvestableType;
        this.tier = tier;
    }
}

export enum HarvestableType {
    FIBER = 'FIBER',
    HIDE = 'HIDE',
    LOG = 'LOG',
    ORE = 'ORE',
    ROCK = 'ROCK',
    OTHER = 'OTHER' // should not happen but we avoid nullable value with that
}

export class GameEventOnSystemBuildingAppears extends GamePacket {
    constructor(private posX: number,
                private posY: number,
                public id: string,
                private name: string) {
        super(GamePacketType.ON_SYSTEM_BUILDING_APPEARS);
        this.posX = posX;
        this.posY = posY;
        this.id = id;
        this.name = name;

    }
}



export class GameEventOnHarvestableAppearsList extends GamePacket {
    constructor(private harvestables: GameEventOnHarvestableAppears[]) {
        super(GamePacketType.ON_HARVESTABLE_APPEARS_LIST);
        this.harvestables = harvestables;
    }
}






export class GameEventOnUserEnter extends GamePacket {
    constructor(private posX: number,
                private posY: number,
                public id: string) {
        super(GamePacketType.USER_ENTER);
        this.posX = posX;
        this.posY = posY;
        this.id = id;

    }
}

export class OperationRequestSelfUserMoveGamePacket extends GamePacket {
    constructor(public posX: number, public posY: number) {
        super(GamePacketType.SELF_USER_MOVE);
        this.posX = posX;
        this.posY = posY;
    }
}

export interface  PhotonCommand {
    commandType: PhotonCommandType;
    commandLength: number;
    data: BufferCursor;
}
export interface FragmentInfo {
    fragmentCount: number;
    fragmentNumber: number;
    totalLength: number;
    fragmentOffset: number;
    sequenceNumber: number;
}
export enum PhotonCommandType {
    LOL = 5,
    RELIABLE_TYPE = 6,
    UNRELIABLE_TYPE = 7,
    FRAGMENT_TYPE = 8,
    OTHER_TYPE
}

export enum MessageType {
    OPERATION_REQUEST = 2,
    EVENT = 4,
    OTHER_OPERATION_RESPONSE = 3,
    OPERATION_RESPONSE = 7
}

export enum GamePacketType {
    // request
    SELF_USER_MOVE = "SELF_USER_MOVE",
    //event
    ON_MOVE = "ON_MOVE",
    USER_LEFT = "USER_LEFT",
    USER_ENTER = "USER_ENTER",
    ON_MOB_APPEARS = "ON_MOB_APPEARS",
    ON_HARVESTABLE_APPEARS = "ON_HARVESTABLE_APPEARS",
    ON_SYSTEM_BUILDING_APPEARS = "ON_SYSTEM_BUILDING_APPEARS",
    ON_HARVESTABLE_APPEARS_LIST = "ON_HARVESTABLE_APPEARS_LIST",
    // response
    RESPONSE = "response",
    // the rest
    OTHER = "OTHER"
}

export enum PacketType {
    FRAGMENT = 'FRAGMENT',
    DATA = 'DATA',
    OTHER = 'OTHER'
}

export enum EventGamePacketEventCode {
    ON_ENTITY_MOVE = 3,
    ON_USER_LEAVE = 1,
    ON_USER_ENTER = 29,
    ON_NEW_HARVESTABLE_OBJECT_LIST = 39, // all the cool resources looks here
    ON_NEW_HARVESTABLE_OBJECT = 40, // looks like basic stuff like stone lvl 1 and so on
    ON_NEW_SYSTEM_BUILDING_APPEARS = 45,
    ON_MOB_APPEARS = 123,
    ON_NEW_RANDOM_DUNGEON = 315,
    ON_DAMAGE_RECEIVED = 303 // sure

}

export enum OperationRequestGamePacketEventCode {
    ON_USER_MOVE = 21
}
