import { ScreenshotHelper } from './ScreenshotHelper'
import { IProcessingHelperDeps } from './main'
import { GmailHelper, GmailConfig } from './GmailHelper'

export class ProcessingHelper {
  private deps: IProcessingHelperDeps
  private screenshotHelper: ScreenshotHelper
  private gmailHelper: GmailHelper

  constructor(deps: IProcessingHelperDeps) {
    this.deps = deps
    this.screenshotHelper = deps.getScreenshotHelper()
    const config: GmailConfig = {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
      user: process.env.GMAIL_EMAIL_FROM || '',
      to: process.env.GMAIL_EMAIL_TO || process.env.GMAIL_EMAIL_FROM || ''
    }
    this.gmailHelper = new GmailHelper(config)
  }

  public async processScreenshots(): Promise<void> {
    const mainWindow = this.deps.getMainWindow()
    const screenshots = this.screenshotHelper.getScreenshotQueue()

    if (screenshots.length === 0) {
      mainWindow?.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS)
      return
    }

    mainWindow?.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_START)

    try {
      await this.gmailHelper.sendScreenshots(screenshots)
      this.screenshotHelper.clearQueues()
      mainWindow?.webContents.send(this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS, {
        message: 'Screenshots sent via email'
      })
    } catch (err: any) {
      mainWindow?.webContents.send(
        this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
        err?.message || 'Failed to send email'
      )
    }
  }

  public cancelOngoingRequests(): void {}
  public cancelProcessing(): void {}
}
