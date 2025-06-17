// ProcessingHelper.ts
import fs from "node:fs"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { IProcessingHelperDeps } from "./main"
import { app } from "electron"
import { BrowserWindow } from "electron"
import OpenAI from "openai"

const isDev = !app.isPackaged
const API_BASE_URL = isDev
  ? "http://localhost:3000"
  : "https://www.interviewcoder.co"

export class ProcessingHelper {
  private deps: IProcessingHelperDeps
  private screenshotHelper: ScreenshotHelper
  private readonly openRouterApiKey: string

  private openai: OpenAI

  // AbortControllers for API requests
  private currentProcessingAbortController: AbortController | null = null
  private currentExtraProcessingAbortController: AbortController | null = null

  constructor(deps: IProcessingHelperDeps) {
    this.deps = deps
    this.screenshotHelper = deps.getScreenshotHelper()

    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || ""

    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: this.openRouterApiKey,
      defaultHeaders: {
        "HTTP-Referer": "interviewcoder-app",
        "X-Title": "InterviewCoder"
      }
    })
  }

  private async waitForInitialization(
    mainWindow: BrowserWindow
  ): Promise<void> {
    let attempts = 0
    const maxAttempts = 50 // 5 seconds total

    while (attempts < maxAttempts) {
      const isInitialized = await mainWindow.webContents.executeJavaScript(
        "window.__IS_INITIALIZED__"
      )
      if (isInitialized) return
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }
    throw new Error("App failed to initialize after 5 seconds")
  }

  private async getCredits(): Promise<number> {
    // Always return a high number of credits
    return 999
  }

  private async getLanguage(): Promise<string> {
    const mainWindow = this.deps.getMainWindow()
    if (!mainWindow) return "java"

    try {
      await this.waitForInitialization(mainWindow)
      const language = await mainWindow.webContents.executeJavaScript(
        "window.__LANGUAGE__"
      )

      if (
        typeof language !== "string" ||
        language === undefined ||
        language === null
      ) {
        console.warn("Language not properly initialized")
        return "java"
      }

      return language
    } catch (error) {
      console.error("Error getting language:", error)
      return "java"
    }
  }

  public async processScreenshots(): Promise<void> {
    const mainWindow = this.deps.getMainWindow()
    if (!mainWindow) return

    // Credits check is bypassed - we always have enough credits

    const view = this.deps.getView()
    console.log("Processing screenshots in view:", view)

    if (view === "queue") {
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_START)
      const screenshotQueue = this.screenshotHelper.getScreenshotQueue()
      console.log("Processing main queue screenshots:", screenshotQueue)
      if (screenshotQueue.length === 0) {
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS)
        return
      }

      this.currentProcessingAbortController = new AbortController()
      const { signal } = this.currentProcessingAbortController

      try {
        const screenshots = await Promise.all(
          screenshotQueue.map(async (path) => ({
            path,
            preview: await this.screenshotHelper.getImagePreview(path),
            data: fs.readFileSync(path).toString("base64")
          }))
        )

        const solveResult = await this.solveProblemWithScreenshots(
          screenshots,
          signal
        )

        if (!solveResult.success) {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            solveResult.error
          )
          this.deps.setView("queue")
          return
        }

        this.screenshotHelper.clearExtraScreenshotQueue()

        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS,
          solveResult.data
        )
        this.deps.setView("solutions")
      } catch (err: any) {
        const errorMsg =
          err?.message ||
          (err?.name === "AbortError"
            ? "Processing was canceled by the user."
            : "An unknown error occurred")
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
          errorMsg
        )
        this.deps.setView("queue")
      } finally {
        this.currentProcessingAbortController = null
      }
      return
    }

    const extraScreenshotQueue = this.screenshotHelper.getExtraScreenshotQueue()
    if (extraScreenshotQueue.length === 0) {
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS)
      return
    }

    mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.DEBUG_START)
    this.currentExtraProcessingAbortController = new AbortController()
    const { signal } = this.currentExtraProcessingAbortController

    try {
      const screenshots = await Promise.all(
        [
          ...this.screenshotHelper.getScreenshotQueue(),
          ...extraScreenshotQueue
        ].map(async (path) => ({
          path,
          preview: await this.screenshotHelper.getImagePreview(path),
          data: fs.readFileSync(path).toString("base64")
        }))
      )

      const debugResult = await this.solveDebugWithScreenshots(
        screenshots,
        signal
      )

      if (debugResult.success) {
        this.deps.setHasDebugged(true)
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.DEBUG_SUCCESS,
          debugResult.data
        )
      } else {
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
          debugResult.error
        )
      }
    } catch (err: any) {
      const errMsg =
        err?.name === "AbortError"
          ? "Extra processing was canceled by the user."
          : err?.message || "An unknown error occurred"
      mainWindow.webContents.send(
        this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
        errMsg
      )
    } finally {
      this.currentExtraProcessingAbortController = null
    }
  }

  public cancelOngoingRequests(): void {
    if (this.currentProcessingAbortController) {
      this.currentProcessingAbortController.abort()
      this.currentProcessingAbortController = null
    }
    if (this.currentExtraProcessingAbortController) {
      this.currentExtraProcessingAbortController.abort()
      this.currentExtraProcessingAbortController = null
    }
    this.deps.setHasDebugged(false)
    this.deps.setProblemInfo(null)

    const mainWindow = this.deps.getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS)
    }
  }

  public cancelProcessing(): void {
    if (this.currentProcessingAbortController) {
      this.currentProcessingAbortController.abort()
      this.currentProcessingAbortController = null
    }
    if (this.currentExtraProcessingAbortController) {
      this.currentExtraProcessingAbortController.abort()
      this.currentExtraProcessingAbortController = null
    }
  }


  private async solveProblemWithScreenshots(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.openRouterApiKey) {
      return {
        success: false,
        error: "OpenRouter API key not found. Please set OPENROUTER_API_KEY."
      }
    }

    const mainWindow = this.deps.getMainWindow()

    try {
      const language = await this.getLanguage()
      const imageContent = screenshots.map((s) => ({
        type: "image_url" as const,
        image_url: { url: `data:image/png;base64,${s.data}` }
      }))

      const messages: any[] = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are given screenshots of a coding problem. Analyze them to extract the problem details and produce a complete solution in ${language}. Take any provided example test cases, constraints, starting code, etc into account.

Return ONLY JSON with exactly these keys:
1) \"title\": string
2) \"problem_statement\": string
3) \"test_cases\": array of objects ({ \"input\": string, \"output\": string, \"explanation\": string })
4) \"constraints\": array of strings
5) \"thoughts\": array of short bullet strings (explain your reasoning)
6) \"code\": string (full source code with appropriate indentation and spacing for language. include a brief comment ABOVE EVERY LINE, no extra blank lines. use proper indentation and spacing depending on the language)
7) \"time_complexity\": string
8) \"space_complexity\": string`
            },
            ...imageContent
          ]
        }
      ]

      const response = await this.openai.chat.completions.create(
        {
          model: "openai/o4-mini-high",
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "full_problem_solve_and_extract",
              strict: false,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  problem_statement: { type: "string" },
                  test_cases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        input: { type: "string" },
                        output: { type: "string" },
                        explanation: { type: "string" }
                      },
                      required: ["input", "output"]
                    }
                  },
                  constraints: { type: "array", items: { type: "string" } },
                  thoughts: { type: "array", items: { type: "string" } },
                  code: { type: "string" },
                  time_complexity: { type: "string" },
                  space_complexity: { type: "string" }
                },
                required: [
                  "problem_statement",
                  "thoughts",
                  "code",
                  "time_complexity",
                  "space_complexity"
                ]
              }
            }
          }
        },
        { signal }
      )

      const rawContent = response.choices[0]?.message?.content || ""
      const parsed = JSON.parse(rawContent)

      const problemInfo = {
        title: parsed.title,
        problem_statement: parsed.problem_statement,
        test_cases: parsed.test_cases,
        constraints: parsed.constraints
      }

      const solutionData = {
        thoughts: parsed.thoughts,
        code: parsed.code,
        time_complexity: parsed.time_complexity,
        space_complexity: parsed.space_complexity
      }

      this.deps.setProblemInfo(problemInfo)
      if (mainWindow) {
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.PROBLEM_EXTRACTED,
          problemInfo
        )
      }

      return { success: true, data: solutionData }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return { success: false, error: "Processing canceled by user." }
      }
      return { success: false, error: err?.message || "Unknown error" }
    }
  }


  private async solveDebugWithScreenshots(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal
  ): Promise<{
    success: boolean
    data?: {
      new_code: string
      thoughts: string[]
      time_complexity: string
      space_complexity: string
    }
    error?: string
  }> {
    if (!this.openRouterApiKey) {
      return {
        success: false,
        error: "OpenRouter API key not found. Please set OPENROUTER_API_KEY."
      }
    }

    const problemInfo = this.deps.getProblemInfo()
    if (!problemInfo) {
      return {
        success: false,
        error: "Cannot debug without original problem context. Please restart."
      }
    }

    try {
      const language = await this.getLanguage()
      const imageContent = screenshots.map((s) => ({
        type: "image_url" as const,
        image_url: { url: `data:image/png;base64,${s.data}` }
      }))

      let problemDescription = `Original Problem:\nDescription: ${problemInfo.problem_statement}`
      
      if (problemInfo.title) {
        problemDescription = `Original Problem:\nTitle: ${problemInfo.title}\nDescription: ${problemInfo.problem_statement}`
      }
      
      if (problemInfo.constraints && problemInfo.constraints.length > 0) {
        problemDescription += `\nConstraints: ${problemInfo.constraints.join(", ")}`
      }
      
      if (problemInfo.test_cases && problemInfo.test_cases.length > 0) {
        problemDescription += `\nTest Cases: ${problemInfo.test_cases.map((tc: { input: string; output: string; explanation?: string }) => `Input: ${tc.input}, Output: ${tc.output}${tc.explanation ? `, Explanation: ${tc.explanation}` : ''}`).join("; ")}`
      }

      const messages: any[] = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `The screenshots show buggy code and/or failing tests.\n\n${problemDescription}\n\nFix the code to solve the problem. Return ONLY JSON with keys: new_code, thoughts, time_complexity, space_complexity. Include comments above every line of code you changed. Use proper indentation and spacing depending on the language.`
            },
            ...imageContent
          ]
        }
      ]

      const response = await this.openai.chat.completions.create(
        {
          model: "openai/o4-mini-high",
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "debug_fix",
              strict: false,
              schema: {
                type: "object",
                properties: {
                  new_code: { type: "string" },
                  thoughts: { type: "array", items: { type: "string" } },
                  time_complexity: { type: "string" },
                  space_complexity: { type: "string" }
                },
                required: [
                  "new_code",
                  "thoughts",
                  "time_complexity",
                  "space_complexity"
                ]
              }
            }
          }
        },
        { signal }
      )

      const rawContent = response.choices[0]?.message?.content || ""
      const parsed = JSON.parse(rawContent)
      return { success: true, data: parsed }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return { success: false, error: "Debug canceled by user." }
      }
      return { success: false, error: err?.message || "Unknown error" }
    }
  }
}
