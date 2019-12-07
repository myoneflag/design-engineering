import {CalculationParameters, FlowSystemParameters, GeneralInfo} from '../../src/store/document/types';
import {SupportedPsdStandards} from '../../src/config';

export const gi1: GeneralInfo = {
    approved: '',
    client: '',
    description: '',
    designer: '',
    projectNumber: '',
    projectStage: '',
    reviewed: '',
    revision: 1,
    title: 'asdfwef',
};

export const gi2: GeneralInfo = {
    approved: '',
    client: '',
    description: 'wefwe',
    designer: '',
    projectNumber: 'egreg',
    projectStage: '',
    reviewed: 'fewfwe',
    revision: 2,
    title: 'tkrjhnreigjmriofjer',
};

export const gi3: GeneralInfo = {
    approved: '',
    client: '',
    description: 'wefwe',
    designer: '',
    projectNumber: 'egreg',
    projectStage: '',
    reviewed: '',
    revision: 3,
    title: '',
};


export const ws1: FlowSystemParameters = {
    color: {hex: '#0000ff'},
    material: 'wat',
    name: 'the',
    spareCapacity: 0,
    temperature: 1,
    velocity: 0,
    uid: 'bweuyifgwe',
    fluid: 'water',
};

export const ws2: FlowSystemParameters = {
    color: {hex: '#ff0000'},
    material: 'wat',
    name: 'the',
    spareCapacity: 0,
    temperature: 1,
    velocity: 1,
    uid: 'werfewjknfhwiejhb',
    fluid: 'water',
};

export const cp1: CalculationParameters = {
    ceilingPipeHeightM: 3.0,
    gravitationalAcceleration: 9.80665,
    roomTemperatureC: 22,
    pipeSizingMethod: '',
    psdMethod: SupportedPsdStandards.as35002018LoadingUnits,
    ringMainCalculationMethod: '',
};
