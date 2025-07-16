import fs from 'node:fs'
import path from 'node:path'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

export interface GmailConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  user: string
  to: string
}

export class GmailHelper {
  private config: GmailConfig

  constructor(config: GmailConfig) {
    this.config = config
  }

  private async createTransport() {
    const { clientId, clientSecret, refreshToken, user } = this.config
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { token } = await oauth2Client.getAccessToken()

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken: token as string
      }
    })
  }

  public async sendScreenshots(paths: string[]) {
    if (paths.length === 0) return

    const attachments = paths.map((p) => ({
      filename: path.basename(p),
      path: p
    }))

    const transport = await this.createTransport()

    await transport.sendMail({
      from: this.config.user,
      to: this.config.to,
      subject: 'Screenshots',
      text: 'Attached are the captured screenshots.',
      attachments
    })
  }
}
