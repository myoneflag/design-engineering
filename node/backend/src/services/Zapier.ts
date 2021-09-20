import Config from '../config/config'
import request from 'request'

export default class Zapier {

    static async makeZapierCall(url:string, data: any) {
        return request.post(url, { json: data })
    }

    static async callCreateHubSpotContact(user: { firstName: string, lastName: string, email: string, associatedOrganizationId?: string }) {
        try {
            return Zapier.makeZapierCall(Config.WEBHOOK_ZAPIER_CREATE_HUBSPOT_CONTACT, user)
        } catch(err) {
            console.warn(err);
        }
    }
}
