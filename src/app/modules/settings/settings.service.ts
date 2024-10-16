import { TSettings } from "./settings.interface"
import { SettingsModel } from "./settings.model"

const createSettingsIntoDb = async (payload: TSettings) => {
    const result = await SettingsModel.updateOne({label:payload.label},payload,{upsert:true})
    return result
}

const getSettingsFromDb = async () => {
    const result = await SettingsModel.find()
    return result
}

const updateSettingsIntoDb = async (payload: TSettings) => {
    const result = await SettingsModel.updateOne({label:payload.label},payload,{upsert:true})
    return result
}

export const SettingsServices = {
    createSettingsIntoDb,
    updateSettingsIntoDb,
    getSettingsFromDb
}