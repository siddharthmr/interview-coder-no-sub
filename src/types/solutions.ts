export interface Solution {
  initial_thoughts: string[]
  thought_steps: string[]
  description: string
  code: string
}

export interface SolutionsResponse {
  [key: string]: Solution
}

export interface ProblemStatementData {
  title?: string
  current_level: number
  level_description: string
}

export interface SolutionData {
  thoughts: string[]
  solution_files: { [filename: string]: string }
  level_summary: string
  current_level: number
}
