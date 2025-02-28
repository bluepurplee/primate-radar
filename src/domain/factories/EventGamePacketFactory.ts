import {
    EventGamePacketEventCode,
    GameEventOnHarvestableAppears,
    GameEventOnHarvestableAppearsList,
    GameEventOnMobAppears,
    GameEventOnMove,
    GameEventOnSystemBuildingAppears,
    GameEventOnUserEnter,
    GameEventUserLeft,
    GamePacket,
    HarvestableType
} from "../models/GamePacketModels";
import {GamePacketBuilder} from "./PacketFactory";

export class EventGamePacketFactory {


    eventGamePacketBuildersByEventCode = new Map<EventGamePacketEventCode, GamePacketBuilder>([
        [EventGamePacketEventCode.ON_ENTITY_MOVE, EventGamePacketFactory.buildGameEventOnMove],
        [EventGamePacketEventCode.ON_USER_ENTER, EventGamePacketFactory.buildGameEventUserEnter],
        [EventGamePacketEventCode.ON_USER_LEAVE, EventGamePacketFactory.buildGameEventUserLeft],
        [EventGamePacketEventCode.ON_MOB_APPEARS, EventGamePacketFactory.buildGameEventOnMobAppears],
        [EventGamePacketEventCode.ON_NEW_HARVESTABLE_OBJECT, EventGamePacketFactory.buildGameEventOnHarvestableAppears],
        [EventGamePacketEventCode.ON_NEW_SYSTEM_BUILDING_APPEARS, EventGamePacketFactory.buildGameEventOnSystemBuildingAppears],
        [EventGamePacketEventCode.ON_NEW_HARVESTABLE_OBJECT_LIST, EventGamePacketFactory.buildGameEventOnHarvestableListAppears],
    ]);

    findBuilderFunctionByEventCode(eventCode: EventGamePacketEventCode): GamePacketBuilder | undefined {
        return this.eventGamePacketBuildersByEventCode.get(eventCode);
    }

    static buildGameEventOnMove(parameters: Map<number, any>): GameEventOnMove {
        const entityId = parameters.get(0);
        const position0 = new DataView(new Uint8Array(parameters.get(1)).buffer, 9, 4).getFloat32(0, true);
        const position1 = new DataView(new Uint8Array(parameters.get(1)).buffer, 13, 4).getFloat32(0, true);

        //console.log(parameters.get(1));
        for (let o=0; o < 19 ; o++) {
            try {

               // console.log("POS X " + o + " : " + new DataView(new Uint8Array(parameters.get(1)).buffer, o, 4).getFloat32(0, true));
            }catch (e) {
              //  console.log('error');
            }
        }
        // console.log(Buffer.from(new Uint8Array(parameters.get(1)).buffer).readFloatLE(9));
        // console.log(Buffer.from(new Uint8Array(parameters.get(1)).buffer).readFloatLE(13));
        // return new GameEventOnMove(+position0.toFixed(8), +position1.toFixed(8), entityId);
        //console.log(position0, " " , position1);
        //console.log(parameters);
        return new GameEventOnMove(position0, position1, entityId.toString());
    }

    static buildGameEventUserLeft(parameters: Map<number, any>): GamePacket {
        return new GameEventUserLeft(parameters.get(0));
    }

    static buildGameEventOnMobAppears(parameters: Map<number, any>): GamePacket {
        const positionX = parameters.get(7)?.at(0);
        const positionY = parameters.get(7)?.at(1);
        const enchantLevel = parameters.get(33);
        const rarityLevel = parameters.get(19);
        return new GameEventOnMobAppears(positionX, positionY, parameters.get(0), enchantLevel, rarityLevel);
    }

    static buildGameEventOnHarvestableAppears(parameters: Map<number, any>): GamePacket {
        const positionX = parameters.get(8)?.at(0);
        const positionY = parameters.get(8)?.at(1);
        const type = parameters.get(5); // should create enum for type enchant and rarity
        const enchantLevel = parameters.get(11);
        const size = parameters.get(10);
        // console.log(parameters);
        // lmao should replace positionX and positionY with an objcct Position or smth like this
        // todo replace 0 with real tier + check other
        // probably wrong here
        return new GameEventOnHarvestableAppears(positionX, positionY, parameters.get(0),0, size, HarvestableType.OTHER, enchantLevel);
    }

    static buildGameEventOnSystemBuildingAppears(parameters: Map<number, any>): GamePacket {
        const positionX = (parameters.get(1))?.at(0);
        const positionY = (parameters.get(1))?.at(1);
        const name = parameters.get(3);
        return new GameEventOnSystemBuildingAppears(positionX, positionY, parameters.get(0), name);
    }


    static buildGameEventOnHarvestableListAppears(parameters: Map<number, any>): GamePacket {

        const ids = [...parameters.get(0)];
        const positions: [] = parameters.get(3);
        const unitsHarvestedPerClick = [...parameters.get(4)]
        const randoms1 = [...parameters.get(1)];
        const tiers = [...parameters.get(2)];
        const eventOnMove = ids.map((id, index) => {
            const posX = positions[index * 2];
            const posY = positions[index * 2 + 1];
            const harvestableTypeNumber = randoms1[index];
            const tier = tiers[index];
            return new GameEventOnHarvestableAppears(posX, posY, id, tier, unitsHarvestedPerClick[index], EventGamePacketFactory.getHarvestableTypeByTypeNumber(harvestableTypeNumber),0);
        });
        return new GameEventOnHarvestableAppearsList(eventOnMove);
    }

    static getHarvestableTypeByTypeNumber(harvestableType: number): HarvestableType {
        if (harvestableType >= 0 && harvestableType <= 5) return HarvestableType.LOG;
        else if (harvestableType >= 6 && harvestableType <= 10) return HarvestableType.ROCK;
        else if (harvestableType >= 11 && harvestableType <= 14) return HarvestableType.FIBER;
        else if (harvestableType >= 15 && harvestableType <= 22) return HarvestableType.HIDE;
        else if (harvestableType >= 23 && harvestableType <= 27) return HarvestableType.ORE;
        else return HarvestableType.OTHER;
    }

    static buildGameEventUserEnter(parameters: Map<number, any>): GamePacket {
        const positionX = (parameters.get(14))?.at(0);
        const positionY = (parameters.get(14))?.at(1);
        return new GameEventOnUserEnter(positionX, positionY, parameters.get(0));
    }
}
