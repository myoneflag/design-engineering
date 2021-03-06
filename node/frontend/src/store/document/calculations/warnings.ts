import { CalculationLayout } from "./calculation-field";
import { Calculation } from "./types";
import * as _ from "lodash";
import uuid from 'uuid';
import { DocumentState, WarningFilter } from "../types";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { saveWarningsPreference } from "../../../../src/lib/filters/warnings";

export enum Warning {
    MAX_PRESSURE_EXCEEDED_NODE,
    MAX_PRESSURE_EXCEEDED_PIPE,
    MAX_FLOW_RATE_EXCEEDED,
    MAX_UNVENTED_DRAINAGE_FLOW_EXCEEDED,
    MAX_UNVENTED_LENGTH,
    MAX_PER_LEVEL_EXCEEDED,
    MAX_PRESSURE_OVERLOAD,
    CONNECT_THE_FIXTURE_TO_A_FLOW_SYSTEM,
    FLOW_SYSTEM_NOT_CONNECTED_TO_PLANT,
    UPDATE_FLOW_SYSTEM_SETTINGS,
    LOOP_IN_PIPESYSTEM_DETECTED,
    CHANGE_THE_PEAK_FLOW_RATE_CALCULATION_METHOD,
    NO_SUITABLE_PIPE_SIZE,
    PRESSURE_AT_UPSTREAM_NEEDS_HIGHER_THAN_DOWNSTREAM,
    EXTRAPOLATED,
    VALVE_IN_WRONG_DIRECTION,
    PRVS_ARE_FORBIDDEN_HERE,
    MISSING_BALANCING_VALVE_FOR_RETURN,
    NOT_ENOUGH_PRESSURE,
    PRESSURE_PRV_MORE_THAN_TARGET,
    OVERRIDEN_PIPE_DIAMETER_INSUFFICIENT,
    RHEEM_ADVICE,
    PIPE_NOT_CONNECTED_TO_FLOW_SOURCE,
    PIPE_HIGHER_THAN_FLOOR_LEVEL,
    NOT_CONNECTED_TO_FLOW_SYSTEM,
    ADD_FLOW_SOURCE_TO_SYSTEM,
    ISOLATION_VALVES_REQUIRED_ON_RING_MAIN,
    REMOVE_PLANT_FROM_FLOW_AND_RETURN_PIPEWORK,
    ARRANGEMENT_OF_PIPWORK_NOT_SUITABLE_FOR_CALCULATION,
}

export interface WarningDescription {
    title: string | null;
    shortTitle?: string | null;
    description?: string | null;
    helpLink?: string | null;
}

export interface WarningDetail extends WarningDescription {
    uid: string;
    warningLayout?: CalculationLayout | null;
    type: Warning;
}

export interface WarningUi extends WarningDetail {
    entityUid: string;
    levelUid: string;
}

export const WarningDetails: { [key: string]: WarningDescription } = {
    MAX_PRESSURE_EXCEEDED_NODE: {
        title: "Maximum Pressure Exceeded ${pressure}",
        description: `The maximum inlet pressure of the node has been exceeded.<br />
        To resolve this, you will need to add pressure reducing valves to your design.
        Alternatively, consider reducing the pressure at the pump or overriding the inlet pressure properties of the node.
        If you are surprised to receive this warning, please review the flow source and floor level heights as they may have been entered incorrectly.`,
        helpLink: "",
    },
    MAX_PRESSURE_EXCEEDED_PIPE: {
        title: "Safe Working Pressure of ${pressure} Exceeded (${actual})",
        description: `The safe working pressure of the chosen pipe material has been exceeded.<br/>
        To resolve this, you can choose a new pipe material in the Settings > Flow Systems.
        Alternatively, consider adding pressure reduction valves to your system or reduce the pressure at the pump.
        If you are surprised to receive this warning, please review the flow source and floor level heights as they may have been entered incorrectly.`,
        helpLink: "https://youtu.be/R_PIJg7i6uE",
    },
    MAX_FLOW_RATE_EXCEEDED: {
        title: "Max Flow Rate ${flowRate} exceeded",
        description: `The maximum flow rate of the valve has been exceeded.<br /> To resolve this, you should add more mixing valves to share the load of the flow rate.

        Alternatively, you can override the 'Maximum Flow Rate' in the properties of the valve.
        
        If you are surprised to receive this warning, please review the fixtures and nodes that are connected as there may be incorrect inputs.`,
        helpLink: "https://youtu.be/KPzWxiQsHt0",
    },
    MAX_UNVENTED_DRAINAGE_FLOW_EXCEEDED: {
        title: "Unvented Drain Exceeds ${value}",
        shortTitle: "Max. Unvented WC's",
        description: `There are too many WC's connected to the unvented pipe based on the flow system settings.<br />
        To resolve this, you can add a vent to the system or modify the pipe layout.<br />
        Alternatively, you can edit the maximum number of WC's allowed to connect to an unvented pipe length in Settings > Flow Systems.`,
        helpLink: "",
    },
    MAX_UNVENTED_LENGTH: {
        title: "Max unvented length of ${value} exceeded ${max}",
        description: `The fixture at the upstream end of the pipe is too far from a vent or vented drain based on the flow system settings.<br /> 

        To resolve this, you can add a vent to the system or modify the pipework layout so the distance to the fixture does not exceed the maximum length.
        
        Alternatively, you can edit the maximum unvented length in Settings > Flow Systems.`,
        helpLink: "",
    },
    MAX_PER_LEVEL_EXCEEDED: {
        title: "Max ${value}  per level exceeded on level ${level}",
        description: `The fixtures connecting to the stack on this level exceed the maximum that is allowed based on the flow system settings.<br /> 

        To resolve this, you will need to take some of the fixtures to a different stack so that the load is reduced below the maximum that is allowed .
        
        Alternatively, you can edit the maximum allowance in Settings > Flow Systems.`,
        helpLink: "",
    },
    MAX_PRESSURE_OVERLOAD: {
        title: "${systemName} pressure overload. Max: ${max}",
        description: `The maximum inlet pressure of the fixture has been exceeded. <br />

        To resolve this, you will need to add pressure reducing valves to your design.
        
        Alternatively, consider reducing the pressure at the pump or overriding the inlet pressure properties of the fixture.
        
        If you are surprised to receive this warning, please review the flow source and floor level heights as they may have been entered incorrectly.`,
        helpLink: "https://youtu.be/y9MQQZVQLJw",
    },
    CONNECT_THE_FIXTURE_TO_A_FLOW_SYSTEM: {
        title: "Connect the fixture to a flow system",
        description: `The fixture is missing a pipe connection.<br /> The warning may have appeared because you are trying to connect a flow system to the fixture that is currently being prevented. 

        To resolve this, you can 'Allow Other Systems to Connect' in the properties of a fixture. If you need to make this change to a lot of fixtures, you can right-click on the fixture to 'select similar' to make a change for all of the fixtures. You will then need to re-connect the pipe to each fixture.
        
        If you do not want to connect another pipe to the fixture because it is not required, you can hide the warning.`,
        helpLink: "",
    },
    FLOW_SYSTEM_NOT_CONNECTED_TO_PLANT: {
        title: "Flow System Not Connected to Plant",
        description: `The plant is missing a pipe connection.<br /> The warning may have appeared because you are trying to connect a flow system to the plant that is currently being prevented. 

        To resolve this, you can change the 'Inlet Flow System' or  'Outlet Flow System' in the properties of the plant to suit your design.
        
        If you do not want to connect another pipe to the plant because it is not required, you can hide the warning.`,
        helpLink: "",
    },
    UPDATE_FLOW_SYSTEM_SETTINGS: {
        title: "Update Flow System Settings",
        description: `There is no suitable pipe size to choose based on the fixture units connected to the pipe and the flow system settings. <br />

        To resolve this, you will need to change the pipe sizing table (Settings > Flow Systems).
        
        Alternatively, you can reduce the amount of loading units connected to the pipe.`,
        helpLink: "",
    },
    LOOP_IN_PIPESYSTEM_DETECTED: {
        title: "Loop in pipesystem detected",
        description: "",
        helpLink: "",
    },
    CHANGE_THE_PEAK_FLOW_RATE_CALCULATION_METHOD: {
        title: "Change the Peak Flow Rate Calculation Method",
        description: `The loading units (full flow rate for DIN) on the pipe have exceeded the limit in the Standard/Guideline. <br />

        To resolve this, you will need to change the 'Peak Flow Rate Calculation Method' by going to the Settings > Calculations.
        
        Alternatively, you can reduce the amount of loading units (full flow rate for DIN) that are connected to that pipe so that the conversion to a flow rate can be undertaken.`,
        helpLink: "",
    },
    NO_SUITABLE_PIPE_SIZE: {
        title: "No suitable pipe size in the catalog for this flow rate",
        description: `There is no suitable pipe size to choose based on the flow rate, pipe material, and maximum velocity parameter. <br />

        To resolve this, you will need to change the pipe material (Settings > Flow Systems) or increase the maximum velocity parameter (Settings > Flow System).
        
        Alternatively, you can reduce the amount of flow rate going through the pipe.`,
        helpLink: "",
    },
    PRESSURE_AT_UPSTREAM_NEEDS_HIGHER_THAN_DOWNSTREAM: {
        title: "Pressure at upstream source/regulator needs to be higher than downstream regulator/appliance",
        description: `The pressure at the upstream source/regulator is equal to or greater than the pressure at the downstream regulator/appliance. <br />

        To resolve this, increase the pressure at the upstream source/regulator or the downstream regulator/appliance.`,
        helpLink: "",
    },
    EXTRAPOLATED: {
        title: "Extrapolated",
        description: `The conversion from loading units to a flow rate has exceeded the limit in the Standard/Guideline.<br /> Therefore, an estimate flow rate has been provided based on extrapolation. 

        If you want to change this, you will need to change the 'Peak Flow Rate Calculation Method' by going to the Settings > Calculations.`,
        helpLink: "",
    },
    VALVE_IN_WRONG_DIRECTION: {
        title: "Valve in wrong direction",
        description: "",
        helpLink: "",
    },
    PRVS_ARE_FORBIDDEN_HERE: {
        title: "PRVs are forbidden here",
        description: `PRV on the recirculating system cause issues with the ability to calculate and balance the system. <br />

        To resolve this, relocate the PRV on to the cold water system or on to the dead legs that branch off the recirculating system.`,
        helpLink: "",
    },
    MISSING_BALANCING_VALVE_FOR_RETURN: {
        title: "Missing Balancing Valve for Return",
        description: `In the hot water recirculating system, at least one balancing valve is required.<br /> Additionally, every loop/circuit created will also require a balancing valve. 

        To resolve this, choose a 'Balancing Valve' from the 'Valve' drop down menu and add one to each hot water loop/circuit that has the warning.`,
        helpLink: "",
    },
    NOT_ENOUGH_PRESSURE: {
        title: "Not enough ${systemName} pressure. Required: ${required}",
        description: `The maximum inlet pressure of the fixture has been exceeded.<br /> To resolve this, you will need to add a pump to your design. 

        Alternatively, consider changing the minmum pipe size or the maximum velocity in the flow system settings, or overriding the inlet pressure properties of the fixture. 
        
        If you are surprised to receive this warning, please review the flow source and floor level heights as they may have been entered incorrectly.`,
        helpLink: "https://youtu.be/mXg5FMYT8eY",
    },
    PRESSURE_PRV_MORE_THAN_TARGET: {
        title: "Pressure of ${pressure} is more than ${ratio}x the target pressure of ${target}",
        description: `The inlet pressure at the pressure reduction valve is more than \${ratio}x the specified outlet pressure of the pressure reduction valve which can cause maintenance issues.
        To resolve this, you can install multiple pressure reduction valves in series, ensuring not to reduce the pressure by more than a \${ratio}:1 ratio each time.
        Alternatively, consider reducing the pressure at the pump or overriding the inlet pressure properties of the fixtures/nodes.`,
        helpLink: "",
    },
    OVERRIDEN_PIPE_DIAMETER_INSUFFICIENT: {
        title: "Overriden pipe diameter insufficient for drainage vent size",
        description: "",
        helpLink: "",
    },
    RHEEM_ADVICE: {
        title: "Contact Rheem for Advice",
        description: "",
        helpLink: "",
    },
    PIPE_NOT_CONNECTED_TO_FLOW_SOURCE: {
        title: "Pipe Not Connected To Flow Source",
        description: `To resolve this, follow the grey pipe towards the flow source until you see a coloured pipe or the flow source
         - this is where the pipe is disconnected from the system.`,
        helpLink: "",
    },
    PIPE_HIGHER_THAN_FLOOR_LEVEL: {
        title: "Pipe Higher Than Floor Level",
        description: `The pipe is higher than the floor level above.<br />

        If this is unintentional, you can resolve this by selecting the pipe and changing the 'Height Above Floor' in the properties.<br />
        
        Alternatively, you can change the floor height of the floor level above by opening the panel on the left-hand side of the screen and modifying the numbers.`,
        helpLink: "",
    },
    NOT_CONNECTED_TO_FLOW_SYSTEM:{
        title: "Not Connected to Flow System",
        description: `The node/appliance is missing a pipe connection.<br />

        To resolve this, draw a pipe to the node/appliance. If you intentionally do not want to connect a pipe, you can hide the warning.`,
        helpLink: "",
    },
    ADD_FLOW_SOURCE_TO_SYSTEM: {
        title: "Add Flow Source to System",
        description: "There is no flow source in drainage",
        helpLink: "",
    },
    ISOLATION_VALVES_REQUIRED_ON_RING_MAIN: {
        title: "2 Isolation Valves Required on Ring Main",
        description: `Due to the complex nature of calculating ring mains where there is a diversified flow rate 
        (there is no industry standard / recognised calculation method) the results through the ring main are not able to be calculated.<br />

        To resolve this, place at least two isolation valves on the ring main. 
        This allows the calculations to be iterated as various dead legs, simulating peak scenarios where the ring main is isolated in different areas.`,
        helpLink: "",
    },
    REMOVE_PLANT_FROM_FLOW_AND_RETURN_PIPEWORK: {
        title: "Remove Plant from Flow and Return Pipework",
        description: `The plant on the return system pipework is causing the results to not calculate.<br />

        To resolve this, remove any plant from the return system pipework and place it on other parts of the system such as the inlet to the plant or the branches off the return system pipework.<br />
        
        Note that the hot water plant is inclusive of the circulating pump, so you do not need to add one.`,
        helpLink: "",
    },
    ARRANGEMENT_OF_PIPWORK_NOT_SUITABLE_FOR_CALCULATION: {
        title: "Arrangement of Pipework not Suitable for Calculation",
        description: `Due to the complex nature of calculating pipework that is interconnected when there is a diversified flow rate 
        (there is no industry standard / recognised calculation method) the results are not able to be calculated.<br />

        To resolve this on a cold water system, place isolation valves on each pipe that interconnects the different loops and 
        in the properties of the valve, you will need to mark some of them as 'closed'. This allows the calculations 
        to be iterated as various dead legs, simulating peak scenarios where the system is isolated in different areas.<br />
        
        To resolve this on a hot water circulating system, you will need to simplify the layout so that the loops/circuits branch off 
        from each other, and join together in the same order. `,
        helpLink: "",
    },
}

export const addWarning = (
    entityUid: string,
    calculation: Calculation,
    warning: Warning,
    mode?: CalculationLayout | null,
    params?: { [key: string]: string | number | null }
): void => {
    let newWarningDetail = WarningDetails[Warning[warning]];
    let warningParams: string[] = [];
    if (params) {
        Object.keys(params).forEach((key) => {
            if (params[key]) warningParams.push(params[key]!.toString());
            newWarningDetail = {
                ...newWarningDetail,
                title: newWarningDetail?.title?.replace(`\$\{${key}\}`, params[key]?.toString() || '')!,
                description: newWarningDetail?.description?.replace(`\$\{${key}\}`, params[key]?.toString() || '')!,
            };
        });
    }
    calculation.warnings = [...calculation.warnings || [], {
        ...newWarningDetail,
        type: warning,
        uid: `${entityUid}.${warning}.${warningParams.join('-')}`,
        warningLayout: mode,
    }];
}

/* Get tree data of Warnings */
export function getTreeDataOfWarnings(
    documentId: number, 
    warnings: WarningUi[],
    warningFilter: WarningFilter,
    pressureOrDrainage: CalculationLayout,
): any[] {
    saveWarningsPreference(window, documentId, warningFilter);
    const { showHiddenWarnings, hiddenUids, collapsedLevelType, activeEntityUid } = warningFilter;
    /** Filter hidden warnings & mentioning level to 'ground' */
    const visibleWarnings = warnings
        .filter((e) => (showHiddenWarnings || !hiddenUids.includes(e.uid)) &&
            ((pressureOrDrainage === 'drainage' && e.warningLayout === 'drainage') ||
                (pressureOrDrainage !== 'drainage' && e.warningLayout !== 'drainage')))
        .map((e) => (e.levelUid ? e : { ...e, levelUid: 'ground' }));
    const activeWarnings = visibleWarnings.filter((warning) => warning.entityUid === activeEntityUid);
    const treeData = [];
    const warningsByLevel = _.groupBy(
        visibleWarnings, "levelUid"
    );
    for (const level in warningsByLevel) {
        const targetLevelProperty = collapsedLevelType.find((e) => e.levelUid === level);
        const hasActiveWarning = activeWarnings?.length && activeWarnings[0].levelUid === level;
        const levelData = {
            levelUid: level,
            count: warningsByLevel[level].length,
            visible: !!hasActiveWarning || targetLevelProperty?.visible!,
            data: [],
        };
        const levelDataByType = _.groupBy(warningsByLevel[level], "type");
        for (const type in levelDataByType) {
            const typeData = levelDataByType[type].map((e) => ({
                ...e,
                label: e.title,
                _rowVariant: getRowClassName(hiddenUids.includes(e.uid), e.entityUid === activeEntityUid),
            }));
            if (typeData.length > 1) {
                const hidden = !_.difference(typeData.map((e) => e.uid), hiddenUids).length;
                const hasActiveWarning = typeData.filter((e) => e.entityUid === activeEntityUid).length;
                (levelData.data as any).push({
                    ...typeData[0],
                    label: typeData[0].shortTitle || Warning[Number(type)].toString().replace(/\_/g, ' ').toLowerCase(),
                    type,
                    hidden,
                    children: typeData,
                    _rowVariant: hidden ? 'hidden' : '',
                    _showDetails: !!hasActiveWarning || targetLevelProperty?.types?.includes(type as EntityType)!
                });
            } else {
                (levelData.data as any).push({
                    ...typeData[0],
                    label: typeData[0].title,
                    children: [],
                    _rowVariant: getRowClassName(hiddenUids.includes(typeData[0].uid), typeData[0].entityUid === activeEntityUid),
                });
            }
        };
        treeData.push(levelData);
    }
    return treeData;
}

function getRowClassName(hidden: boolean, active: boolean): string {
    if (hidden && active) return 'active-hidden';
    if (hidden) return 'hidden';
    if (active) return 'active';
    return '';
}
