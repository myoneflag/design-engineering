import { DrawingMode } from "../../htmlcanvas/types"
import { ONBOARDING_SCREEN } from "./types"

export interface OnboardingSteps {
    [key: string]: Array<{
        step: number, 
        title: string, 
        text?: string, 
        mode?: DrawingMode
    }>
}

export enum HomeStep {
    Expert = 1
}

export enum DocumentStep {
    Tour = 1,
    FloorPlan,
    Plumbing,
    Results,
    Export,
    Levels,
    Settings,
    FlowSystems,
    FlowSource,
    Riser,
    Reticulation,
    Connection,
    BigValves,
    Plant,
    Fixtures,
    Valves,
    Nodes,
    Done
}

export enum SettingsStep { 
    General = 1,
    Units,
    Catalog, 
    Fixtures, 
    FlowSystems, 
    Calculations, 
    Document
}

export const ONBOARDING_STEPS = {
    [ONBOARDING_SCREEN.HOME]: [
        {   
            step: HomeStep.Expert,
            title: 'Become an expert',
            text: 'By watching our bite size videos, it takes less than 10 minutes to get familiar with how H2X works',
        }
    ],
    [ONBOARDING_SCREEN.DOCUMENT]: [
        {
            step: DocumentStep.Tour,
            title: 'Let’s take a quick tour',
        },
        {
            step: DocumentStep.FloorPlan,
            title: 'Floor plan workspace',
            text: 'This is where you import and modify PDF backgrounds',
        },
        {
            step: DocumentStep.Plumbing,
            title: 'Plumbing workspace',
            text: 'This is where you design your system',
        },
        {
            step: DocumentStep.Results,
            title: 'Results workspace',
            text: 'This is where you view results',
        },
        {
            step: DocumentStep.Export,
            title: 'Export workspace',
            text: 'This is where you can share and export results',
        },
        {
            step: DocumentStep.Levels,
            title: 'Manage levels',
            text: 'This is where you add and modify new levels',
        },
        {
            step: DocumentStep.Settings,
            title: 'Change the settings',
            text: 'Add project information and change design parameters here',
        },
        {
            step: DocumentStep.FlowSystems,
            title: 'Hot water?',
            text: 'Choose your service here',
            mode: DrawingMode.Hydraulics,                
        },
        {
            step: DocumentStep.FlowSource,
            title: 'Start with the flow source',
            text: 'This is the water main connection or equivalent',
        },
        {
            step: DocumentStep.Riser,
            title: 'Riser',
            text: 'Use this to draw a pipe that can be seen on other floor levels',
        },
        {
            step: DocumentStep.Reticulation,
            title: 'Reticulation pipe',
            text: 'Use this pipe to reticulate through the building',
        },
        {
            step: DocumentStep.Connection,
            title: 'Connection pipe',
            text: 'This is used for making the connection to the fixture, also known as first fix or roughin',
        },
        {
            step: DocumentStep.BigValves,
            title: 'Backflow and mixing valves',
            text: 'These valves are used to serve fixtures or groups of fixtures',
        },
        {
            step: DocumentStep.Plant,
            title: 'Add plant to your system',
            text: 'Whether it is hot water plant, booster pumps, storage tanks or something custom, you can add it here',
        },
        {
            step: DocumentStep.Fixtures,
            title: 'Stamp fixtures',
            text: 'Select fixtures from the drop down and locate them where required',
        },
        {
            step: DocumentStep.Valves,
            title: 'Add valves',
            text: 'Valves will increase the pressure loss in your system, select the required ones from the drop down menu and stamp on the pipes',
        },
        {
            step: DocumentStep.Nodes,
            title: 'Add a node',
            text: 'This is a quick way to increase the load on pipes instead of stamping fixtures',
        },
        {
            step: DocumentStep.Done,
            title: 'Should we do our first project together?',
            text: `Follow this <a href="https://www.youtube.com/playlist?list=PLIdFxhDHcGgwHcBSDr5L_9K3FKGlyzO1S" target="_blank">Youtube video</a> and <a href="https://drive.google.com/drive/folders/1DQc6Fs7Q1N_YwdhoGaYmkkVVEXxSj0ZK?usp=sharing" target="_blank">download these files</a>`,
        },
    ],
    [ONBOARDING_SCREEN.DOCUMENT_SETTING]: [
        {
            step: SettingsStep.General,
            title: 'General',
            text: 'This is where you add project specific information'
        },
        {
            step: SettingsStep.Units,
            title: 'Units',
            text: 'You can change between metric and imperials units here',
        },
        {
            step: SettingsStep.Catalog,
            title: 'Catalog',
            text: 'Check out the properties of each component',
        },
        {
            step: SettingsStep.Fixtures,
            title: 'Fixtures',
            text: 'This is where you choose what fixtures to use on your project',
        },
        {
            step: SettingsStep.FlowSystems,
            title: 'Flow systems',
            text: 'Here, you can add a new flow system or change the parameters of the existing ones',
        },
        {
            step: SettingsStep.Calculations,
            title: 'Calculations',
            text: 'Change calculations such as the peak flow rate method here',
        },
        {
            step: SettingsStep.Document,
            title: 'Document',
            text: 'Delete or reset the document here',
        },
    ]};
