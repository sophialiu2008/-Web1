import * as $OpenApi from '@alicloud/openapi-client'
import Dysmsapi, * as $Dysmsapi from '@alicloud/dysmsapi20170525'

const createSmsClient = () => {
    const config = new $OpenApi.Config({
        accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
        endpoint: 'dysmsapi.aliyuncs.com'
    })
    // For ESM interop with Alicloud SDK
    const ClientClass = (Dysmsapi as any).default || Dysmsapi
    return new ClientClass(config)
}

export const generateCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export const sendSmsCode = async (phone: string, code: string) => {
    const client = createSmsClient()

    const request = new $Dysmsapi.SendSmsRequest({
        phoneNumbers: phone,
        signName: process.env.SMS_SIGN_NAME,
        templateCode: process.env.SMS_TEMPLATE_CODE,
        templateParam: JSON.stringify({ code })
    })

    const response = await client.sendSms(request)
    console.log('短信发送结果:', JSON.stringify(response.body))

    if (response.body.code !== 'OK') {
        throw new Error(`短信发送失败: ${response.body.message}`)
    }

    return response.body
}

export const sendNotificationSms = async (phone: string, templateCode: string, templateParam: object = {}) => {
    const client = createSmsClient()
    const phoneNumber = phone.replace(/^\+86/, '')

    const request = new $Dysmsapi.SendSmsRequest({
        phoneNumbers: phoneNumber,
        signName: process.env.SMS_SIGN_NAME,
        templateCode: templateCode,
        templateParam: JSON.stringify(templateParam)
    })

    const response = await client.sendSms(request)
    console.log(`通知短信发送结果 (模板 ${templateCode}):`, JSON.stringify(response.body))

    if (response.body.code !== 'OK') {
        throw new Error(`通知短信发送失败: ${response.body.message}`)
    }

    return response.body
}
